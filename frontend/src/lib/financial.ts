/**
 * Financial Helpers
 * 
 * Provides safe handling for financial numeric values coming from Prisma Decimal fields.
 * Prevents runtime crashes like ".toFixed is not a function" when receiving strings or nulls.
 */

/**
 * Safely converts any value to a number.
 * Handles strings, numbers, null, undefined, and objects with toString().
 */
export function safeCurrency(value: unknown): number {
  if (value === null || value === undefined) return 0;
  
  // Handle Decimal-like objects or strings
  const parsed = typeof value === 'number' ? value : Number(value);
  
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
    console.warn('[Financial] Invalid numeric value detected:', value);
    return 0;
  }
  
  return parsed;
}

/**
 * Formats a value as a currency string (e.g., "10.00").
 * Always returns a string with 2 decimal places.
 */
export function formatCurrency(value: unknown): string {
  return safeCurrency(value).toFixed(2);
}

/**
 * Formats a value as a currency string with symbol (e.g., "$10.00").
 */
export function formatCurrencyWithSymbol(value: unknown, symbol: string = '$'): string {
  return `${symbol}${formatCurrency(value)}`;
}

/**
 * Safely sums an array of items based on a numeric field.
 */
export function calculateTotal<T>(items: T[] | undefined | null, fieldGetter: (item: T) => unknown): number {
  if (!items || !Array.isArray(items)) return 0;
  
  return items.reduce((acc, item) => {
    return acc + safeCurrency(fieldGetter(item));
  }, 0);
}

/**
 * Formats a total sum as a currency string.
 */
export function formatTotal<T>(items: T[] | undefined | null, fieldGetter: (item: T) => unknown): string {
  return formatCurrency(calculateTotal(items, fieldGetter));
}
