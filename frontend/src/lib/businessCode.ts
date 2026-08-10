/**
 * Business Code Formatter
 *
 * Single source of truth for all business entity code formatting.
 * NEVER duplicate this logic in components or services.
 *
 * Format: PREFIX-NNNNNN  (6-digit zero-padded)
 *
 * Examples:
 *   formatBusinessCode("RES", 125)  =>  "RES-000125"
 *   formatBusinessCode("PAY", 842)  =>  "PAY-000842"
 *   formatBusinessCode("BIK", 12)   =>  "BIK-000012"
 *   formatBusinessCode("STA", 5)    =>  "STA-000005"
 *   formatBusinessCode("USR", 1)    =>  "USR-000001"
 *   formatBusinessCode("RTE", 17)   =>  "RTE-000017"
 */
export function formatBusinessCode(
  prefix: string,
  code: number | null | undefined,
): string {
  if (code == null || isNaN(Number(code))) return `${prefix}-??????`;
  return `${prefix}-${String(code).padStart(6, '0')}`;
}

/**
 * Parse a business code string back to its numeric part.
 * Used in search: allows users to type "RES-000125" and find reservation #125.
 *
 * Returns null if the format is not recognized.
 *
 * Examples:
 *   parseBusinessCode("RES-000125")  =>  125
 *   parseBusinessCode("PAY-000842")  =>  842
 *   parseBusinessCode("125")         =>  null  (no prefix)
 */
export function parseBusinessCode(value: string): number | null {
  const match = value.trim().match(/^[A-Z]+-(\d+)$/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  return isNaN(num) ? null : num;
}

// ─── Per-entity typed helpers ─────────────────────────────────────────────────

/** USR-000001 */
export const fmtUser = (code: number | null | undefined): string =>
  formatBusinessCode('USR', code);

/** BIK-000012 */
export const fmtBike = (code: number | null | undefined): string =>
  formatBusinessCode('BIK', code);

/** STA-000005 */
export const fmtStation = (code: number | null | undefined): string =>
  formatBusinessCode('STA', code);

/** RES-000125 */
export const fmtReservation = (code: number | null | undefined): string =>
  formatBusinessCode('RES', code);

/** PAY-000842 */
export const fmtPayment = (code: number | null | undefined): string =>
  formatBusinessCode('PAY', code);

/** RTE-000017 */
export const fmtRoute = (code: number | null | undefined): string =>
  formatBusinessCode('RTE', code);
