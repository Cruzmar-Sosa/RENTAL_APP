import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReservationsService {
  private readonly PRICE_PER_HOUR = 50; // USD per hour

  constructor(private prisma: PrismaService) {}

  async create(userId: string, bikeId: string) {
    try {
      const bike = await this.prisma.bike.findUnique({ where: { id: bikeId } });
      if (!bike || bike.status !== 'AVAILABLE') {
        throw new BadRequestException('Bike is not available or does not exist');
      }
      if (bike.batteryLevel < 20) {
        throw new BadRequestException('Bike battery too low to be reserved');
      }

      const priceEstimated = this.PRICE_PER_HOUR;

      const [reservation] = await this.prisma.$transaction([
        this.prisma.reservation.create({
          data: { userId, bikeId, status: 'CONFIRMED', priceEstimated },
        }),
        this.prisma.bike.update({
          where: { id: bikeId },
          data: { status: 'IN_USE' },
        }),
      ]);

      return reservation;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('[ReservationsService.create]', error);
      throw new InternalServerErrorException('Failed to create reservation');
    }
  }

  async start(id: string) {
    try {
      const reservation = await this.prisma.reservation.findUnique({ where: { id } });
      if (!reservation) throw new BadRequestException('Reservation not found');
      if (reservation.status !== 'CONFIRMED') throw new BadRequestException(`Cannot start reservation with status ${reservation.status}`);

      const [updatedReservation] = await this.prisma.$transaction([
        this.prisma.reservation.update({
          where: { id },
          data: { status: 'ACTIVE', actualStart: new Date() },
        }),
        this.prisma.bike.update({
          where: { id: reservation.bikeId },
          data: { status: 'IN_USE' },
        }),
      ]);

      return updatedReservation;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('[ReservationsService.start]', error);
      throw new InternalServerErrorException('Failed to start reservation');
    }
  }

  async cancel(id: string) {
    try {
      const reservation = await this.prisma.reservation.findUnique({ where: { id } });
      if (!reservation) throw new BadRequestException('Reservation not found');
      if (reservation.status === 'COMPLETED' || reservation.status === 'CANCELLED')
        throw new BadRequestException('Cannot cancel this reservation');

      const [updatedReservation] = await this.prisma.$transaction([
        this.prisma.reservation.update({
          where: { id },
          data: { status: 'CANCELLED' },
        }),
        this.prisma.bike.update({
          where: { id: reservation.bikeId },
          data: { status: 'AVAILABLE' },
        }),
      ]);

      return updatedReservation;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('[ReservationsService.cancel]', error);
      throw new InternalServerErrorException('Failed to cancel reservation');
    }
  }

  async findAllByUserId(userId: string) {
    try {
      return this.prisma.reservation.findMany({
        where: { userId },
        include: { bike: true },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('[ReservationsService.findAllByUserId]', error);
      throw new InternalServerErrorException('Failed to fetch reservations');
    }
  }

  async findAll() {
    try {
      return this.prisma.reservation.findMany({
        include: {
          user: { select: { id: true, email: true, name: true } },
          bike: true,
          payment: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('[ReservationsService.findAll]', error);
      throw new InternalServerErrorException('Failed to fetch reservations');
    }
  }

  async complete(id: string) {
    try {
      const reservation = await this.prisma.reservation.findUnique({ where: { id } });
      if (!reservation) throw new BadRequestException('Reservation not found');
      if (reservation.status !== 'ACTIVE') throw new BadRequestException('Only active reservations can be completed');

      const actualEnd = new Date();
      const actualStart = reservation.actualStart || reservation.startTime;
      const hours = Math.ceil((actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60));
      const priceActual = Math.max(hours * this.PRICE_PER_HOUR, this.PRICE_PER_HOUR);

      const [updatedReservation] = await this.prisma.$transaction([
        this.prisma.reservation.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            actualEnd,
            priceActual,
            payment: {
              create: {
                amount: priceActual,
                userId: reservation.userId,
                status: 'PENDING'
              }
            }
          },
          include: { payment: true }
        }),
        this.prisma.bike.update({
          where: { id: reservation.bikeId },
          data: { status: 'AVAILABLE' },
        }),
      ]);

      return updatedReservation;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('[ReservationsService.complete]', error);
      throw new InternalServerErrorException('Failed to complete reservation');
    }
  }
}
