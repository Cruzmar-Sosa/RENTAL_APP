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

    return this.prisma.bikeLocation.create({
      data: {
        bikeId: data.bikeId,
        latitude: data.latitude,
        longitude: data.longitude,
        speed: data.speed || 0,
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
