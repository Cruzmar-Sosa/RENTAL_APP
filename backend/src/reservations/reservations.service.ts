import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto, StartRideDto, CompleteRideDto } from './dto/create-reservation.dto';

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);
  private readonly DEFAULT_RATE = 50; // USD per hour

  constructor(private prisma: PrismaService) {}

  // ─────────────────────────────────────────────
  // CREATE RESERVATION
  // ─────────────────────────────────────────────

  async create(callerUserId: string, dto: CreateReservationDto) {
    try {
      const bike = await this.prisma.bike.findUnique({ where: { id: dto.bikeId } });
      if (!bike || bike.status !== 'AVAILABLE') {
        throw new BadRequestException('Bike is not available or does not exist');
      }
      if (bike.batteryLevel < 20) {
        throw new BadRequestException('Bike battery too low to be reserved');
      }

      // Determine the actual user for this reservation
      const effectiveUserId = dto.targetUserId || callerUserId;

      // Update User Document Info if provided (only for registered users)
      if (dto.documentType && dto.documentNumber && !dto.guestName) {
        await this.prisma.user.update({
          where: { id: effectiveUserId },
          data: { documentType: dto.documentType, documentNumber: dto.documentNumber },
        });
      }

      const rate = dto.ratePerHour ?? this.DEFAULT_RATE;
      const startDate = dto.startTime ? new Date(dto.startTime) : new Date();
      const endDate = dto.endTime ? new Date(dto.endTime) : new Date(startDate.getTime() + 2 * 3600000);
      const totalHours = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 3600000));
      const extrasTotal = dto.extrasTotal ?? 0;
      const priceEstimated = (rate * totalHours) + extrasTotal;

      const isPaid = dto.paymentOption === 'FULL';
      const isDeposit = dto.paymentOption === 'DEPOSIT';
      const reservationStatus = (isPaid || isDeposit) ? 'CONFIRMED' : 'PENDING';

      // 15-minute expiration for unpaid reservations
      const expiresAt = dto.paymentOption === 'LATER'
        ? new Date(Date.now() + 15 * 60 * 1000)
        : (dto.expiresAt ? new Date(dto.expiresAt) : null);

      const depositAmount = isDeposit ? priceEstimated * 0.2 : priceEstimated;

      const [reservation] = await this.prisma.$transaction([
        this.prisma.reservation.create({
          data: {
            userId: effectiveUserId,
            bikeId: dto.bikeId,
            status: reservationStatus,
            priceEstimated,
            ratePerHour: rate,
            startTime: startDate,
            endTime: endDate,
            expiresAt,
            // Client snapshot
            clientName: dto.clientName || null,
            clientPhone: dto.clientPhone || null,
            // Guest data (walk-in)
            guestName: dto.guestName || null,
            guestDocument: dto.guestDocument || null,
            guestPhone: dto.guestPhone || null,
            // Extras
            extras: dto.extras ? JSON.parse(JSON.stringify(dto.extras)) : undefined,
            extrasTotal,
            // Payment
            payments: {
              create: {
                amount: isDeposit ? depositAmount : priceEstimated,
                userId: effectiveUserId,
                type: isDeposit ? 'DEPOSIT' : 'UPFRONT',
                status: (isPaid || isDeposit) ? 'PAID' : 'PENDING',
              },
            },
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
      this.logger.error('[create]', error);
      throw new InternalServerErrorException('Failed to create reservation');
    }
  }

  // ─────────────────────────────────────────────
  // START RIDE (CHECK-IN)
  // ─────────────────────────────────────────────

  async start(id: string, dto?: StartRideDto) {
    try {
      const reservation = await this.prisma.reservation.findUnique({ where: { id } });
      if (!reservation) throw new BadRequestException('Reservation not found');

      // STRICT: Only CONFIRMED can start
      if (reservation.status === 'PENDING') {
        throw new BadRequestException('Cannot start a PENDING reservation. Payment is required first.');
      }
      if (reservation.status !== 'CONFIRMED') {
        throw new BadRequestException(`Cannot start reservation with status ${reservation.status}`);
      }

      // Validate bike is not already in use
      const bike = await this.prisma.bike.findUnique({ where: { id: reservation.bikeId } });
      if (bike && bike.status === 'IN_USE') {
        throw new BadRequestException('Bike is already in use by another rider.');
      }

      // Terms must be accepted at check-in
      if (dto?.termsAccepted === false) {
        throw new BadRequestException('Terms and conditions must be accepted to start the ride.');
      }

      const [updatedReservation] = await this.prisma.$transaction([
        this.prisma.reservation.update({
          where: { id },
          data: {
            status: 'ACTIVE',
            actualStart: new Date(),
            bikeCondition: dto?.bikeCondition || null,
            bikeNotes: dto?.bikeNotes || null,
            termsAccepted: dto?.termsAccepted ?? true,
          },
        }),
        this.prisma.bike.update({
          where: { id: reservation.bikeId },
          data: { status: 'IN_USE' },
        }),
      ]);

      return updatedReservation;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('[start]', error);
      throw new InternalServerErrorException('Failed to start reservation');
    }
  }

  // ─────────────────────────────────────────────
  // COMPLETE RIDE (SETTLEMENT)
  // ─────────────────────────────────────────────

  async complete(id: string, dto?: CompleteRideDto) {
    try {
      const reservation = await this.prisma.reservation.findUnique({
        where: { id },
        include: { payments: true },
      });
      if (!reservation) throw new BadRequestException('Reservation not found');
      if (reservation.status !== 'ACTIVE') {
        throw new BadRequestException('Only active reservations can be completed');
      }

      const actualEnd = dto?.actualEnd ? new Date(dto.actualEnd) : new Date();
      const actualStart = reservation.actualStart || reservation.startTime;
      const rate = reservation.ratePerHour ?? this.DEFAULT_RATE;

      // Calculate actual price
      let priceActual = dto?.priceActual;
      if (priceActual === undefined) {
        const hours = Math.max(1, Math.ceil((actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60)));
        priceActual = (hours * rate) + (reservation.extrasTotal ?? 0);
      }

      // Calculate what was already paid
      const amountPaid = reservation.payments
        .filter((p) => p.status === 'PAID')
        .reduce((sum, p) => sum + p.amount, 0);

      const balance = dto?.balance !== undefined ? dto.balance : (priceActual - amountPaid);

      // Determine if we need to create a balance payment or refund
      const payments: any[] = [];

      if (balance > 0) {
        // Customer owes money → create BALANCE payment
        payments.push({
          amount: balance,
          userId: reservation.userId,
          status: 'PENDING',
          type: 'BALANCE',
        });
      } else if (balance < 0 && dto?.incidentType) {
        // Early finish WITH incident → create REFUND
        payments.push({
          amount: Math.abs(balance),
          userId: reservation.userId,
          status: 'PAID',
          type: 'REFUND',
        });
      }
      // Early finish WITHOUT incident → no refund (business rule)

      const [updatedReservation] = await this.prisma.$transaction([
        this.prisma.reservation.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            actualEnd,
            priceActual,
            incidentType: dto?.incidentType || null,
            incidentNotes: dto?.incidentNotes || null,
            payments: payments.length > 0
              ? { create: payments }
              : undefined,
          },
          include: { payments: true },
        }),
        this.prisma.bike.update({
          where: { id: reservation.bikeId },
          data: { status: 'AVAILABLE' },
        }),
      ]);

      return updatedReservation;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('[complete]', error);
      throw new InternalServerErrorException('Failed to complete reservation');
    }
  }

  // ─────────────────────────────────────────────
  // CANCEL
  // ─────────────────────────────────────────────

  async cancel(id: string) {
    try {
      const reservation = await this.prisma.reservation.findUnique({ where: { id } });
      if (!reservation) throw new BadRequestException('Reservation not found');
      if (reservation.status === 'COMPLETED' || reservation.status === 'CANCELLED') {
        throw new BadRequestException('Cannot cancel this reservation');
      }

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
      this.logger.error('[cancel]', error);
      throw new InternalServerErrorException('Failed to cancel reservation');
    }
  }

  // ─────────────────────────────────────────────
  // FIND
  // ─────────────────────────────────────────────

  async findOne(id: string) {
    try {
      const reservation = await this.prisma.reservation.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, email: true, name: true, phone: true, documentType: true, documentNumber: true } },
          bike: true,
          payments: { orderBy: { createdAt: 'asc' } },
        },
      });
      if (!reservation) throw new BadRequestException('Reservation not found');
      return reservation;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('[findOne]', error);
      throw new InternalServerErrorException('Failed to fetch reservation');
    }
  }

  async findAllByUserId(userId: string) {
    try {
      return this.prisma.reservation.findMany({
        where: { userId },
        include: { bike: true, payments: true },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error('[findAllByUserId]', error);
      throw new InternalServerErrorException('Failed to fetch reservations');
    }
  }

  async findAll() {
    try {
      return this.prisma.reservation.findMany({
        include: {
          user: { select: { id: true, email: true, name: true, phone: true, documentNumber: true, documentType: true } },
          bike: true,
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error('[findAll]', error);
      throw new InternalServerErrorException('Failed to fetch reservations');
    }
  }

  // ─────────────────────────────────────────────
  // CRON: Auto-expire PENDING reservations
  // ─────────────────────────────────────────────

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredReservations() {
    try {
      const now = new Date();
      const expired = await this.prisma.reservation.findMany({
        where: {
          status: 'PENDING',
          expiresAt: { lt: now },
        },
      });

      if (expired.length === 0) return;

      this.logger.log(`[Cron] Found ${expired.length} expired reservation(s) to cancel.`);

      for (const res of expired) {
        await this.prisma.$transaction([
          this.prisma.reservation.update({
            where: { id: res.id },
            data: { status: 'CANCELLED' },
          }),
          this.prisma.bike.update({
            where: { id: res.bikeId },
            data: { status: 'AVAILABLE' },
          }),
        ]);
        this.logger.log(`[Cron] Expired reservation ${res.id} → CANCELLED, Bike ${res.bikeId} → AVAILABLE`);
      }
    } catch (error) {
      this.logger.error('[Cron] Failed to process expired reservations', error);
    }
  }
}
