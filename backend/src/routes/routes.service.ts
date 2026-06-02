import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { CreatePoiDto } from './dto/create-poi.dto';
import { UpdatePoiDto } from './dto/update-poi.dto';
import { safeParsePolyline } from '../common/utils/geo';
import { Prisma } from '@prisma/client';

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
        visualPolyline: parsedVisual.length > 0 ? (parsedVisual as any) : Prisma.DbNull,
        navigationPolyline: parsedNavigation.length > 0 ? (parsedNavigation as any) : Prisma.DbNull,
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

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.thumbnail !== undefined) updateData.thumbnail = data.thumbnail;
    if (data.visibility !== undefined) updateData.visibility = data.visibility;
    if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
    if (data.distanceKm !== undefined) updateData.distanceKm = Number(data.distanceKm);
    if (data.durationMin !== undefined) updateData.durationMin = Number(data.durationMin);
    
    if (data.visualPolyline !== undefined) {
      const parsedVisual = safeParsePolyline(data.visualPolyline);
      updateData.visualPolyline = parsedVisual.length > 0 ? (parsedVisual as any) : Prisma.DbNull;
    }
    if (data.navigationPolyline !== undefined) {
      const parsedNavigation = safeParsePolyline(data.navigationPolyline);
      updateData.navigationPolyline = parsedNavigation.length > 0 ? (parsedNavigation as any) : Prisma.DbNull;
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
        gallery: data.gallery ? (data.gallery as any) : Prisma.DbNull,
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

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.gallery !== undefined) updateData.gallery = data.gallery ? (data.gallery as any) : Prisma.DbNull;
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

  async getDirections(coordinates: { lat: number; lng: number }[]) {
    // Safety Validation: Must have at least 2 coordinates
    if (!coordinates || coordinates.length < 2) {
      return { coordinates: coordinates || [] };
    }

    // Remove consecutive duplicates (can cause routing engine issues)
    const cleanedCoordinates = coordinates.filter((c, idx) => {
      if (idx === 0) return true;
      const prev = coordinates[idx - 1];
      return c.lat !== prev.lat || c.lng !== prev.lng;
    });

    if (cleanedCoordinates.length < 2) {
      return { coordinates: cleanedCoordinates };
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
            }),
          }
        );

        if (response.ok) {
          const geojson: any = await response.json();
          const routeCoords = geojson.features?.[0]?.geometry?.coordinates;
          if (Array.isArray(routeCoords) && routeCoords.length > 0) {
            const points = routeCoords.map(([lng, lat]: [number, number]) => ({
              lat: Math.round(lat * 1000000) / 1000000,
              lng: Math.round(lng * 1000000) / 1000000,
            }));
            return { coordinates: points, source: 'openrouteservice' };
          }
        } else {
          console.warn(`OpenRouteService responded with status ${response.status}`);
        }
      } catch (err) {
        console.warn('⚠️ OpenRouteService API failed, falling back to OSRM:', err);
      }
    }

    // 2. Fallback to OSRM (public server, no API key required)
    try {
      const pathString = cleanedCoordinates.map((c) => `${c.lng},${c.lat}`).join(';');
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${pathString}?overview=full&geometries=geojson`
      );

      if (response.ok) {
        const data: any = await response.json();
        const routeCoords = data.routes?.[0]?.geometry?.coordinates;
        if (Array.isArray(routeCoords) && routeCoords.length > 0) {
          const points = routeCoords.map(([lng, lat]: [number, number]) => ({
            lat: Math.round(lat * 1000000) / 1000000,
            lng: Math.round(lng * 1000000) / 1000000,
          }));
          return { coordinates: points, source: 'osrm' };
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
}
