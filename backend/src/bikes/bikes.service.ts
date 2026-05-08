import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class BikesService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.BikeCreateInput) {
    return this.prisma.bike.create({ data });
  }

  async findAll() {
    return this.prisma.bike.findMany({
      include: { station: true },
      orderBy: [
        { code: 'asc' }
        //{ status: 'asc' }        
      ]
    });
  }

  async checkAvailability() {
    return this.prisma.bike.findMany({
      where: { status: 'AVAILABLE' },
      include: { station: true }
    });
  }

  async update(id: string, data: Prisma.BikeUpdateInput) {
    // Architectural Guard: Prevent direct status modification
    if (data.status) {
      const { status, ...rest } = data;
      return this.prisma.bike.update({
        where: { id },
        data: rest,
      });
    }

    return this.prisma.bike.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.bike.delete({ where: { id } });
  }
}
