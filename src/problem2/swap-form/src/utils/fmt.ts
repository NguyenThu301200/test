/**
 * Format a number for display.
 * @param n — the number to format
 * @param decimals — decimal places (default 2)
 * @returns formatted number as string
 */
export function fmt(n: number, decimals = 2): string {
  if (!Number.isFinite(n)) return "—";

  // Use Intl.NumberFormat but avoid trailing zeros for exact integer parts
  // or clean decimals if they end in zeros.
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(n);
}
