export interface Coordinate {
  lat: number;
  lng: number;
}

export type Polyline = Coordinate[];

export function isValidLatitude(lat: any): boolean {
  if (typeof lat !== 'number' || isNaN(lat) || !isFinite(lat)) return false;
  return lat >= -90 && lat <= 90;
}

export function isValidLongitude(lng: any): boolean {
  if (typeof lng !== 'number' || isNaN(lng) || !isFinite(lng)) return false;
  return lng >= -180 && lng <= 180;
}

export function isValidCoordinate(lat: any, lng: any): boolean {
  return isValidLatitude(lat) && isValidLongitude(lng);
}

export function normalizePrecision(val: number): number {
  return Math.round(val * 1000000) / 1000000;
}

export function safeParsePolyline(polyline: any): Coordinate[] {
  if (!polyline) {
    return [];
  }

  let parsed: any = polyline;

  if (typeof polyline === 'string') {
    const trimmed = polyline.trim();
    if (!trimmed || trimmed === '[]' || trimmed === 'null' || trimmed === 'undefined') {
      return [];
    }
    try {
      parsed = JSON.parse(trimmed);
    } catch (e) {
      console.warn('⚠️ [safeParsePolyline] Failed to parse JSON string:', e);
      return [];
    }
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  const validCoordinates: Coordinate[] = [];

  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];
    if (!item) continue;

    let lat: number | undefined;
    let lng: number | undefined;

    if (typeof item === 'object' && !Array.isArray(item)) {
      const rawLat = item.lat !== undefined ? item.lat : item.latitude;
      const rawLng = item.lng !== undefined ? item.lng : item.longitude;

      lat = typeof rawLat === 'number' ? rawLat : parseFloat(rawLat);
      lng = typeof rawLng === 'number' ? rawLng : parseFloat(rawLng);
    } else if (Array.isArray(item) && item.length >= 2) {
      const val1 = typeof item[0] === 'number' ? item[0] : parseFloat(item[0]);
      const val2 = typeof item[1] === 'number' ? item[1] : parseFloat(item[1]);

      if (isValidCoordinate(val1, val2)) {
        lat = val1;
        lng = val2;
      } else if (isValidCoordinate(val2, val1)) {
        lat = val2;
        lng = val1;
      }
    }

    if (lat !== undefined && lng !== undefined && isValidCoordinate(lat, lng)) {
      validCoordinates.push({
        lat: normalizePrecision(lat),
        lng: normalizePrecision(lng),
      });
    }
  }

  return validCoordinates;
}

export function calculateDistanceKm(coords: Coordinate[]): number {
  if (!coords || coords.length < 2) return 0;

  let totalDist = 0;
  const R = 6371;

  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];

    const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
    const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;

    const lat1Rad = (p1.lat * Math.PI) / 180;
    const lat2Rad = (p2.lat * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalDist += R * c;
  }

  return normalizePrecision(totalDist);
}
