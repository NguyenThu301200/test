import { useState, useMemo, useCallback } from "react";
import { useTokenPrices } from "./hooks/useTokenPrices";
import type { Token } from "./hooks/useTokenPrices";
import { TokenPanel } from "./components/TokenPanel";
import { TokenModal } from "./components/TokenModal";
import { fmt } from "./utils/fmt";
import styles from "./App.module.css";

/** Tracks which panel opened the token selector modal. */
type ModalTarget = "from" | "to" | null;

/** Data displayed on the success screen after a swap. */
interface SuccessInfo {
  /** Formatted input amount (e.g. "100.000000") */
  fromAmount: string;
  /** Source token symbol (e.g. "ETH") */
  fromSymbol: string;
  /** Formatted output amount (e.g. "164,593.373700") */
  toAmount: string;
  /** Destination token symbol (e.g. "USD") */
  toSymbol: string;
}

/**
 * Root component — holds all state and derived computations.
 * Renders two TokenPanels, a flip button, exchange rate, validation errors,
 * and a confirm button with simulated swap flow.
 */
function App() {
  const {
    tokens,
    loading: tokensLoading,
    error: tokensError,
  } = useTokenPrices();

  // Currently selected source token
  const [fromToken, setFromToken] = useState<Token | null>(null);
  // Currently selected destination token
  const [toToken, setToToken] = useState<Token | null>(null);
  // Raw string from the amount input
  const [inputAmount, setInputAmount] = useState("");
  // Which panel opened the token selector (null = modal closed)
  const [modalTarget, setModalTarget] = useState<ModalTarget>(null);
  // True during the 1.5s simulated swap
  const [swapping, setSwapping] = useState(false);
  // Populated after a successful swap; triggers the success screen
  const [success, setSuccess] = useState<SuccessInfo | null>(null);

  // — Derived values —
  // Parsed from inputAmount, NaN if invalid
  const parsedAmount = useMemo(() => {
    const n = Number(inputAmount);
    return Number.isFinite(n) ? n : NaN;
  }, [inputAmount]);

  // Exchange rate: from  → to
  const exchangeRate = useMemo(() => {
    if (!fromToken || !toToken || toToken.price === 0) return null;
    return fromToken.price / toToken.price;
  }, [fromToken, toToken]);

  // Output amount = input amount * exchange rate
  const outputAmount = useMemo(() => {
    if (exchangeRate === null || isNaN(parsedAmount)) return null;
    return parsedAmount * exchangeRate;
  }, [parsedAmount, exchangeRate]);

  // From token USD value
  const fromUsd = useMemo(() => {
    if (!fromToken || isNaN(parsedAmount)) return null;
    return parsedAmount * fromToken.price;
  }, [parsedAmount, fromToken]);

  // To token USD value
  const toUsd = useMemo(() => {
    if (!toToken || outputAmount === null) return null;
    return outputAmount * toToken.price;
  }, [outputAmount, toToken]);

  // Validation
  const validationError = useMemo(() => {
    if (!inputAmount.trim()) return null; // don't show error on empty
    if (isNaN(parsedAmount)) return "Enter a valid number";
    if (parsedAmount <= 0) return "Amount must be greater than 0";
    if (fromToken && toToken && fromToken.currency === toToken.currency) {
      return "Cannot swap the same token";
    }
    return null;
  }, [inputAmount, parsedAmount, fromToken, toToken]);

  // Condition to confirm swap
  const canConfirm = useMemo(() => {
    return (
      !swapping &&
      fromToken !== null &&
      toToken !== null &&
      !isNaN(parsedAmount) &&
      parsedAmount > 0 &&
      fromToken.currency !== toToken.currency &&
      validationError === null
    );
  }, [swapping, fromToken, toToken, parsedAmount, validationError]);

  // Swap fromToken ↔ toToken positions and clear the input
  const handleFlip = useCallback(() => {
    setFromToken(toToken);
    setToToken(fromToken);
    setInputAmount("");
  }, [fromToken, toToken]);

  // Handle token selection from modal
  const handleSelectToken = useCallback(
    (token: Token) => {
      if (modalTarget === "from") setFromToken(token);
      else if (modalTarget === "to") setToToken(token);
      setModalTarget(null);
    },
    [modalTarget],
  );

  // Simulate a 1.5s swap, then show success screen
  const handleConfirm = useCallback(() => {
    if (!canConfirm || !fromToken || !toToken || outputAmount === null) return;
    setSwapping(true);
    setTimeout(() => {
      setSwapping(false);
      setSuccess({
        fromAmount: fmt(parsedAmount, 6),
        fromSymbol: fromToken.currency,
        toAmount: fmt(outputAmount, 6),
        toSymbol: toToken.currency,
      });
    }, 1500);
  }, [canConfirm, fromToken, toToken, outputAmount, parsedAmount]);

  // Clear success state and input to start a new swap
  const handleReset = useCallback(() => {
    setSuccess(null);
    setInputAmount("");
  }, []);

  // — Loading / Error states —
  if (tokensLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <span>Loading tokens…</span>
          </div>
        </div>
      </div>
    );
  }

  if (tokensError) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.errorState}>
            <span>⚠️ {tokensError}</span>
          </div>
        </div>
      </div>
    );
  }

  // — Success state —
  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.successState}>
            <div className={styles.successIcon}>✓</div>
            <h2 className={styles.successTitle}>Swap Successful</h2>
            <p className={styles.successDetail}>
              {success.fromAmount} {success.fromSymbol} → {success.toAmount}{" "}
              {success.toSymbol}
            </p>
            <button
              type="button"
              className={styles.resetBtn}
              onClick={handleReset}
            >
              New Swap
            </button>
          </div>
        </div>
      </div>
    );
  }

  // — Main swap form —
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Swap</h1>

        {/* Send panel — editable amount input */}
        <TokenPanel
          label="You send"
          token={fromToken}
          amount={inputAmount}
          usdValue={fromUsd}
          onAmountChange={setInputAmount}
          onOpenSelector={() => setModalTarget("from")}
        />

        {/* Flip button — swaps fromToken ↔ toToken */}
        <div className={styles.flipWrap}>
          <button
            type="button"
            className={styles.flipBtn}
            onClick={handleFlip}
            aria-label="Swap tokens"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 6L8 2L12 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 10L8 14L4 10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Receive panel — read-only computed output */}
        <TokenPanel
          label="You receive"
          token={toToken}
          amount={outputAmount !== null ? fmt(outputAmount, 6) : ""}
          usdValue={toUsd}
          readOnly
          onOpenSelector={() => setModalTarget("to")}
        />

        {/* Exchange rate line: "1 FROM = X.XXXXXX TO" */}
        {exchangeRate !== null && fromToken && toToken && (
          <div className={styles.rateRow}>
            <span className={styles.rateLabel}>Exchange Rate</span>
            <span className={styles.rateValue}>
              1 {fromToken.currency} = {fmt(exchangeRate, 6)} {toToken.currency}
            </span>
          </div>
        )}

        {/* Inline error for invalid input */}
        {validationError && (
          <div className={styles.error}>{validationError}</div>
        )}

        <button
          type="button"
          className={styles.confirmBtn}
          disabled={!canConfirm}
          onClick={handleConfirm}
        >
          {swapping ? (
            <div className={styles.btnLoading}>
              <div className={styles.spinnerSmall} />
              <span>Swapping…</span>
            </div>
          ) : (
            "Confirm Swap"
          )}
        </button>
      </div>

      {/* Token selector modal — opens when user clicks a token button */}
      {modalTarget && (
        <TokenModal
          tokens={tokens}
          onSelect={handleSelectToken}
          onClose={() => setModalTarget(null)}
        />
      )}
    </div>
  );
}

export default App;
