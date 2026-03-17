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
};

export const getTokenLimits = (currency: string | undefined): { min: number, max: number } => {
  if (!currency) return { min: 0, max: 0 };
  const sym = currency.toUpperCase();
  if (sym === "USDT" || sym === "USDC") return { min: 10, max: 1_000_000 };
  if (sym === "ETH") return { min: 0.005, max: 500 };
  if (sym === "BTC") return { min: 0.0001, max: 10 };
  return { min: 1, max: 500_000 };
};

export const getPlaceholder = (token: Token | null): string => {
  if (!token) return "0.00";
  const { min, max } = getTokenLimits(token.currency);
  return `${min.toLocaleString()} - ${max.toLocaleString()}`;
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
    
    const { min, max } = getTokenLimits(fromToken?.currency);

    if (parsedAmount <= 0) return "Amount must be greater than 0";
    if (parsedAmount < min) return `Minimum amount is ${min.toLocaleString()}`;
    if (parsedAmount > max) return `Maximum amount is ${max.toLocaleString()}`;
    if (fromToken?.currency === toToken?.currency)
      return "Cannot swap the same token";
    return null;
  },
};
