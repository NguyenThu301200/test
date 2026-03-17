import { TokenIcon } from "./TokenIcon";
import type { Token } from "../hooks/useTokenPrices";
import { fmt } from "../utils/fmt";
import styles from "./TokenPanel.module.css";

interface TokenPanelProps {
  /** Header label (e.g. "You send") */
  label: string;
  /** Selected token, or null */
  token: Token | null;
  /** Display value for the input */
  amount: string;
  /** USD equivalent, or null */
  usdValue: number | null;
  /** If true, the input is not editable (default: false) */
  readOnly?: boolean;
  /** Keystroke callback — omit for read-only panels */
  onAmountChange?: (value: string) => void;
  /** Called when the token selector button is clicked */
  onOpenSelector: () => void;
}

/**
 * A single swap panel (send or receive side).
 * Displays an amount input, a token selector button with icon,
 * and the USD equivalent in the header.
 */
export function TokenPanel({
  label,
  token,
  amount,
  usdValue,
  readOnly = false,
  onAmountChange,
  onOpenSelector,
}: TokenPanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        {usdValue !== null && usdValue > 0 && (
          <span className={styles.usd}>≈ ${fmt(usdValue)}</span>
        )}
      </div>
      <div className={styles.row}>
        <input
          className={styles.input}
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          readOnly={readOnly}
          onChange={(e) => onAmountChange?.(e.target.value)}
        />
        <button
          type="button"
          className={styles.tokenBtn}
          onClick={onOpenSelector}
        >
          {token ? (
            <>
              <TokenIcon symbol={token.currency} size={24} />
              <span className={styles.tokenSymbol}>{token.currency}</span>
            </>
          ) : (
            <span className={styles.tokenPlaceholder}>Select token</span>
          )}
          <svg
            className={styles.chevron}
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
