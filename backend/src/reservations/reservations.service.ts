import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto, StartRideDto, CompleteRideDto } from './dto/create-reservation.dto';
import { TrackingGateway } from '../tracking/tracking.gateway';

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);
  private readonly DEFAULT_RATE = 50; // USD per hour

  constructor(
    private prisma: PrismaService,
    private trackingGateway: TrackingGateway
  ) {}

  // ─────────────────────────────────────────────
  // FINANCIAL UTILITY (Guard 2)
  // ─────────────────────────────────────────────
  
  private getFinancialState(reservation: any) {
    const paid = reservation.payments
      ?.filter((p: any) => p.status === 'PAID')
      .reduce((acc: number, p: any) => acc + (p.type === 'REFUND' ? -p.amount : p.amount), 0) || 0;
    
    const pending = reservation.payments
      ?.filter((p: any) => p.status === 'PENDING')
      .reduce((acc: number, p: any) => acc + p.amount, 0) || 0;

    const total = reservation.priceActual || reservation.priceEstimated || 0;

    return { paid, pending, total, balance: total - paid };
  }

  // ─────────────────────────────────────────────
  // CREATE RESERVATION (Guard 8: Snapshot confirmed)
  // ─────────────────────────────────────────────

  async create(callerUserId: string, dto: CreateReservationDto) {
    try {
      this.logger.log(`[CREATE] Attempting reservation for Bike ${dto.bikeId} by User ${callerUserId}`);
      
      const bike = await this.prisma.bike.findUnique({ where: { id: dto.bikeId } });
      if (!bike || bike.status !== 'AVAILABLE') {
        throw new BadRequestException('Bike is not available or does not exist');
      }
      if (bike.batteryLevel < 20) {
        throw new BadRequestException('Bike battery too low to be reserved');
      }

      const effectiveUserId = dto.targetUserId || callerUserId;

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
            // Snapshot persistent data (Guard 8)
            clientName: dto.clientName || null,
            clientPhone: dto.clientPhone || null,
            guestName: dto.guestName || null,
            guestDocument: dto.guestDocument || null,
            guestPhone: dto.guestPhone || null,
            extras: dto.extras ? JSON.parse(JSON.stringify(dto.extras)) : undefined,
            extrasTotal,
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
      this.logger.error('[CREATE] Failed', error);
      throw new InternalServerErrorException('Failed to create reservation');
    }
  }

  // ─────────────────────────────────────────────
  // START RIDE (CHECK-IN)
  // ─────────────────────────────────────────────

  async start(id: string, dto?: StartRideDto) {
    try {
      this.logger.log(`[START] Starting ride for Reservation ${id}`);
      
      const reservation = await this.prisma.reservation.findUnique({ where: { id } });
      if (!reservation) throw new BadRequestException('Reservation not found');

      if (reservation.status === 'PENDING') {
        throw new BadRequestException('Cannot start a PENDING reservation. Payment is required first.');
      }
      if (reservation.status !== 'CONFIRMED') {
        throw new BadRequestException(`Cannot start reservation with status ${reservation.status}`);
      }

      const bike = await this.prisma.bike.findUnique({ where: { id: reservation.bikeId } });
      if (bike && bike.status === 'IN_USE') {
        throw new BadRequestException('Bike is already in use by another rider.');
      }

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
      this.logger.error('[START] Failed', error);
      throw new InternalServerErrorException('Failed to start reservation');
    }
  }

  // ─────────────────────────────────────────────
  // COMPLETE RIDE (SETTLEMENT)
  // ─────────────────────────────────────────────

  async complete(id: string, dto?: CompleteRideDto) {
    try {
      this.logger.log(`[SETTLEMENT] Initiating for Reservation ${id}`);

      const reservation = await this.prisma.reservation.findUnique({
        where: { id },
        include: { payments: true },
      });

      if (!reservation) throw new BadRequestException('Reservation not found');
      
      // Guard 3: Prevent duplicate settlement
      if (reservation.status === 'COMPLETED') {
        throw new BadRequestException('Reservation is already completed and settled');
      }
      if (reservation.status !== 'ACTIVE') {
        throw new BadRequestException('Only active reservations can be completed');
      }

      // Guard 1: Prevent duplicate BALANCE payments
      const existingBalance = await this.prisma.payment.findFirst({
        where: { reservationId: id, type: 'BALANCE' }
      });
      if (existingBalance) {
        throw new BadRequestException('A balance payment already exists for this reservation');
      }

      const actualEnd = dto?.actualEnd ? new Date(dto.actualEnd) : new Date();
      const actualStart = reservation.actualStart || reservation.startTime;
      const rate = reservation.ratePerHour ?? this.DEFAULT_RATE;

      // Logic for Refund / Override
      const isCompanyFault = dto?.incidentCategory === 'COMPANY_FAULT';
      const isAdminOverride = dto?.priceActual === 0; // Or we can check days/hours in future
      
      let priceActual = dto?.priceActual;
      if (priceActual === undefined) {
        const hours = Math.max(1, Math.ceil((actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60)));
        priceActual = (hours * rate) + (reservation.extrasTotal ?? 0);
      }

      // If company fault or admin override, total cost is 0
      if (isCompanyFault || isAdminOverride) {
        priceActual = 0;
      }

      // Use Financial Utility (Guard 2)
      const resWithActual = { ...reservation, priceActual };
      const { balance } = this.getFinancialState(resWithActual);

      const payments: any[] = [];

      if (balance > 0) {
        payments.push({
          amount: balance,
          userId: reservation.userId,
          status: 'PENDING',
          type: 'BALANCE',
        });
        this.logger.log(`[SETTLEMENT] Generated BALANCE payment of $${balance} for Res ${id}`);
      } else if (balance < 0) {
        // Guard 7: Refund only with incident or admin override
        if (isCompanyFault || isAdminOverride || (dto?.incidentType && dto?.incidentType !== 'NONE')) {
          payments.push({
            amount: Math.abs(balance),
            userId: reservation.userId,
            status: 'PAID',
            type: 'REFUND',
          });
          this.logger.log(`[SETTLEMENT] Generated REFUND of $${Math.abs(balance)} for Res ${id} due to ${dto?.incidentCategory || dto?.incidentType || 'Manual Override'}`);
        } else {
          this.logger.log(`[SETTLEMENT] Early finish without incident for Res ${id}. No refund generated.`);
        }
      }

      const [updatedReservation] = await this.prisma.$transaction([
        this.prisma.reservation.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            actualEnd,
            priceActual,
            incidentType: dto?.incidentType || null,
            incidentCategory: dto?.incidentCategory || null,
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
      this.logger.error('[SETTLEMENT] Failed', error);
      throw new InternalServerErrorException('Failed to complete reservation');
    }
  }

  // ─────────────────────────────────────────────
  // CANCEL
  // ─────────────────────────────────────────────

  async cancel(id: string) {
    try {
      this.logger.log(`[CANCEL] Cancelling Reservation ${id}`);
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
        this.prisma.payment.updateMany({
          where: { reservationId: id, status: 'PENDING' },
          data: { status: 'FAILED' },
        }),
      ]);

      return updatedReservation;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('[CANCEL] Failed', error);
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
          this.prisma.payment.updateMany({
            where: { reservationId: res.id, status: 'PENDING' },
            data: { status: 'FAILED' },
          }),
        ]);
        
        // Real-time notification (Guard 4)
        this.trackingGateway.server.emit('reservation_expired', {
          bikeId: res.bikeId,
          reservationId: res.id
        });

        this.logger.log(`[Cron] Expired reservation ${res.id} → CANCELLED, Bike ${res.bikeId} → AVAILABLE`);
      }
    } catch (error) {
      this.logger.error('[Cron] Failed to process expired reservations', error);
    }
  }
}
