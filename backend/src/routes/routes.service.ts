import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';

@Injectable()
export class RoutesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.route.findMany({
      include: {
        pois: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const route = await this.prisma.route.findUnique({
      where: { id },
      include: { pois: true }
    });
    
    if (!route) throw new NotFoundException('Route not found');
    return route;
  }

  async create(data: CreateRouteDto) {
    return this.prisma.route.create({
      data: {
        name: data.name,
        distanceKm: data.distanceKm,
        durationMin: data.durationMin
      }
    });
  }
}
