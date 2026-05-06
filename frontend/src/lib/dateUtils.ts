/**
 * Standard utility for date formatting in the Nicaragua timezone (America/Managua)
 * consistent with the es-NI locale.
 */

export const NI_TIMEZONE = 'America/Managua';
export const NI_LOCALE = 'es-NI';

export function formatNIDate(date: string | Date | number): string {
  const d = new Date(date);
  return d.toLocaleString(NI_LOCALE, {
    timeZone: NI_TIMEZONE,
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatNIDateOnly(date: string | Date | number): string {
  const d = new Date(date);
  return d.toLocaleString(NI_LOCALE, {
    timeZone: NI_TIMEZONE,
    dateStyle: 'medium',
  });
}

export function formatNITimeOnly(date: string | Date | number): string {
  const d = new Date(date);
  return d.toLocaleString(NI_LOCALE, {
    timeZone: NI_TIMEZONE,
    timeStyle: 'short',
  });
}

/**
 * Calculates duration between two dates in hours.
 */
export function calculateDurationHours(start: string | Date | number, end: string | Date | number): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const diffMs = e - s;
  // Using ceil as per business requirement to charge full hour even for partials
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
}
