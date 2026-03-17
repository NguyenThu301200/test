# Problem 5 — Express.js CRUD Server

A RESTful CRUD API for managing resources, built with **Express.js v5**, **TypeScript**, and **SQLite** (via `better-sqlite3`).

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running the Server](#running-the-server)
- [Debugging](#debugging)
- [Testing the API](#testing-the-api)
- [API Endpoints](#api-endpoints)
- [Error Responses](#error-responses)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)

---

## Prerequisites

| Tool        | Version | Notes                              |
| ----------- | ------- | ---------------------------------- |
| **Node.js** | ≥ 20    | Required for `crypto.randomUUID()` |
| **npm**     | ≥ 9     | Comes with Node.js                 |

> [!NOTE]
> No external database is needed — SQLite runs as an embedded library.

---

## Setup

```bash
# 1. Clone the repository (if you haven't already)
git clone <repo-url>
cd code-challenge/src/problem5

# 2. Install dependencies
npm install
```

That's it! The SQLite database file (`db.sqlite`) is created **automatically** on first run.

---

## Running the Server

### Development (with hot-reload)

```bash
npm run dev
```

Uses `ts-node-dev` with `--respawn` to watch for file changes and auto-restart.

### Production

```bash
# Compile TypeScript to JavaScript
npm run build

# Run the compiled output
npm start
```

The server starts on **`http://localhost:3000`** by default.

---

## Debugging

### Method 1: VS Code Debugger (Recommended)

1. Create `.vscode/launch.json` in the **problem5** directory:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Problem 5",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/ts-node-dev",
      "args": ["--respawn", "src/index.ts"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "sourceMaps": true
    }
  ]
}
```

2. Set breakpoints in any `.ts` file, then press **F5** to start debugging.

### Method 2: Node.js `--inspect` Flag

```bash
# Start with Node.js inspector
node --inspect -r ts-node/register src/index.ts
```

Then open `chrome://inspect` in Chrome and connect to the debugger.

### Method 3: Console Logging

The global error handler (`src/middleware/errorHandler.ts`) already logs unhandled errors to the console:

```
Unhandled error: <error message>
```

You can add `console.log()` statements anywhere in the source files — `ts-node-dev` will auto-restart when you save.

---

## Testing the API

You can test the API manually using **curl**, **Postman**, or any HTTP client.

### Quick Smoke Test (curl)

Run these commands in order after starting the server:

```bash
# 1. Create a resource
curl -s -X POST http://localhost:3000/resources \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Resource", "status": "active"}' | jq

# 2. List all resources
curl -s http://localhost:3000/resources | jq

# 3. Get a single resource (replace <id> with the id from step 1)
curl -s http://localhost:3000/resources/<id> | jq

# 4. Update a resource
curl -s -X PUT http://localhost:3000/resources/<id> \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name", "status": "inactive"}' | jq

# 5. Delete a resource
curl -s -X DELETE http://localhost:3000/resources/<id> -w "\nHTTP Status: %{http_code}\n"

# 6. Verify deletion (should return 404)
curl -s http://localhost:3000/resources/<id> | jq
```

> [!TIP]
> Install `jq` for pretty-printed JSON output: `brew install jq` (macOS) or `apt install jq` (Linux).

### Test Validation Errors

```bash
# Missing name → 400
curl -s -X POST http://localhost:3000/resources \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}' | jq

# Invalid status → 400
curl -s -X POST http://localhost:3000/resources \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "status": "unknown"}' | jq

# Non-existent resource → 404
curl -s http://localhost:3000/resources/non-existent-id | jq
```

### Test with Postman

1. Import the base URL: `http://localhost:3000`
2. Create requests for each endpoint listed in the [API Endpoints](#api-endpoints) section
3. Set `Content-Type: application/json` header for POST/PUT requests

---

## API Endpoints

All responses follow a consistent JSON envelope:

```jsonc
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": "error message" }
```

### `POST /resources` — Create a Resource

**Request Body:**

```json
{
  "name": "My Resource",
  "status": "active"
}
```

| Field    | Type     | Required | Values                    |
| -------- | -------- | -------- | ------------------------- |
| `name`   | `string` | ✅       | Non-empty string          |
| `status` | `string` | ✅       | `"active"` / `"inactive"` |

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My Resource",
    "status": "active",
    "createdAt": "2026-03-17T06:00:00.000Z",
    "updatedAt": "2026-03-17T06:00:00.000Z"
  }
}
```

---

### `GET /resources` — List All Resources

**Query Parameters:**

| Param    | Type     | Required | Description                          |
| -------- | -------- | -------- | ------------------------------------ |
| `status` | `string` | ❌       | Filter by `"active"` or `"inactive"` |

```bash
# All resources
curl http://localhost:3000/resources

# Filter by status
curl http://localhost:3000/resources?status=active
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "My Resource",
      "status": "active",
      "createdAt": "2026-03-17T06:00:00.000Z",
      "updatedAt": "2026-03-17T06:00:00.000Z"
    }
  ]
}
```

---

### `GET /resources/:id` — Get a Resource by ID

```bash
curl http://localhost:3000/resources/550e8400-e29b-41d4-a716-446655440000
```

**Response:** `200 OK` (or `404 Not Found`)

---

### `PUT /resources/:id` — Update a Resource

**Request Body** (same fields as create — full update):

```json
{
  "name": "Updated Name",
  "status": "inactive"
}
```

**Response:** `200 OK` (or `404 Not Found`)

---

### `DELETE /resources/:id` — Delete a Resource

```bash
curl -X DELETE http://localhost:3000/resources/550e8400-e29b-41d4-a716-446655440000
```

**Response:** `204 No Content` (or `404 Not Found`)

---

## Error Responses

| Status | Meaning            | Example Response                                                           |
| ------ | ------------------ | -------------------------------------------------------------------------- |
| `400`  | Validation error   | `{ "success": false, "error": "name is required" }`                        |
| `400`  | Invalid status     | `{ "success": false, "error": "status must be one of: active, inactive" }` |
| `404`  | Resource not found | `{ "success": false, "error": "Resource not found" }`                      |
| `500`  | Internal error     | `{ "success": false, "error": "Internal server error" }`                   |

---

## Project Structure

```text
src/problem5/
├── src/
│   ├── index.ts              # Express app bootstrap & server listen
│   ├── db.ts                 # SQLite connection (WAL mode) + table init
│   ├── models/
│   │   └── resource.ts       # TypeScript interfaces (Resource, DTOs)
│   ├── controllers/
│   │   └── resource.ts       # Business logic (CRUD operations)
│   ├── routes/
│   │   └── resource.ts       # Route handlers for /resources
│   └── middleware/
│       ├── errorHandler.ts   # Global error handler (500 responses)
│       └── validate.ts       # Request body validation middleware
├── dist/                     # Compiled JS output (after `npm run build`)
├── db.sqlite                 # SQLite database (auto-created, gitignored)
├── package.json
├── tsconfig.json
└── README.md
```

---

## Environment Variables

| Variable | Default | Description        |
| -------- | ------- | ------------------ |
| `PORT`   | `3000`  | Server listen port |

```bash
# Example: run on port 4000
PORT=4000 npm run dev
```

---

## Tech Stack

| Technology     | Purpose                            |
| -------------- | ---------------------------------- |
| Express.js v5  | HTTP server & routing              |
| TypeScript     | Type safety & developer experience |
| better-sqlite3 | Embedded SQLite database           |
| ts-node-dev    | Development server with hot-reload |
