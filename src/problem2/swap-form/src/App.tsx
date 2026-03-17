import { useState, useCallback, useEffect } from "react";
import { ArrowUpDown, CheckCircle2 } from "lucide-react";
import { useTokenPrices, type Token } from "./hooks/useTokenPrices";
import { useSwapState } from "./hooks/useSwapState";
import { DECIMALS, SWAP_DELAY_MS } from "./utils/swap-logic";
import { fmt } from "./utils/fmt";

// Components
import { TokenPanel } from "./components/TokenPanel";
import { TokenModal } from "./components/TokenModal";
import { Button, Spinner } from "@/components/ui";

/** Layout Wrapper cô lập styling */
const SwapCardWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen items-center justify-center p-6">
    <div className="w-md max-w-full rounded-3xl border border-white/6 bg-white/2 p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_20px_60px_rgba(0,0,0,0.4)]">
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
  // 1. Data Fetching
  const {
    tokens,
    loading: tokensLoading,
    error: tokensError,
  } = useTokenPrices();

  // 2. Local State
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [inputAmount, setInputAmount] = useState("");
  const [modalTarget, setModalTarget] = useState<ModalTarget>(null);
  const [swapping, setSwapping] = useState(false);
  const [success, setSuccess] = useState<SuccessInfo | null>(null);

  // 3. Logic Hook (Tách biệt phần tính toán)
  const {
    parsedAmount,
    exchangeRate,
    outputAmount,
    fromUsd,
    toUsd,
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

  // 5. Handlers
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
      if (modalTarget === "from") setFromToken(token);
      else if (modalTarget === "to") setToToken(token);
      setModalTarget(null);
    },
    [modalTarget],
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
    setInputAmount("");
  }, []);

  // 6. Render Logic
  if (tokensLoading)
    return (
      <SwapCardWrapper>
        <div className="flex flex-col items-center gap-4 py-12 text-sm text-white/50">
          <Spinner size={32} className="text-[var(--amber)]" />
          <span>Loading tokens…</span>
        </div>
      </SwapCardWrapper>
    );

  if (tokensError)
    return (
      <SwapCardWrapper>
        <div className="py-12 text-center text-sm text-red-400">
          <span>⚠️ {tokensError}</span>
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
          <h2 className="m-0 text-xl font-semibold text-white">
            Swap Successful
          </h2>
          <p className="m-0 font-[var(--font-mono)] text-sm text-white/60">
            {success.fromAmount} {success.fromSymbol} → {success.toAmount}{" "}
            {success.toSymbol}
          </p>
          <Button
            variant="ghost"
            size="md"
            className="mt-2 px-8"
            onClick={handleReset}
          >
            <span className="text-[var(--amber)]">New Swap</span>
          </Button>
        </div>
      </SwapCardWrapper>
    );

  return (
    <SwapCardWrapper>
      <h1 className="m-0 mb-5 text-xl font-bold text-white">Swap</h1>

      <TokenPanel
        label="You send"
        token={fromToken}
        amount={inputAmount}
        usdValue={fromUsd}
        onAmountChange={setInputAmount}
        onOpenSelector={() => setModalTarget("from")}
      />

      <div className="relative z-2 -my-1.5 flex justify-center">
        <Button
          variant="icon"
          size="md"
          onClick={handleFlip}
          aria-label="Swap tokens"
        >
          <ArrowUpDown size={16} />
        </Button>
      </div>

      <TokenPanel
        label="You receive"
        token={toToken}
        amount={outputAmount !== null ? fmt(outputAmount, DECIMALS) : ""}
        usdValue={toUsd}
        readOnly
        onOpenSelector={() => setModalTarget("to")}
      />

      {exchangeRate !== null && fromToken && toToken && (
        <div className="mt-1 flex items-center justify-between py-3">
          <span className="text-xs text-white/40">Exchange Rate</span>
          <span className="font-[var(--font-mono)] text-xs text-white/70">
            1 {fromToken.currency} = {fmt(exchangeRate, DECIMALS)}{" "}
            {toToken.currency}
          </span>
        </div>
      )}

      {validationError && (
        <div className="mt-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-400">
          {validationError}
        </div>
      )}

      <Button
        variant="primary"
        size="lg"
        className="mt-4 w-full"
        disabled={!canConfirm}
        loading={swapping}
        onClick={handleConfirm}
      >
        {swapping ? "Swapping…" : "Confirm Swap"}
      </Button>

      {modalTarget && (
        <TokenModal
          tokens={tokens}
          onSelect={handleSelectToken}
          onClose={() => setModalTarget(null)}
        />
      )}
    </SwapCardWrapper>
  );
}

export default App;
