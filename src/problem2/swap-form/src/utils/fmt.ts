/**
 * Format a number for display.
 * @param n — the number to format
 * @param decimals — decimal places (default 2)
 * @returns formatted number as string
 * Example: fmt(12345.6789, 2) => "12,345.68"
 * Example: fmt(NaN) => "—"
 * Example: fmt(Infinity) => "—"
 * Example: fmt(-42.5, 1) => "-42.5"
 */
export function fmt(n: number, decimals = 2): string {
  if (!Number.isFinite(n)) return "—";

  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
