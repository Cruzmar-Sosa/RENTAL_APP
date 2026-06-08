/**
 * Route Diagnostics — Per-segment quality analysis
 *
 * Generates RouteQualityReport with metrics for each segment:
 * - Geodesic vs road distance
 * - Deviation ratio
 * - Snap distance estimation
 * - Overall route efficiency score
 */

export interface DiagCoordinate {
  lat: number;
  lng: number;
}

export interface SegmentDiagnostic {
  /** Segment index (0-based) */
  index: number;
  /** Start POI coordinate */
  from: DiagCoordinate;
  /** End POI coordinate */
  to: DiagCoordinate;
  /** Haversine (straight-line) distance in km */
  geodesicDistanceKm: number;
  /** Road distance in km (from routing engine) */
  roadDistanceKm: number;
  /** Deviation ratio: road / geodesic — ideal is ~1.2–1.5 for urban */
  deviationRatio: number;
  /** Classification based on deviation ratio */
  quality: 'excellent' | 'good' | 'acceptable' | 'poor' | 'severe';
}

export interface RouteQualityReport {
  /** Total geodesic distance (km) */
  totalGeodesicKm: number;
  /** Total road distance (km) */
  totalRoadKm: number;
  /** Overall deviation ratio */
  overallDeviationRatio: number;
  /** Overall quality classification */
  overallQuality: 'excellent' | 'good' | 'acceptable' | 'poor' | 'severe';
  /** Number of segments */
  segmentCount: number;
  /** Per-segment diagnostics */
  segments: SegmentDiagnostic[];
  /** Efficiency percentage (geodesic / road × 100) */
  efficiencyPercent: number;
  /** Routing engine used */
  routingSource: string;
  /** Timestamp */
  generatedAt: string;
}

// ─── Haversine Distance ───
function haversineKm(a: DiagCoordinate, b: DiagCoordinate): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// ─── Classify deviation ratio ───
function classifyDeviation(ratio: number): 'excellent' | 'good' | 'acceptable' | 'poor' | 'severe' {
  if (ratio <= 1.3) return 'excellent';
  if (ratio <= 1.6) return 'good';
  if (ratio <= 2.0) return 'acceptable';
  if (ratio <= 3.0) return 'poor';
  return 'severe';
}

// ─── Calculate road distance between consecutive waypoints from polyline ───
function roadDistanceFromPolyline(
  polyline: DiagCoordinate[],
  segmentStart: DiagCoordinate,
  segmentEnd: DiagCoordinate,
): number {
  // Find the sub-polyline that corresponds to this segment
  // Strategy: find the closest point in the polyline to each segment endpoint
  // then sum distances between those polyline points

  const startIdx = findClosestPointIndex(polyline, segmentStart);
  const endIdx = findClosestPointIndex(polyline, segmentEnd);

  if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) {
    // Fallback: use geodesic distance
    return haversineKm(segmentStart, segmentEnd);
  }

  let distance = 0;
  for (let i = startIdx; i < endIdx; i++) {
    distance += haversineKm(polyline[i], polyline[i + 1]);
  }

  return distance;
}

function findClosestPointIndex(polyline: DiagCoordinate[], target: DiagCoordinate): number {
  let bestIdx = -1;
  let bestDist = Infinity;

  for (let i = 0; i < polyline.length; i++) {
    const d = haversineKm(polyline[i], target);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }

  return bestIdx;
}

// ─── Public API ───

/**
 * Generate a quality report for a routed path.
 *
 * @param waypoints  - The POI waypoints in visitation order
 * @param routePolyline - The full route polyline from the routing engine
 * @param routingSource - Which engine produced the route
 */
export function generateQualityReport(
  waypoints: DiagCoordinate[],
  routePolyline: DiagCoordinate[],
  routingSource: string,
): RouteQualityReport {
  const segments: SegmentDiagnostic[] = [];
  let totalGeodesic = 0;
  let totalRoad = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];

    const geodesic = haversineKm(from, to);
    const road = routePolyline.length > 0
      ? roadDistanceFromPolyline(routePolyline, from, to)
      : geodesic;

    const deviationRatio = geodesic > 0.001 ? road / geodesic : 1;

    segments.push({
      index: i,
      from,
      to,
      geodesicDistanceKm: Math.round(geodesic * 1000) / 1000,
      roadDistanceKm: Math.round(road * 1000) / 1000,
      deviationRatio: Math.round(deviationRatio * 100) / 100,
      quality: classifyDeviation(deviationRatio),
    });

    totalGeodesic += geodesic;
    totalRoad += road;
  }

  const overallRatio = totalGeodesic > 0.001 ? totalRoad / totalGeodesic : 1;
  const efficiency = totalRoad > 0.001 ? (totalGeodesic / totalRoad) * 100 : 100;

  return {
    totalGeodesicKm: Math.round(totalGeodesic * 1000) / 1000,
    totalRoadKm: Math.round(totalRoad * 1000) / 1000,
    overallDeviationRatio: Math.round(overallRatio * 100) / 100,
    overallQuality: classifyDeviation(overallRatio),
    segmentCount: segments.length,
    segments,
    efficiencyPercent: Math.round(efficiency * 10) / 10,
    routingSource,
    generatedAt: new Date().toISOString(),
  };
}
