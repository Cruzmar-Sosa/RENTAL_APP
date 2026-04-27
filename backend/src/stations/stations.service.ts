import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class StationsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.StationCreateInput) {
    return this.prisma.station.create({ data });
  }

  async findAll() {
    return this.prisma.station.findMany({
      include: {
        bikes: true
      }
    });
  }

  async findOne(id: string) {
    return this.prisma.station.findUnique({
      where: { id },
      include: { bikes: true }
    });
  }

  async update(id: string, data: any) {
    return this.prisma.station.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.station.delete({
      where: { id },
    });
  }
}
