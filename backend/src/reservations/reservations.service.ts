import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../core/database/prisma.service';

@Injectable()
export class ReservationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, bikeId: string) {
    const bike = await this.prisma.bike.findUnique({ where: { id: bikeId } });
    if (!bike || bike.status !== 'AVAILABLE') {
      throw new BadRequestException('Bike is not available');
    }

    const [reservation] = await this.prisma.$transaction([
      this.prisma.reservation.create({
        data: { userId, bikeId },
      }),
      this.prisma.bike.update({
        where: { id: bikeId },
        data: { status: 'RESERVED' },
      }),
    ]);

    return reservation;
  }

  async findAllByUserId(userId: string) {
    return this.prisma.reservation.findMany({
      where: { userId },
      include: { bike: true },
    });
  }

  async findAll() {
    return this.prisma.reservation.findMany({
      include: {
        user: { select: { id: true, email: true, name: true } },
        bike: true,
      },
    });
  }

  async complete(id: string) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });
    if (!reservation) throw new BadRequestException('Reservation not found');

    const [updatedReservation] = await this.prisma.$transaction([
      this.prisma.reservation.update({
        where: { id },
        data: { status: 'COMPLETED', endTime: new Date() },
      }),
      this.prisma.bike.update({
        where: { id: reservation.bikeId },
        data: { status: 'AVAILABLE' },
      }),
    ]);

    return updatedReservation;
  }
}
