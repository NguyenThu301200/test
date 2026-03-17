import type { Token } from "../hooks/useTokenPrices";

export const DECIMALS = 6;
export const SWAP_DELAY_MS = 1500;

export const SwapMath = {
  parseAmount: (amount: string): number => {
    const n = Number(amount);
    return Number.isFinite(n) ? n : NaN;
  },

  calculateExchangeRate: (
    from: Token | null,
    to: Token | null,
  ): number | null => {
    if (!from || !to || to.price === 0) return null;
    return from.price / to.price;
  },

  calculateOutput: (amount: number, rate: number | null): number | null => {
    if (rate === null || isNaN(amount)) return null;
    return amount * rate;
  },

  toUsd: (amount: number | null, price: number | undefined): number | null => {
    if (amount === null || price === undefined || isNaN(amount)) return null;
    return amount * price;
  },
};

export const SwapValidator = {
  getValidationError: (
    input: string,
    parsedAmount: number,
    fromToken: Token | null,
    toToken: Token | null,
  ): string | null => {
    if (!input.trim()) return null;
    if (isNaN(parsedAmount)) return "Enter a valid number";
    if (parsedAmount <= 0) return "Amount must be greater than 0";
    if (fromToken?.currency === toToken?.currency)
      return "Cannot swap the same token";
    return null;
  },
};
