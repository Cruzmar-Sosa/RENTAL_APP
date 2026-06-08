import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { CreatePoiDto } from './dto/create-poi.dto';
import { UpdatePoiDto } from './dto/update-poi.dto';
import { safeParsePolyline } from '../common/utils/geo';
import { Prisma } from '@prisma/client';
import { optimizeSequence } from './route-optimizer';
import { generateQualityReport, type RouteQualityReport } from './route-diagnostics';

/** Response shape for the directions endpoint */
export interface DirectionsResult {
  coordinates: { lat: number; lng: number }[];
  source: string;
  /** Total route distance in km (from the routing engine) */
  distanceKm?: number;
  /** Estimated duration in seconds (from the routing engine) */
  durationSec?: number;
}

/** Response shape for the diagnostics endpoint */
export interface DiagnosticsResult {
  route: DirectionsResult;
  quality: RouteQualityReport;
}

@Injectable()
export class RoutesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.route.findMany({
      include: {
        pois: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const route = await this.prisma.route.findUnique({
      where: { id },
      include: {
        pois: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!route) throw new NotFoundException('Route not found');
    return route;
  }

  async create(data: CreateRouteDto) {
    const parsedVisual = safeParsePolyline(data.visualPolyline);
    const parsedNavigation = safeParsePolyline(data.navigationPolyline);
    return this.prisma.route.create({
      data: {
        name: data.name,
        description: data.description,
        thumbnail: data.thumbnail,
        visibility: data.visibility !== undefined ? data.visibility : true,
        difficulty: data.difficulty || 'EASY',
        distanceKm: Number(data.distanceKm ?? 0),
        durationMin: Number(data.durationMin ?? 0),
        visualPolyline: parsedVisual.length > 0 ? (parsedVisual as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        navigationPolyline: parsedNavigation.length > 0 ? (parsedNavigation as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
      include: {
        pois: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async update(id: string, data: UpdateRouteDto) {
    // Ensure route exists
    await this.findOne(id);

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.thumbnail !== undefined) updateData.thumbnail = data.thumbnail;
    if (data.visibility !== undefined) updateData.visibility = data.visibility;
    if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
    if (data.distanceKm !== undefined) updateData.distanceKm = Number(data.distanceKm);
    if (data.durationMin !== undefined) updateData.durationMin = Number(data.durationMin);
    
    if (data.visualPolyline !== undefined) {
      const parsedVisual = safeParsePolyline(data.visualPolyline);
      updateData.visualPolyline = parsedVisual.length > 0 ? (parsedVisual as unknown as Prisma.InputJsonValue) : Prisma.JsonNull;
    }
    if (data.navigationPolyline !== undefined) {
      const parsedNavigation = safeParsePolyline(data.navigationPolyline);
      updateData.navigationPolyline = parsedNavigation.length > 0 ? (parsedNavigation as unknown as Prisma.InputJsonValue) : Prisma.JsonNull;
    }

    return this.prisma.route.update({
      where: { id },
      data: updateData,
      include: {
        pois: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.route.delete({
      where: { id },
    });
  }

  // ─────────────────────────────────────────────
  // POI Operations
  // ─────────────────────────────────────────────

  async addPoi(routeId: string, data: CreatePoiDto) {
    // Verify route exists
    await this.findOne(routeId);

    return this.prisma.pOI.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        gallery: data.gallery ? (data.gallery as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        audioGuideUrl: data.audioGuideUrl,
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        order: Number(data.order !== undefined ? data.order : -1),
        routeId,
      },
    });
  }

  async updatePoi(poiId: string, data: UpdatePoiDto) {
    const poi = await this.prisma.pOI.findUnique({
      where: { id: poiId },
    });
    if (!poi) throw new NotFoundException('POI not found');

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.gallery !== undefined) updateData.gallery = data.gallery ? (data.gallery as unknown as Prisma.InputJsonValue) : Prisma.JsonNull;
    if (data.audioGuideUrl !== undefined) updateData.audioGuideUrl = data.audioGuideUrl;
    if (data.latitude !== undefined) updateData.latitude = Number(data.latitude);
    if (data.longitude !== undefined) updateData.longitude = Number(data.longitude);
    if (data.order !== undefined) updateData.order = Number(data.order);

    return this.prisma.pOI.update({
      where: { id: poiId },
      data: updateData,
    });
  }

  async deletePoi(poiId: string) {
    const poi = await this.prisma.pOI.findUnique({
      where: { id: poiId },
    });
    if (!poi) throw new NotFoundException('POI not found');

    return this.prisma.pOI.delete({
      where: { id: poiId },
    });
  }

  async reorderPois(routeId: string, orders: { id: string; order: number }[]) {
    await this.findOne(routeId);

    // Update each POI order in a transaction
    await this.prisma.$transaction(
      orders.map((item) =>
        this.prisma.pOI.update({
          where: { id: item.id },
          data: { order: Number(item.order) },
        })
      )
    );

    return this.findOne(routeId);
  }

  // ─────────────────────────────────────────────
  // Routing Engine
  // ─────────────────────────────────────────────

  async getDirections(
    coordinates: { lat: number; lng: number }[],
    optimize = false,
  ): Promise<DirectionsResult> {
    // Safety Validation: Must have at least 2 coordinates
    if (!coordinates || coordinates.length < 2) {
      return { coordinates: coordinates || [], source: 'passthrough' };
    }

    // Optionally optimize the visitation order before routing
    let routingCoords = coordinates;
    if (optimize && coordinates.length >= 3) {
      const result = optimizeSequence(coordinates, true);
      routingCoords = result.coordinates;
      console.log(
        `🔄 Route optimized: ${result.originalDistanceKm} km → ${result.totalDistanceKm} km (${result.improvementPercent}% improvement)`,
      );
    }

    // Remove consecutive duplicates (can cause routing engine issues)
    const cleanedCoordinates = routingCoords.filter((c, idx) => {
      if (idx === 0) return true;
      const prev = routingCoords[idx - 1];
      return c.lat !== prev.lat || c.lng !== prev.lng;
    });

    if (cleanedCoordinates.length < 2) {
      return { coordinates: cleanedCoordinates, source: 'passthrough' };
    }

    const apiKey = process.env.OPENROUTESERVICE_API_KEY;

    // 1. Try OpenRouteService if API Key is configured
    if (apiKey) {
      try {
        const response = await fetch(
          'https://api.openrouteservice.org/v2/directions/cycling-regular/geojson',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': apiKey,
            },
            body: JSON.stringify({
              coordinates: cleanedCoordinates.map((c) => [c.lng, c.lat]),
              // Improved routing parameters
              radiuses: cleanedCoordinates.map(() => 150), // 150m snap radius
              continue_straight: true, // Minimize unnecessary turns
            }),
          }
        );

        if (response.ok) {
          const geojson = await response.json() as {
            features?: Array<{
              geometry?: { coordinates?: number[][] };
              properties?: { summary?: { distance?: number; duration?: number } };
            }>;
          };
          const feature = geojson.features?.[0];
          const routeCoords = feature?.geometry?.coordinates;
          const summary = feature?.properties?.summary;

          if (Array.isArray(routeCoords) && routeCoords.length > 0) {
            const points = routeCoords.map(([lng, lat]: number[]) => ({
              lat: Math.round(lat * 1000000) / 1000000,
              lng: Math.round(lng * 1000000) / 1000000,
            }));
            return {
              coordinates: points,
              source: 'openrouteservice',
              distanceKm: summary?.distance ? Math.round((summary.distance / 1000) * 1000) / 1000 : undefined,
              durationSec: summary?.duration ? Math.round(summary.duration) : undefined,
            };
          }
        } else {
          console.warn(`OpenRouteService responded with status ${response.status}`);
        }
      } catch (err) {
        console.warn('⚠️ OpenRouteService API failed, falling back to OSRM:', err);
      }
    }

    // 2. Fallback to OSRM (public server — BIKE profile)
    try {
      const pathString = cleanedCoordinates.map((c) => `${c.lng},${c.lat}`).join(';');
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/bike/${pathString}?overview=full&geometries=geojson&steps=false`
      );

      if (response.ok) {
        const data = await response.json() as {
          routes?: Array<{
            geometry?: { coordinates?: number[][] };
            distance?: number;
            duration?: number;
          }>;
        };
        const route = data.routes?.[0];
        const routeCoords = route?.geometry?.coordinates;

        if (Array.isArray(routeCoords) && routeCoords.length > 0) {
          const points = routeCoords.map(([lng, lat]: number[]) => ({
            lat: Math.round(lat * 1000000) / 1000000,
            lng: Math.round(lng * 1000000) / 1000000,
          }));
          return {
            coordinates: points,
            source: 'osrm-bike',
            distanceKm: route?.distance ? Math.round((route.distance / 1000) * 1000) / 1000 : undefined,
            durationSec: route?.duration ? Math.round(route.duration) : undefined,
          };
        }
      } else {
        console.warn(`OSRM responded with status ${response.status}`);
      }
    } catch (err) {
      console.warn('⚠️ OSRM API failed, falling back to straight-line rendering:', err);
    }

    // 3. Ultimate Fallback: Straight lines
    return { coordinates: cleanedCoordinates, source: 'fallback-straight-line' };
  }

  // ─────────────────────────────────────────────
  // Route Optimization (standalone)
  // ─────────────────────────────────────────────

  optimizePoiSequence(coordinates: { lat: number; lng: number }[]) {
    if (!coordinates || coordinates.length < 3) {
      return {
        order: coordinates?.map((_, i) => i) || [],
        coordinates: coordinates || [],
        totalDistanceKm: 0,
        originalDistanceKm: 0,
        improvementPercent: 0,
        algorithm: 'nearest-neighbor+2-opt' as const,
      };
    }
    return optimizeSequence(coordinates, true);
  }

  // ─────────────────────────────────────────────
  // Route Diagnostics
  // ─────────────────────────────────────────────

  async getDiagnostics(
    coordinates: { lat: number; lng: number }[],
  ): Promise<DiagnosticsResult> {
    // First, get the actual route
    const route = await this.getDirections(coordinates, false);

    // Then generate quality analysis
    const quality = generateQualityReport(
      coordinates,
      route.coordinates,
      route.source,
    );

    return { route, quality };
  }
}
