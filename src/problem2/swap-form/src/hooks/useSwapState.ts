import { useMemo } from "react";
import type { Token } from "./useTokenPrices";
import { SwapMath, SwapValidator } from "../utils/swap-logic";

interface UseSwapStateProps {
  inputAmount: string;
  fromToken: Token | null;
  toToken: Token | null;
  isSwapping: boolean;
}

export function useSwapState({
  inputAmount,
  fromToken,
  toToken,
  isSwapping,
}: UseSwapStateProps) {
  const {
    parsedAmount,
    exchangeRate,
    outputAmount,
    validationError,
  } = useMemo(() => {
    const parsedAmount = SwapMath.parseAmount(inputAmount);
    const exchangeRate = SwapMath.calculateExchangeRate(fromToken, toToken);
    const outputAmount = SwapMath.calculateOutput(parsedAmount, exchangeRate);

    return {
      parsedAmount,
      exchangeRate,
      outputAmount,
      validationError: SwapValidator.getValidationError(
        inputAmount,
        parsedAmount,
        fromToken,
        toToken,
      ),
    };
  }, [inputAmount, fromToken, toToken]);

  const canConfirm =
    !isSwapping &&
    !!fromToken &&
    !!toToken &&
    parsedAmount > 0 &&
    !validationError;

  return {
    parsedAmount,
    exchangeRate,
    outputAmount,
    validationError,
    canConfirm,
  };
}
