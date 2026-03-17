# Score Update API — Module Specification

> **Version:** 1.0.0 · **Status:** Ready for Implementation · **Audience:** Backend Engineering

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Architecture](#2-system-architecture)
3. [Execution Flow](#3-execution-flow)
4. [API Reference](#4-api-reference)
5. [Data Design](#5-data-design)
6. [Security Model](#6-security-model)
7. [Real-Time Delivery (SSE)](#7-real-time-delivery-sse)
8. [Idempotency](#8-idempotency)
9. [Rate Limiting](#9-rate-limiting)
10. [Error Handling](#10-error-handling)
11. [Non-Functional Requirements](#11-non-functional-requirements)
12. [Improvement Notes (Post-v1)](#12-improvement-notes-post-v1)

---

## 1. Overview

This module owns two responsibilities:

1. **Accepting authenticated score-update requests** from the client when a user completes an action, and persisting the result.
2. **Broadcasting the live Top-10 leaderboard** to all connected clients in real time.

### 1.1 Scope

| In scope                             | Out of scope                                        |
| ------------------------------------ | --------------------------------------------------- |
| Score increment on action completion | What the action is or how it is validated           |
| JWT-based authorization              | User login / registration (handled by Auth Service) |
| Duplicate-action prevention          | Frontend rendering of the scoreboard                |
| Live leaderboard push via SSE        | Push notifications to mobile                        |

### 1.2 Core Design Decisions

| Decision             | Choice                                     | Why                                                                      |
| -------------------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| Score value          | Defined server-side only                   | Prevents client from inflating any value                                 |
| Duplicate prevention | Idempotency key (per Stripe pattern)       | Safe retries + replay attack protection                                  |
| Leaderboard store    | Redis Sorted Set (`ZINCRBY` / `ZREVRANGE`) | O(log N) atomic updates; no table scans                                  |
| Real-time push       | Server-Sent Events (SSE)                   | Scoreboard is server→client only; SSE is correct for unidirectional push |
| Multi-instance SSE   | Redis Pub/Sub                              | Score updated on Instance A → broadcast to SSE clients on all instances  |

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                        │
│                                                                  │
│  [Action done]                    [Subscribe to board]          │
│       │                                  │                      │
│  POST /scores/update              GET /scores/live              │
│  Authorization: Bearer JWT        Accept: text/event-stream     │
└───────┬──────────────────────────────────┬──────────────────────┘
        │                                  │
        ▼                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                       API SERVER (this module)                    │
│                                                                   │
│  ┌────────────────────────┐      ┌──────────────────────────┐    │
│  │     Score Handler      │      │      SSE Handler         │    │
│  │                        │      │                          │    │
│  │ 1. Verify JWT          │      │ • Holds open connections │    │
│  │ 2. Check rate limit    │      │ • Subscribes to Redis    │    │
│  │ 3. Check idempotency   │─pub─►│   channel "lb:updates"   │    │
│  │ 4. ZINCRBY Redis       │      │ • Fans out to all clients│    │
│  │ 5. Persist to DB       │      └──────────────────────────┘    │
│  │ 6. Publish SSE event   │                                      │
│  └────────────────────────┘                                      │
└────────────────────┬─────────────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
┌──────────────────┐   ┌────────────────────────┐
│   PostgreSQL     │   │         Redis           │
│                  │   │                         │
│ • scores         │   │ • ZSET leaderboard:glob │
│   (source of     │   │   (hot read/write path) │
│    truth)        │   │                         │
│                  │   │ • idempotency:{key}:{id}│
│ • idempotency_   │   │   (24h TTL, dedup)      │
│   log (audit)    │   │                         │
│                  │   │ • rate:{userId}         │
│                  │   │   (sliding window)      │
│                  │   │                         │
│                  │   │ • Pub/Sub: "lb:updates" │
└──────────────────┘   └────────────────────────┘
```

**Why two stores?**

- **PostgreSQL** is the durable source of truth. It survives Redis restarts and supports full audit queries.
- **Redis Sorted Set** is the live leaderboard. It handles concurrent score reads/writes with O(log N) atomic operations — no `SELECT + ORDER BY` on every update.

On server startup (or Redis failure recovery), the service rebuilds the Redis Sorted Set by reading all rows from `scores` in PostgreSQL.

---

## 3. Execution Flow

### 3.1 Score Update

```
Client                              API Server                       Redis / DB
  │                                      │                               │
  │─── POST /api/v1/scores/update ──────►│                               │
  │    Authorization: Bearer <JWT>       │                               │
  │    Idempotency-Key: <uuid-v4>        │                               │
  │    Body: { "actionId": "act_xyz" }   │                               │
  │                                      │                               │
  │                                      ├─[1] Verify JWT                │
  │                                      │    signature, exp, iss,       │
  │                                      │    aud → userId = sub         │
  │◄── 401 Unauthorized ─────────────────┤    (fail → reject)            │
  │                                      │                               │
  │                                      ├─[2] Check rate limit ────────►│
  │                                      │    INCR rate:{userId}         │
  │◄── 429 Too Many Requests ────────────┤    (exceeded → reject)        │
  │                                      │                               │
  │                                      ├─[3] Check idempotency ───────►│
  │                                      │    GET idempotency:{key}:{uid}│
  │◄── 200 OK (cached response) ─────────┤    (exists → return cache)    │
  │                                      │                               │
  │                                      ├─[4] Acquire lock ────────────►│
  │                                      │    SET lock:{key}:{uid}       │
  │                                      │    NX EX 30                   │
  │                                      │    (concurrent same key→ 409) │
  │                                      │                               │
  │                                      ├─[5] Increment score ─────────►│
  │                                      │    ZINCRBY leaderboard:global │
  │                                      │      SCORE_INCREMENT {userId} │
  │                                      │◄─── new score ────────────────│
  │                                      │                               │
  │                                      ├─[6] Persist to DB ───────────►│
  │                                      │    UPDATE scores              │
  │                                      │    INSERT idempotency_log     │
  │                                      │                               │
  │                                      ├─[7] Fetch new Top-10 ────────►│
  │                                      │    ZREVRANGE 0 9 WITHSCORES   │
  │                                      │◄─── top10 array ──────────────│
  │                                      │                               │
  │                                      ├─[8] Publish event ───────────►│
  │                                      │    PUBLISH lb:updates {top10} │
  │                                      │                               │
  │                                      ├─[9] Cache idempotency result ►│
  │                                      │    SET idempotency:{key}:{uid}│
  │                                      │    {responseJSON} EX 86400    │
  │                                      │                               │
  │◄── 200 OK { userId, newScore, rank } ┤                               │
```

### 3.2 Live Scoreboard (SSE)

```
Client                              API Server                    Redis
  │                                      │                          │
  │─── GET /api/v1/scores/live ─────────►│                          │
  │    Accept: text/event-stream         │                          │
  │                                      ├─ Subscribe ─────────────►│
  │                                      │  SUBSCRIBE lb:updates    │
  │                                      │                          │
  │                                      ├─ Fetch snapshot ─────────►│
  │                                      │  ZREVRANGE 0 9           │
  │◄── event: snapshot ──────────────────┤                          │
  │    data: { top10: [...] }            │                          │
  │                                      │                          │
  │    [connection stays open]           │                          │
  │                                      │◄── PUBLISH lb:updates ───│
  │◄── event: leaderboard_update ────────┤    (broadcast to all     │
  │    data: { top10: [...] }            │     instances' clients)  │
  │                                      │                          │
  │─── [disconnect] ────────────────────►│                          │
  │                                      ├─ Remove client from set  │
  │                                      │  (prevent memory leak)   │
```

---

## 4. API Reference

### 4.1 Update Score

```
POST /api/v1/scores/update
```

**Request Headers**

| Header            | Required | Description                                                                |
| ----------------- | -------- | -------------------------------------------------------------------------- |
| `Authorization`   | ✅       | `Bearer <JWT>` — user identity                                             |
| `Content-Type`    | ✅       | `application/json`                                                         |
| `Idempotency-Key` | ✅       | UUID v4 generated by the client per action attempt. Same key = safe retry. |

**Request Body**

```json
{
  "actionId": "act_01HZ3T8FKBC7RN9PVMXQ"
}
```

| Field      | Type     | Required | Description                                                                                                                   |
| ---------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `actionId` | `string` | ✅       | Unique identifier for the completed action. Stored for audit only — the server never uses this to determine the score amount. |

> **The client never sends a score or increment value.** The server defines `SCORE_INCREMENT_PER_ACTION` as a configuration constant. This is the primary defence against score manipulation.

**Success Response — `200 OK`**

```json
{
  "userId": "usr_01HZ3T8FKBC7RN9PVMXQ",
  "newScore": 1540,
  "rank": 3
}
```

**Idempotent Retry Behaviour**

If the same `Idempotency-Key` + `userId` combination is received within 24 hours, the server returns the original cached `200` response without re-processing. Safe to retry on network failures.

---

### 4.2 Get Live Scoreboard (SSE)

```
GET /api/v1/scores/live
```

**Request Headers**

| Header          | Required | Value               |
| --------------- | -------- | ------------------- |
| `Accept`        | ✅       | `text/event-stream` |
| `Cache-Control` | ✅       | `no-cache`          |

> **No authentication required.** The scoreboard is public.

**SSE Event Format**

```
event: leaderboard_update
data: {"top10":[{"rank":1,"userId":"usr_xyz","username":"alice","score":9800},{"rank":2,"userId":"usr_abc","username":"bob","score":8500}]}

```

The browser's native `EventSource` API auto-reconnects on disconnect. No client-side retry logic needed.

---

### 4.3 Get Current Scoreboard (REST Fallback)

```
GET /api/v1/scores/top
```

For SSR, mobile, or any context where SSE is unavailable.

**Success Response — `200 OK`**

```json
{
  "top10": [
    { "rank": 1, "userId": "usr_xyz", "username": "alice", "score": 9800 },
    { "rank": 2, "userId": "usr_abc", "username": "bob", "score": 8500 }
  ],
  "generatedAt": "2026-03-17T10:00:00.000Z"
}
```

---

## 5. Data Design

### 5.1 PostgreSQL — `scores`

```sql
CREATE TABLE scores (
    user_id     VARCHAR(64)   PRIMARY KEY,   -- FK → users.id
    username    VARCHAR(64)   NOT NULL,      -- denormalized; avoids JOIN on leaderboard reads
    score       BIGINT        NOT NULL DEFAULT 0,
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_scores_score_desc ON scores (score DESC);
```

> `username` is intentionally denormalized. Keep it in sync via an event when a user updates their username.

### 5.2 PostgreSQL — `idempotency_log`

```sql
CREATE TABLE idempotency_log (
    idempotency_key  VARCHAR(255)  NOT NULL,
    user_id          VARCHAR(64)   NOT NULL,
    action_id        VARCHAR(128)  NOT NULL,
    response_body    JSONB         NOT NULL,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    expires_at       TIMESTAMPTZ   NOT NULL,  -- created_at + 24h

    PRIMARY KEY (idempotency_key, user_id)
);

CREATE INDEX idx_idempotency_expires ON idempotency_log (expires_at);
-- Used by cleanup job to efficiently DELETE expired rows
```

### 5.3 Redis — Sorted Set (leaderboard)

```
Key:    leaderboard:global
Type:   Sorted Set (ZSET)
Member: {userId}
Score:  cumulative score (integer)

-- Increment on action:
ZINCRBY leaderboard:global {SCORE_INCREMENT} {userId}

-- Read Top-10:
ZREVRANGE leaderboard:global 0 9 WITHSCORES

-- Get a user's rank (0-indexed):
ZREVRANK leaderboard:global {userId}

-- On Redis recovery: rebuild from PostgreSQL scores table
```

### 5.4 Redis — Idempotency Cache

```
Key:    idempotency:{idempotencyKey}:{userId}
Type:   String (JSON)
TTL:    86400 seconds (24 hours)

-- Lock (prevent race on concurrent same-key requests):
SET idempotency:{key}:{userId} "processing" NX EX 30

-- Store result after processing:
SET idempotency:{key}:{userId} {responseJSON} EX 86400

-- Check on retry:
GET idempotency:{key}:{userId}
```

### 5.5 Configuration Constants

| Constant                      | Default | Notes                              |
| ----------------------------- | ------- | ---------------------------------- |
| `SCORE_INCREMENT_PER_ACTION`  | `10`    | Server-only. Never sent by client. |
| `RATE_LIMIT_MAX_REQUESTS`     | `10`    | Per user per window.               |
| `RATE_LIMIT_WINDOW_SECONDS`   | `60`    | Sliding window.                    |
| `IDEMPOTENCY_KEY_TTL_SECONDS` | `86400` | 24h — Stripe industry standard.    |
| `SSE_KEEPALIVE_INTERVAL_MS`   | `30000` | Keep-alive comment interval.       |

---

## 6. Security Model

### 6.1 JWT Validation (every POST request)

All checks must pass before any business logic runs:

```
// Pseudocode
token  = request.headers["Authorization"].replace("Bearer ", "")
claims = jwt.verify(token, JWT_SECRET, {
             algorithms : ["HS256"],   // NEVER allow "alg: none"
             issuer     : "auth-service",
             audience   : "score-service"
         })
userId = claims.sub   // ALWAYS from token — never from request body
```

| Check     | Rule                                                               |
| --------- | ------------------------------------------------------------------ |
| Signature | Reject any tampered or unsigned token. Reject `alg: none`.         |
| `exp`     | Must be in the future.                                             |
| `iss`     | Must match the configured Auth Service identifier.                 |
| `aud`     | Must match this service's own identifier.                          |
| `sub`     | The only trusted `userId` source. Ignore any `userId` in the body. |

### 6.2 Why the Client Never Sends a Score

The request body contains only `actionId`. The server applies `SCORE_INCREMENT_PER_ACTION` from config.

- Reverse-engineering the API yields no field to inject a custom score.
- A stolen valid JWT can only trigger one increment of the configured constant, bounded by the rate limit.
- Damage from a compromised token is deterministic and limited.

### 6.3 Idempotency Key Scoping

Cache keys are scoped as `idempotency:{key}:{userId}`. This prevents two different users sending the same key string from receiving each other's cached response.

### 6.4 Transport Security

- All endpoints served over **HTTPS only**. Redirect HTTP → HTTPS.
- JWTs must never travel over plain HTTP.

---

## 7. Real-Time Delivery (SSE)

### 7.1 Why SSE, Not WebSocket

The scoreboard is a **one-way server push**. SSE is the correct tool for this pattern.

| Criterion             | SSE                    | WebSocket                  |
| --------------------- | ---------------------- | -------------------------- |
| Direction             | Server → Client        | Bidirectional              |
| Protocol              | Plain HTTP/1.1         | Requires upgrade handshake |
| Auto-reconnect        | Native (`EventSource`) | Must implement manually    |
| Complexity            | Low                    | Higher                     |
| Fit for this use case | ✅ Correct choice      | Overkill                   |

### 7.2 Multi-Instance Fan-Out via Redis Pub/Sub

With multiple server instances behind a load balancer, a score update processed on Instance A must reach SSE clients connected to Instances B and C.

```
Score updated on Instance A
         │
         └──► PUBLISH lb:updates {top10 JSON}
                       │
              ┌────────┼────────┐
              ▼        ▼        ▼
          Instance A  Instance B  Instance C
         (local SSE) (local SSE) (local SSE)
          clients     clients     clients
```

Each server instance maintains **one** Redis Pub/Sub subscriber for `lb:updates` and broadcasts to all its in-memory SSE connections.

### 7.3 Server Implementation Notes

```
Required response headers:
  Content-Type:    text/event-stream
  Cache-Control:   no-cache
  Connection:      keep-alive
  X-Accel-Buffering: no   ← REQUIRED if behind Nginx (disables response buffering)

On client connect:
  1. Register response object in SSE subscriber map
  2. Send current snapshot immediately:
     event: snapshot\ndata: {top10}\n\n

On Redis Pub/Sub message received:
  1. Parse top10 JSON
  2. Write to all registered SSE response objects:
     event: leaderboard_update\ndata: {top10}\n\n

Keep-alive (every 30 seconds):
  Write: ": keep-alive\n\n"
  (Prevents proxies from closing idle connections)

On client disconnect:
  Remove response object from subscriber map (prevent memory leak)
```

---

## 8. Idempotency

This module implements idempotency following the same pattern as Stripe's production API.

### 8.1 How It Works

1. Client generates a **UUID v4** before sending the request and includes it as `Idempotency-Key`.
2. Server checks `GET idempotency:{key}:{userId}` in Redis.
   - **Found:** Return cached response immediately. Do not re-process.
   - **Not found:** Process normally, cache response with 24h TTL.
3. Client may safely retry with the same key on any network failure.

### 8.2 What This Prevents

| Scenario                                 | Without                 | With                          |
| ---------------------------------------- | ----------------------- | ----------------------------- |
| User double-clicks                       | Score incremented twice | Once                          |
| Network timeout, client retries          | Score incremented twice | Once                          |
| Replay attack (captured request re-sent) | Score incremented again | Returns cached original `200` |

### 8.3 Race Condition Guard

Two simultaneous requests with the same key could both pass the Redis check before either writes the result. Guard with a distributed lock:

```
SET idempotency:{key}:{userId} "processing" NX EX 30
  → If NX fails (key exists): return 409 Conflict — retry after 1s
  → If NX succeeds: proceed, then overwrite with actual response + full 24h TTL
```

### 8.4 Cleanup

Redis keys expire automatically via TTL. The `idempotency_log` PostgreSQL table is cleaned by a nightly job using `DELETE WHERE expires_at < now()`, leveraging the `idx_idempotency_expires` index.

---

## 9. Rate Limiting

Goal: Even with a valid JWT, a user cannot spam score-update requests.

**Algorithm:** Sliding window counter in Redis, keyed per `userId`.

```
Key:   rate:{userId}
TTL:   RATE_LIMIT_WINDOW_SECONDS (60)

On each request:
  count = INCR rate:{userId}
  if count == 1 → EXPIRE rate:{userId} 60   (set TTL on first request)
  if count > 10 → return 429
```

**Response headers on `429`:**

```
HTTP 429 Too Many Requests
Retry-After: 42
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1742204560
```

---

## 10. Error Handling

All errors use a consistent response envelope:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "JWT token is expired.",
    "correlationId": "req_01HZ3T8FKBC7RN9PVMXQ"
  }
}
```

| HTTP Status                 | Code                     | Trigger                                                           |
| --------------------------- | ------------------------ | ----------------------------------------------------------------- |
| `400 Bad Request`           | `INVALID_REQUEST`        | Missing / malformed `actionId` or `Idempotency-Key`               |
| `401 Unauthorized`          | `UNAUTHORIZED`           | Missing, invalid, expired, or tampered JWT                        |
| `409 Conflict`              | `IDEMPOTENCY_KEY_IN_USE` | Same key received concurrently — retry after 1s                   |
| `429 Too Many Requests`     | `RATE_LIMIT_EXCEEDED`    | Per-user rate limit exceeded                                      |
| `500 Internal Server Error` | `INTERNAL_ERROR`         | Unexpected fault — log internally; never expose details to client |

Include `correlationId` on all `5xx` responses so the on-call engineer can trace the request in logs.

---

## 11. Non-Functional Requirements

| Requirement                    | Target                                                   |
| ------------------------------ | -------------------------------------------------------- |
| Score update latency (p99)     | < 200ms end-to-end                                       |
| Leaderboard read latency (p99) | < 50ms (Redis read)                                      |
| SSE broadcast latency          | < 500ms from score persisted                             |
| Data durability                | Zero score loss (PostgreSQL = source of truth)           |
| Redis failure recovery         | Rebuild leaderboard from PostgreSQL on restart           |
| Horizontal scaling             | Stateless API instances; all state in Redis + PostgreSQL |

---

## 12. Improvement Notes (Post-v1)

Not required for v1. Flagged so v1 does not accidentally block these upgrades.

### 12.1 Server-Issued Action Tokens _(Medium priority)_

Currently, any valid JWT + unused idempotency key can trigger a score increment. A user with a valid JWT could generate `actionId` values without completing the actual action.

Fix: The backend issues a short-lived, single-use **action token** when a session starts. The score update endpoint validates this token. This closes the gap entirely.

Design impact: Requires a new `POST /api/v1/actions/claim` endpoint. No schema changes to the score update flow.

### 12.2 Redis High Availability _(High priority before production scale)_

The current spec uses a single Redis instance. Before production, add **Redis Sentinel** or **Redis Cluster** for automatic failover. Managed services (AWS ElastiCache, Upstash) reduce operational overhead significantly.

### 12.3 Async DB Write / Write-Back Pattern _(Low priority, high traffic only)_

Under very high write volume, consider writing to Redis first, then flushing to PostgreSQL asynchronously in micro-batches (e.g., every 100ms). Trade-off: small risk of data loss in the flush window if Redis fails. Do not adopt this until profiling shows the synchronous DB write is a bottleneck.

### 12.4 `idempotency_log` Partitioning _(Low priority)_

The table will grow linearly. Use PostgreSQL declarative partitioning by `created_at` (monthly range partitions). Drop old partitions rather than running large DELETE jobs against the full table.

---
