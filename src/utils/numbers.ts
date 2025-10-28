export const formatNumberWithCommas = (n: number, fixedTo?: number) =>
  n?.toLocaleString(undefined, { maximumFractionDigits: fixedTo });

export const roundToDecimalIfNotWhole = (n: number, decimals: number = 2): string => {
  return Math.round(n) === n ? `${n}` : n.toFixed(decimals);
};

/**
 * Converts a decimal value to a percentage.
 * Examples:
 * - 0.4333 -> 43
 * - 1.56756 -> 156
 * - 0.01 -> 1
 *
 * @param value - The decimal value to convert to percentage
 * @returns An integer percentage value
 */
export const getPercentageInt = (value: number): number => Math.max(1, Math.trunc(value * 100));

/**
 * Transforms a number into a shorter, more readable format.
 * Examples:
 * - 1234 -> "1,234"
 * - 12345 -> "12k"
 * - 1234567 -> "1.2m"
 * - 1234567890 -> "1.2b"
 *
 * @param value - The number to transform
 * @returns A string representation of the shortened number
 */
export const formatNumberToShortString = (value: number): string => {
  const res = value > 100 ? Math.floor(value) : value;

  if (res < 10000) {
    return formatNumberWithCommas(res, 1);
  }

  const absValue = Math.abs(res);

  if (absValue >= 1e9) {
    return `${(absValue / 1e9).toFixed(1)}B`;
  }
  if (absValue >= 1e6) {
    return `${(absValue / 1e6).toFixed(1)}M`;
  }
  if (absValue >= 1e3) {
    return `${(absValue / 1e3).toFixed(1)}K`;
  }

  return formatNumberWithCommas(res);
};

export function clampValue(value: number, min?: number, max?: number) {
  return Math.max(Math.min(value, max ?? Infinity), min ?? -Infinity);
}
