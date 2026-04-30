import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { CreateReservationDto } from './dto/create-reservation.dto';

@Injectable()
export class ReservationsService {
  private readonly PRICE_PER_HOUR = 50; // USD per hour

  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateReservationDto) {
    try {
      const bike = await this.prisma.bike.findUnique({ where: { id: dto.bikeId } });
      if (!bike || bike.status !== 'AVAILABLE') {
        throw new BadRequestException('Bike is not available or does not exist');
      }
      if (bike.batteryLevel < 20) {
        throw new BadRequestException('Bike battery too low to be reserved');
      }

      // Update User Document Info if provided
      if (dto.documentType && dto.documentNumber) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { documentType: dto.documentType, documentNumber: dto.documentNumber },
        });
      }

      const priceEstimated = this.PRICE_PER_HOUR * Math.max(1, Math.ceil((new Date(dto.endTime || Date.now()).getTime() - new Date(dto.startTime || Date.now()).getTime()) / 3600000));
      const defaultExpires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
      
      const isPaid = dto.paymentOption === 'FULL';
      const isDeposit = dto.paymentOption === 'DEPOSIT';
      const reservationStatus = (isPaid || isDeposit) ? 'CONFIRMED' : 'PENDING';

      const [reservation] = await this.prisma.$transaction([
        this.prisma.reservation.create({
          data: { 
            userId, 
            bikeId: dto.bikeId, 
            status: reservationStatus, 
            priceEstimated,
            startTime: dto.startTime ? new Date(dto.startTime) : new Date(),
            endTime: dto.endTime ? new Date(dto.endTime) : undefined,
            expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : defaultExpires,
            payments: {
               create: {
                  amount: priceEstimated,
                  userId: userId,
                  type: isDeposit ? 'DEPOSIT' : 'UPFRONT',
                  status: isPaid || isDeposit ? 'PAID' : 'PENDING'
               }
            }
          },
        }),
        this.prisma.bike.update({
          where: { id: dto.bikeId },
          data: { status: 'RESERVED' },
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
      if (reservation.status === 'PENDING') throw new BadRequestException('Cannot start a pending reservation. Payment required.');
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
          user: { select: { id: true, email: true, name: true, documentNumber: true, documentType: true } },
          bike: true,
          payments: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('[ReservationsService.findAll]', error);
      throw new InternalServerErrorException('Failed to fetch reservations');
    }
  }

  async complete(id: string, settlementData?: { balance?: number, priceActual?: number, actualEnd?: string }) {
    try {
      const reservation = await this.prisma.reservation.findUnique({ 
        where: { id },
        include: { payments: true }
      });
      if (!reservation) throw new BadRequestException('Reservation not found');
      if (reservation.status !== 'ACTIVE') throw new BadRequestException('Only active reservations can be completed');

      const actualEnd = settlementData?.actualEnd ? new Date(settlementData.actualEnd) : new Date();
      let priceActual = settlementData?.priceActual;

      if (priceActual === undefined) {
         const actualStart = reservation.actualStart || reservation.startTime;
         const hours = Math.ceil((actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60));
         priceActual = Math.max(hours * this.PRICE_PER_HOUR, this.PRICE_PER_HOUR);
      }

      const balance = settlementData?.balance !== undefined ? settlementData.balance : 0;
      
      const paymentsCreation = balance > 0 ? {
         create: {
            amount: balance,
            userId: reservation.userId,
            status: 'PENDING',
            type: 'POST_RIDE'
         }
      } : undefined;

      const [updatedReservation] = await this.prisma.$transaction([
        this.prisma.reservation.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            actualEnd,
            priceActual,
            payments: paymentsCreation as any
          },
          include: { payments: true }
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
