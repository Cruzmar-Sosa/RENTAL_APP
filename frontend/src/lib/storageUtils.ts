/**
 * storageUtils.ts
 * ─────────────────────────────────────────────────────────────
 * Centralized helper for constructing Supabase Storage public URLs.
 *
 * RULE: The frontend NEVER stores raw imageUrls.
 *       It only stores imageKey (the storage path) and builds
 *       the URL at render time using these helpers.
 *
 * This keeps the app portable — changing the CDN / bucket only
 * requires updating NEXT_PUBLIC_SUPABASE_URL in env.
 * ─────────────────────────────────────────────────────────────
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET ?? 'bikes';

/**
 * Builds the public Supabase Storage URL for a given storage key.
 * Returns null if imageKey is falsy (no image uploaded yet).
 *
 * @example
 *   buildImageUrl('photos/bike-42-1715469823000.webp')
 *   // → 'https://hfwlftukgbrktrxpbnpn.supabase.co/storage/v1/object/public/bikes/photos/bike-42-1715469823000.webp'
 */
export function buildImageUrl(imageKey: string | null | undefined): string | null {
  if (!imageKey || !SUPABASE_URL) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${imageKey}`;
}

/**
 * Returns the imageUrl from a bike object.
 * Prefers the pre-built imageUrl (from API response) but falls back to
 * constructing from imageKey for resilience.
 */
export function getBikeImageUrl(bike: {
  imageUrl?: string | null;
  imageKey?: string | null;
}): string | null {
  if (bike.imageUrl) return bike.imageUrl;
  if (bike.imageKey) return buildImageUrl(bike.imageKey);
  return null;
}
