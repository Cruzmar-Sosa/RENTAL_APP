import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStationDto } from './dto/create-station.dto';

@Injectable()
export class StationsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateStationDto) {
    return this.prisma.station.create({ data: data as any });
  }

  async findAll() {
    return this.prisma.station.findMany({
      include: {
        bikes: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.station.findUnique({
      where: { id },
      include: { bikes: true },
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
