# Currency Swap Form — Documentation

## 1. Folder Structure

```text

swap-form/
├── src/
│   ├── main.tsx                      # Entry point — renders <App /> into #root
│   ├── index.css                     # Global reset, CSS variables, body background
│   ├── App.tsx                       # Root component — all state, derived values, layout
│   ├── App.module.css                # Styles for App (card, flip, confirm, success, loading)
│   ├── components/
│   │   ├── TokenIcon.tsx             # Token icon img with fallback to colored initials
│   │   ├── TokenIcon.module.css      # Styles for TokenIcon (icon, fallback circle)
│   │   ├── TokenPanel.tsx            # One send/receive panel — input + token selector btn
│   │   ├── TokenPanel.module.css     # Styles for TokenPanel (panel, input, token button)
│   │   ├── TokenModal.tsx            # Searchable token selector modal
│   │   └── TokenModal.module.css     # Styles for TokenModal (overlay, search, list, items)
│   ├── hooks/
│   │   └── useTokenPrices.ts         # Fetches, deduplicates, and exposes token prices
│   ├── utils/
│   │   └── fmt.ts                    # Number formatting utility
```

---

## 2. Setup

### Prerequisites

- **Node.js** ≥ 18.0.0 (uses ES2023 target and ESNext modules)
- **npm** ≥ 9

### Steps

```bash
# 1. Clone the repository and navigate to the project
cd src/problem2/swap-form

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
# → opens at http://localhost:5173/
```

### Environment Variables

No `.env.local` is required. The only external data source is hardcoded:

| Variable | Default                                                                           | Description                                        |
| -------- | --------------------------------------------------------------------------------- | -------------------------------------------------- |
| _none_   | `https://interview.switcheo.com/prices.json`                                      | Token price API (hardcoded in `useTokenPrices.ts`) |
| _none_   | `https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/{SYMBOL}.svg` | Token icon CDN (hardcoded in `TokenIcon.tsx`)      |

To change either URL, edit the corresponding constant directly in the source file.

---

## 3. Scripts

| Script    | Command           | Description                                                                   | URL                      |
| --------- | ----------------- | ----------------------------------------------------------------------------- | ------------------------ |
| `dev`     | `npm run dev`     | Starts the Vite dev server with HMR                                           | `http://localhost:5173/` |
| `build`   | `npm run build`   | Runs `tsc -b` (type-check) then `vite build` (production bundle into `dist/`) | —                        |
| `preview` | `npm run preview` | Serves the `dist/` folder locally (run `build` first)                         | `http://localhost:4173/` |
| `lint`    | `npm run lint`    | Runs ESLint across the project                                                | —                        |

To type-check without building:

```bash
npx tsc --noEmit
```

## 4. Hooks

### 4.1 `useTokenPrices` — `src/hooks/useTokenPrices.ts`

```typescript
/**
 * Fetches token prices from the Switcheo interview API, deduplicates
 * entries by currency (keeping the one with the latest date), filters out
 * entries where price is null or undefined, and returns the result sorted
 * alphabetically by currency symbol.
 *
 * Runs once on mount. Handles component unmount via a cancellation flag
 * to prevent state updates on unmounted components.
 */
```

**When to use:** Call once at the app root (`App.tsx`) and pass the resulting `tokens` array down to child components. Do not call in multiple components — the hook issues a fresh `fetch` on every mount.

**Deduplication logic:**

```text
Raw API response (may contain duplicates):
  [
    { currency: "ETH", price: 1645.93, date: "2023-11-28T..." },
    { currency: "ETH", price: 1640.00, date: "2023-11-27T..." },
    { currency: "BTC", price: null,    date: "2023-11-28T..." }
  ]

After deduplication:
  [
    { currency: "ETH", price: 1645.93, date: "2023-11-28T..." }
  ]
  // Second ETH dropped (older date), BTC dropped (null price)
```
