import { useState, useCallback, useEffect } from "react";
import { ArrowUpDown, CheckCircle2, AlertCircle } from "lucide-react";
import { useTokenPrices, type Token } from "./hooks/useTokenPrices";
import { useSwapState } from "./hooks/useSwapState";
import { DECIMALS, SWAP_DELAY_MS, getPlaceholder } from "./utils/swap-logic";
import { fmt } from "./utils/fmt";

import { TokenPanel } from "./components/TokenPanel";
import { TokenModal } from "./components/TokenModal";
import { Button, Spinner } from "@/components/ui";
import { PreviewModal } from "./components/PreviewModal";

/** Layout Wrapper */
const SwapCardWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen items-center justify-center p-4">
    <div className="w-full max-w-[480px] rounded-[24px] bg-[var(--panel-bg)] p-4 sm:p-6 shadow-2xl">
      {children}
    </div>
  </div>
);



type ModalTarget = "from" | "to" | null;

interface SuccessInfo {
  fromAmount: string;
  fromSymbol: string;
  toAmount: string;
  toSymbol: string;
}

function App() {
  // Data Fetching
  const {
    tokens,
    loading: tokensLoading,
    error: tokensError,
  } = useTokenPrices();

  // Local State
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [inputAmount, setInputAmount] = useState("");
  const [modalTarget, setModalTarget] = useState<ModalTarget>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [success, setSuccess] = useState<SuccessInfo | null>(null);

  // Handler Logic - useSwapState hook
  const {
    parsedAmount,
    exchangeRate,
    outputAmount,
    validationError,
    canConfirm,
  } = useSwapState({ inputAmount, fromToken, toToken, isSwapping: swapping });

  useEffect(() => {
    if (tokens.length > 0 && !fromToken && !toToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFromToken(tokens.find((t) => t.currency === "ETH") || tokens[0]);
      setToToken(
        tokens.find((t) => t.currency === "USDC") || tokens[1] || tokens[0],
      );
    }
  }, [tokens, fromToken, toToken]);

  // Handlers
  const handleFlip = useCallback(() => {
    setFromToken(toToken);
    setToToken(fromToken);
    if (outputAmount && outputAmount > 0) {
      setInputAmount(Number(outputAmount.toFixed(DECIMALS)).toString());
    } else {
      setInputAmount("");
    }
  }, [fromToken, toToken, outputAmount]);

  const handleSelectToken = useCallback(
    (token: Token) => {
      const isFrom = modalTarget === "from";
      const currentOther = isFrom ? toToken : fromToken;

      if (currentOther?.currency === token.currency) {
        handleFlip();
      } else {
        if (isFrom) setFromToken(token);
        else setToToken(token);
      }
      setModalTarget(null);
    },
    [modalTarget, fromToken, toToken, handleFlip],
  );

  const handleConfirm = useCallback(() => {
    if (!canConfirm || !fromToken || !toToken || outputAmount === null) return;
    setSwapping(true);

    setTimeout(() => {
      setSwapping(false);
      setSuccess({
        fromAmount: fmt(parsedAmount, DECIMALS),
        fromSymbol: fromToken.currency,
        toAmount: fmt(outputAmount, DECIMALS),
        toSymbol: toToken.currency,
      });
    }, SWAP_DELAY_MS);
  }, [canConfirm, fromToken, toToken, outputAmount, parsedAmount]);

  const handleReset = useCallback(() => {
    setSuccess(null);
    setIsPreview(false);
    setInputAmount("");
  }, []);

  // Render Logic
  if (tokensLoading)
    return (
      <SwapCardWrapper>
        <div className="flex flex-col items-center gap-4 py-12 text-sm text-[var(--text-secondary)]">
          <Spinner size={32} className="text-[var(--binance-yellow)]" />
          <span>Loading tokens…</span>
        </div>
      </SwapCardWrapper>
    );

  if (tokensError)
    return (
      <SwapCardWrapper>
        <div className="flex flex-col items-center gap-3 py-10 text-center text-sm text-[#f6465d]">
          <AlertCircle size={36} className="text-[#f6465d]" />
          <p className="m-0 font-medium">{tokensError}</p>
        </div>
      </SwapCardWrapper>
    );

  if (success)
    return (
      <SwapCardWrapper>
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="m-0 text-xl font-semibold text-[var(--text-primary)]">
            Swap Successful
          </h2>
          <p className="m-0 text-sm text-[var(--text-secondary)]">
            {success.fromAmount} {success.fromSymbol} → {success.toAmount}{" "}
            {success.toSymbol}
          </p>
          <Button
            variant="ghost"
            size="md"
            className="mt-2 px-8"
            onClick={handleReset}
          >
            <span className="text-[var(--binance-yellow)]">New Swap</span>
          </Button>
        </div>
      </SwapCardWrapper>
    );

  return (
    <SwapCardWrapper>
      <div className="flex flex-col">
        <TokenPanel
          label="From"
          token={fromToken}
          amount={inputAmount}
          placeholder={getPlaceholder(fromToken)}
          showMax={true}
          error={validationError}
          onAmountChange={setInputAmount}
          onOpenSelector={() => setModalTarget("from")}
        />

        {/* Robust swap button placement ensures perfect centering even if panel sizes change */}
        <div className="relative z-10 h-1 w-full">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Button
              variant="icon"
              size="md"
              onClick={handleFlip}
              aria-label="Swap tokens"
            >
              <ArrowUpDown size={18} />
            </Button>
          </div>
        </div>

        <TokenPanel
          label="To"
          token={toToken}
          amount={outputAmount !== null ? fmt(outputAmount, DECIMALS) : ""}
          placeholder={getPlaceholder(toToken)}
          readOnly
          onOpenSelector={() => setModalTarget("to")}
        />
      </div>

      {exchangeRate !== null && fromToken && toToken && (
        <div className="mt-4 flex items-center justify-between px-1">
          <span className="text-sm text-[var(--text-secondary)]">Rate</span>
          <span className="text-sm font-medium text-[var(--text-primary)]">
            1 {fromToken.currency} = {fmt(exchangeRate, DECIMALS)}{" "}
            {toToken.currency}
          </span>
        </div>
      )}



      <Button
        variant="primary"
        size="lg"
        className="mt-6 w-full text-lg"
        disabled={!canConfirm}
        onClick={() => setIsPreview(true)}
      >
        Preview Conversion
      </Button>

      {modalTarget && (
        <TokenModal
          tokens={tokens}
          onSelect={handleSelectToken}
          onClose={() => setModalTarget(null)}
        />
      )}

      <PreviewModal
        isOpen={isPreview}
        onClose={() => setIsPreview(false)}
        onConfirm={handleConfirm}
        fromToken={fromToken}
        toToken={toToken}
        parsedAmount={parsedAmount}
        outputAmount={outputAmount}
        exchangeRate={exchangeRate}
        swapping={swapping}
      />
    </SwapCardWrapper>
  );
}

export default App;
