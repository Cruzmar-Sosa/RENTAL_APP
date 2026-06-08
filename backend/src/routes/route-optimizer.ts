/**
 * Route Optimizer — Nearest Neighbor + 2-opt
 *
 * Optimizes POI visitation order to minimize total travel distance.
 * Designed for ≤50 POIs with O(n²) complexity — instant execution.
 *
 * Strategy:
 * 1. Build Haversine distance matrix
 * 2. Nearest Neighbor heuristic for initial ordering
 * 3. 2-opt local search for iterative improvement
 */

export interface OptCoordinate {
  lat: number;
  lng: number;
}

export interface OptimizationResult {
  /** Reordered indices mapping: result[i] = original index */
  order: number[];
  /** Reordered coordinates */
  coordinates: OptCoordinate[];
  /** Total geodesic distance of the optimized route (km) */
  totalDistanceKm: number;
  /** Total geodesic distance before optimization (km) */
  originalDistanceKm: number;
  /** Improvement percentage */
  improvementPercent: number;
  /** Algorithm used */
  algorithm: 'nearest-neighbor+2-opt';
}

// ─── Haversine Distance (km) ───
function haversineKm(a: OptCoordinate, b: OptCoordinate): number {
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

// ─── Distance Matrix ───
function buildDistanceMatrix(coords: OptCoordinate[]): number[][] {
  const n = coords.length;
  const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = haversineKm(coords[i], coords[j]);
      matrix[i][j] = d;
      matrix[j][i] = d;
    }
  }

  return matrix;
}

// ─── Total route distance from ordered indices ───
function totalDistance(order: number[], dist: number[][]): number {
  let total = 0;
  for (let i = 0; i < order.length - 1; i++) {
    total += dist[order[i]][order[i + 1]];
  }
  return total;
}

// ─── Nearest Neighbor Heuristic ───
function nearestNeighbor(dist: number[][], startIdx: number): number[] {
  const n = dist.length;
  const visited = new Set<number>();
  const route: number[] = [startIdx];
  visited.add(startIdx);

  let current = startIdx;
  for (let step = 1; step < n; step++) {
    let nearestIdx = -1;
    let nearestDist = Infinity;

    for (let j = 0; j < n; j++) {
      if (!visited.has(j) && dist[current][j] < nearestDist) {
        nearestDist = dist[current][j];
        nearestIdx = j;
      }
    }

    if (nearestIdx === -1) break;
    route.push(nearestIdx);
    visited.add(nearestIdx);
    current = nearestIdx;
  }

  return route;
}

// ─── 2-opt Local Search ───
function twoOpt(order: number[], dist: number[][], maxIterations = 1000): number[] {
  const route = [...order];
  const n = route.length;
  let improved = true;
  let iterations = 0;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 1; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        // Calculate improvement from reversing segment [i, j]
        const d1 = dist[route[i - 1]][route[i]] + dist[route[j]][route[j + 1] !== undefined ? route[j + 1] : route[j]];
        const d2 = dist[route[i - 1]][route[j]] + dist[route[i]][route[j + 1] !== undefined ? route[j + 1] : route[i]];

        // More precise: compare total distance before and after swap
        const before = totalDistance(route, dist);

        // Reverse the segment
        const candidate = [...route];
        const segment = candidate.splice(i, j - i + 1);
        segment.reverse();
        candidate.splice(i, 0, ...segment);

        const after = totalDistance(candidate, dist);

        if (after < before - 0.001) {
          // Accept improvement
          for (let k = 0; k < candidate.length; k++) {
            route[k] = candidate[k];
          }
          improved = true;
        }
      }
    }
  }

  return route;
}

// ─── Public API ───

/**
 * Optimizes the visitation order of POI coordinates to minimize total distance.
 *
 * @param coordinates - Array of POI coordinates in their current order
 * @param fixedStart  - If true, keeps the first coordinate as the starting point
 * @returns OptimizationResult with reordered coordinates and metrics
 */
export function optimizeSequence(
  coordinates: OptCoordinate[],
  fixedStart = true,
): OptimizationResult {
  const n = coordinates.length;

  // Edge cases: 0, 1, or 2 points — no optimization possible
  if (n <= 2) {
    const originalDist = n === 2 ? haversineKm(coordinates[0], coordinates[1]) : 0;
    return {
      order: coordinates.map((_, i) => i),
      coordinates: [...coordinates],
      totalDistanceKm: originalDist,
      originalDistanceKm: originalDist,
      improvementPercent: 0,
      algorithm: 'nearest-neighbor+2-opt',
    };
  }

  const dist = buildDistanceMatrix(coordinates);

  // Original total distance
  const originalOrder = coordinates.map((_, i) => i);
  const originalDistanceKm = totalDistance(originalOrder, dist);

  // Step 1: Nearest Neighbor from index 0 (or best start)
  let bestOrder: number[];

  if (fixedStart) {
    // Fixed start at index 0
    const nnOrder = nearestNeighbor(dist, 0);
    bestOrder = twoOpt(nnOrder, dist);
  } else {
    // Try all starting points, keep best
    let bestDist = Infinity;
    bestOrder = originalOrder;

    for (let start = 0; start < n; start++) {
      const nnOrder = nearestNeighbor(dist, start);
      const optimized = twoOpt(nnOrder, dist);
      const d = totalDistance(optimized, dist);

      if (d < bestDist) {
        bestDist = d;
        bestOrder = optimized;
      }
    }
  }

  const optimizedDistanceKm = totalDistance(bestOrder, dist);
  const improvement =
    originalDistanceKm > 0
      ? ((originalDistanceKm - optimizedDistanceKm) / originalDistanceKm) * 100
      : 0;

  return {
    order: bestOrder,
    coordinates: bestOrder.map((i) => coordinates[i]),
    totalDistanceKm: Math.round(optimizedDistanceKm * 1000) / 1000,
    originalDistanceKm: Math.round(originalDistanceKm * 1000) / 1000,
    improvementPercent: Math.round(improvement * 10) / 10,
    algorithm: 'nearest-neighbor+2-opt',
  };
}
