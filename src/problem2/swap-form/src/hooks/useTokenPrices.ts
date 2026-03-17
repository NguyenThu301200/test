import { useState, useEffect } from "react";

export interface Token {
  /** Symbol identifier, e.g. "ETH", "BUSD", "USDC" */
  currency: string;
  /** USD price of the token at the given date */
  price: number;
  /** ISO 8601 timestamp string of the price entry */
  date: string;
}

/** Raw entry from the prices API before deduplication. */
interface PriceEntry {
  /** Symbol identifier */
  currency: string;
  /** ISO 8601 timestamp string */
  date: string;
  /** USD price — may be null or undefined for invalid entries */
  price: number | null | undefined;
}

/** Return type of the useTokenPrices hook. */
interface UseTokenPricesResult {
  /** Array of deduplicated tokens sorted alphabetically by currency */
  tokens: Token[];
  /** true while the initial fetch is in progress */
  loading: boolean;
  /** Human-readable error message, or null on success */
  error: string | null;
}

const PRICES_URL = "https://interview.switcheo.com/prices.json";

/**
 * Fetches token prices from the Switcheo API, deduplicates by currency
 * (keeping the latest date), and filters out null/undefined prices.
 * Runs once on mount. Uses a cancellation flag to prevent state updates
 * after unmount.
 */
export function useTokenPrices(): UseTokenPricesResult {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPrices() {
      try {
        const res = await fetch(PRICES_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: PriceEntry[] = await res.json();

        // Deduplicate by currency — keep latest date
        const map = new Map<string, Token>();
        for (const entry of data) {
          if (entry.price == null) continue;

          const existing = map.get(entry.currency);
          if (!existing || entry.date > existing.date) {
            map.set(entry.currency, {
              currency: entry.currency,
              price: entry.price,
              date: entry.date,
            });
          }
        }

        // Sort alphabetically
        const deduped = Array.from(map.values()).sort((a, b) =>
          a.currency.localeCompare(b.currency),
        );

        if (!cancelled) {
          setTokens(deduped);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch prices",
          );
          setLoading(false);
        }
      }
    }

    fetchPrices();

    // Cleanup: prevent state updates if component unmounts mid-fetch
    return () => {
      cancelled = true;
    };
  }, []);

  return { tokens, loading, error };
}
