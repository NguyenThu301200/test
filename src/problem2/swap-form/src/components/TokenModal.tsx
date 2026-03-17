import { useState, useMemo } from "react";
import type { Token } from "../hooks/useTokenPrices";
import { TokenIcon } from "./TokenIcon";
import { fmt } from "../utils/fmt";
import styles from "./TokenModal.module.css";

interface TokenModalProps {
  /** Full token list to display and filter */
  tokens: Token[];
  /** Called with the selected token */
  onSelect: (token: Token) => void;
  /** Called to close the modal */
  onClose: () => void;
}

/**
 * Full-screen overlay modal for selecting a token.
 * Shows a search input and a scrollable list of tokens with icon, symbol, and price.
 * Closes on backdrop click, close button, or token selection.
 */
export function TokenModal({ tokens, onSelect, onClose }: TokenModalProps) {
  // Search state
  const [search, setSearch] = useState("");

  // Filter tokens by case-insensitive substring match on currency symbol
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tokens;
    return tokens.filter((t) => t.currency.toLowerCase().includes(q));
  }, [tokens, search]);

  return (
    // Backdrop -- clicking outside the modal closes it
    <div className={styles.overlay} onClick={onClose}>
      {/* Stop propagation so clicks inside the modal do not close it */}
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Select a token</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M5 5L15 15M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className={styles.searchWrap}>
          <svg
            className={styles.searchIcon}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <circle
              cx="7"
              cy="7"
              r="5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M11 11L14 14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search by symbol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className={styles.list}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>No tokens found</div>
          ) : (
            filtered.map((token) => (
              <button
                key={token.currency}
                type="button"
                className={styles.item}
                onClick={() => onSelect(token)}
              >
                <TokenIcon symbol={token.currency} size={32} />
                <div className={styles.itemInfo}>
                  <span className={styles.itemSymbol}>{token.currency}</span>
                  <span className={styles.itemPrice}>
                    ${fmt(token.price, 4)}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
