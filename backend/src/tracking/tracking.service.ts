import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';

@Injectable()
export class TrackingService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateLocationDto) {
    const bike = await this.prisma.bike.findUnique({
      where: { id: data.bikeId },
    });
    if (!bike) {
      throw new NotFoundException('Bike not found');
    }

    // Check frameId uniqueness if frameId was supplied
    if (data.frameId) {
      const existing = await this.prisma.bikeLocation.findUnique({
        where: { frameId: data.frameId },
        select: { id: true },
      });
      if (existing) {
        return existing; // Idempotent return — duplicate frame ignored
      }
    }

    return this.prisma.bikeLocation.create({
      data: {
        frameId: data.frameId || null,
        rideId: data.rideId || null,
        bikeId: data.bikeId,
        latitude: data.latitude,
        longitude: data.longitude,
        speed: data.speed || 0,
        heading: data.heading || null,
        batteryLevel: data.batteryLevel !== undefined ? data.batteryLevel : 100,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        receivedAt: new Date(),
      },
    });
  }

  async checkBikeExists(bikeId: string): Promise<boolean> {
    const bike = await this.prisma.bike.findUnique({
      where: { id: bikeId },
      select: { id: true },
    });
    return !!bike;
  }

  async getLatestByBike(bikeId: string) {
    const location = await this.prisma.bikeLocation.findFirst({
      where: { bikeId },
      orderBy: { timestamp: 'desc' },
    });

    if (!location) {
      throw new NotFoundException('No location history for this bike');
    }

    return location;
  }
}
