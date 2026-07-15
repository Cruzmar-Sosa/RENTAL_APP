import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateReservationDto,
  StartRideDto,
  CompleteRideDto,
  ReportIncidentDto,
  SettleRideDto,
  CheckInDto,
} from './dto/create-reservation.dto';
import { TrackingGateway } from '../tracking/tracking.gateway';
import { ReservationLifecycleService } from './reservation-lifecycle.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    private prisma: PrismaService,
    private trackingGateway: TrackingGateway,
    private lifecycle: ReservationLifecycleService,
    private audit: AuditService,
  ) {}

  // ─────────────────────────────────────────────
  // CREATE RESERVATION
  // ─────────────────────────────────────────────
  async create(caller: any, dto: CreateReservationDto) {
    try {
      this.logger.log(
        `[CREATE] Attempting reservation for Bike ${dto.bikeId} by User ${caller.sub}`,
      );

      const effectiveUserId = dto.targetUserId || caller.sub;

      if (effectiveUserId !== caller.sub && caller.role !== 'ADMIN') {
        throw new ForbiddenException(
          'You do not have permission to create a reservation for another user.',
        );
      }

      // ── Atomic check and lock ──
      return await this.prisma.$transaction(async (tx) => {
        // Lock bike record for update to prevent concurrent reservations
        await tx.$queryRaw`SELECT * FROM "Bike" WHERE id = ${dto.bikeId} FOR UPDATE`;

        const bike = await tx.bike.findUnique({
          where: { id: dto.bikeId },
        });

        if (!bike) {
          throw new BadRequestException('Bike does not exist');
        }

        if (
          bike.operationalStatus !== 'AVAILABLE' ||
          bike.technicalStatus !== 'OK'
        ) {
          const reason =
            bike.technicalStatus !== 'OK'
              ? `Maintenance (${bike.technicalStatus})`
              : `Operational (${bike.operationalStatus})`;
          throw new BadRequestException(
            `Bike is not available for reservation. Reason: ${reason}`,
          );
        }

        if (bike.batteryLevel < 20) {
          throw new BadRequestException('Bike battery too low to be reserved');
        }

        const rate =
          caller.role === 'ADMIN' && dto.ratePerHour !== undefined
            ? dto.ratePerHour
            : 50;
        const startDate = dto.startTime ? new Date(dto.startTime) : new Date();
        const endDate = dto.endTime
          ? new Date(dto.endTime)
          : new Date(startDate.getTime() + 2 * 3600000);
        const totalHours = Math.max(
          1,
          Math.ceil((endDate.getTime() - startDate.getTime()) / 3600000),
        );
        const extrasTotal = dto.extrasTotal ?? 0;
        const priceEstimated = rate * totalHours + extrasTotal;

        const isPaid = dto.paymentOption === 'FULL';
        const isDeposit = dto.paymentOption === 'DEPOSIT';
        const reservationStatus = isPaid || isDeposit ? 'CONFIRMED' : 'PENDING';
        const financialStatus =
          isPaid || isDeposit
            ? isDeposit
              ? 'PARTIALLY_PAID'
              : 'PAID'
            : 'PENDING';

        const expiresAt =
          dto.paymentOption === 'LATER'
            ? new Date(Date.now() + 15 * 60 * 1000)
            : dto.expiresAt
              ? new Date(dto.expiresAt)
              : null;

        const depositAmount = isDeposit ? priceEstimated * 0.2 : priceEstimated;

        const reservation = await tx.reservation.create({
          data: {
            userId: effectiveUserId,
            bikeId: dto.bikeId,
            status: reservationStatus,
            financialStatus: financialStatus,
            priceEstimated,
            ratePerHour: rate,
            startTime: startDate,
            endTime: endDate,
            expiresAt,
            clientName: dto.clientName || null,
            clientPhone: dto.clientPhone || null,
            guestName: dto.guestName || null,
            guestDocument: dto.guestDocument || null,
            guestPhone: dto.guestPhone || null,
            extras: dto.extras
              ? JSON.parse(JSON.stringify(dto.extras))
              : undefined,
            extrasTotal,
            payments: {
              create: {
                amount: isDeposit ? depositAmount : priceEstimated,
                userId: effectiveUserId,
                type: isDeposit ? 'DEPOSIT' : 'UPFRONT',
                status: isPaid || isDeposit ? 'PAID' : 'PENDING',
              },
            },
          },
        });

        // ── Operational status transition ──
        await tx.bike.update({
          where: { id: dto.bikeId },
          data: {
            operationalStatus: 'RESERVED',
            status: 'RESERVED', // Deprecated compatibility field
          },
        });

        await this.audit.recordBikeEvent({
          bikeId: dto.bikeId,
          previousOperationalStatus: 'AVAILABLE',
          nextOperationalStatus: 'RESERVED',
          previousTechnicalStatus: bike.technicalStatus,
          nextTechnicalStatus: bike.technicalStatus,
          eventType: 'OPERATIONAL_STATUS_CHANGED',
          source: 'LIFECYCLE',
          correlationId: reservation.id,
          createdById: effectiveUserId,
          tx,
        });

        await this.audit.recordReservationEvent({
          reservationId: reservation.id,
          nextStatus: reservationStatus,
          nextFinancialStatus: financialStatus,
          eventType: 'RESERVATION_CREATED',
          correlationId: reservation.id,
          createdById: effectiveUserId,
          tx,
        });

        this.logger.log(
          `[CREATE] Success: Res ${reservation.id}, Bike ${dto.bikeId} -> RESERVED (Operational)`,
        );
        return reservation;
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      )
        throw error;
      this.logger.error('[CREATE] Failed', error);
      throw new InternalServerErrorException('Failed to create reservation');
    }
  }

  // ─────────────────────────────────────────────
  // CHECK-IN (Physical Validation)
  // ─────────────────────────────────────────────
  async checkIn(id: string, caller: any, dto: any) {
    try {
      this.logger.log(`[CHECK-IN] Initiating for Reservation ${id}`);
      if (caller.role !== 'ADMIN')
        throw new ForbiddenException('Only admins can perform check-in');

      return await this.prisma.$transaction(async (tx) => {
        // Pessimistic Lock
        await tx.$queryRaw`SELECT * FROM "Reservation" WHERE id = ${id} FOR UPDATE`;

        const reservation = await tx.reservation.findUnique({ where: { id } });
        if (!reservation)
          throw new BadRequestException('Reservation not found');

        this.lifecycle.validateTransition(reservation.status, 'CHECKED_IN');

        // Double Active Prevention
        const otherActive = await tx.reservation.findFirst({
          where: {
            bikeId: reservation.bikeId,
            status: { in: ['CHECKED_IN', 'ACTIVE'] },
            id: { not: id },
          },
        });
        if (otherActive)
          throw new BadRequestException(
            'Bike is already in CHECKED_IN or ACTIVE status by another reservation',
          );

        if (dto?.termsAccepted === false) {
          throw new BadRequestException('Terms must be accepted');
        }

        const updated = await tx.reservation.update({
          where: { id },
          data: {
            status: 'CHECKED_IN',
            checkInAt: new Date(),
            bikeCondition: dto?.bikeCondition || null,
            bikeNotes: dto?.bikeNotes || null,
            termsAccepted: dto?.termsAccepted ?? true,
          },
        });

        await tx.bike.update({
          where: { id: reservation.bikeId },
          data: {
            operationalStatus: 'IN_USE',
            status: 'IN_USE', // Block bike at check-in
          },
        });

        await this.audit.recordBikeEvent({
          bikeId: reservation.bikeId,
          previousOperationalStatus: 'RESERVED',
          nextOperationalStatus: 'IN_USE',
          previousTechnicalStatus: 'OK', // Assume OK if it was reserved
          nextTechnicalStatus: 'OK',
          eventType: 'OPERATIONAL_STATUS_CHANGED',
          source: 'LIFECYCLE',
          correlationId: id,
          createdById: caller.sub,
          tx,
        });

        await this.audit.recordReservationEvent({
          reservationId: id,
          previousStatus: reservation.status,
          nextStatus: 'CHECKED_IN',
          previousFinancialStatus: reservation.financialStatus,
          nextFinancialStatus: reservation.financialStatus,
          eventType: 'RESERVATION_CHECKED_IN',
          correlationId: id,
          createdById: caller.sub,
          tx,
        });

        this.logger.log(
          `[CHECK-IN] Success: Res ${id}, Bike ${reservation.bikeId} -> IN_USE (Operational Blocked)`,
        );
        return updated;
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      )
        throw error;
      this.logger.error('[CHECK-IN] Failed', error);
      throw new InternalServerErrorException('Failed to perform check-in');
    }
  }

  // ─────────────────────────────────────────────
  // START RIDE (Transition to ACTIVE)
  // ─────────────────────────────────────────────
  async start(id: string, caller: any) {
    try {
      this.logger.log(`[START-RIDE] Starting ride for Reservation ${id}`);
      if (caller.role !== 'ADMIN')
        throw new ForbiddenException('Only admins can start rides');

      return await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT * FROM "Reservation" WHERE id = ${id} FOR UPDATE`;
        const reservation = await tx.reservation.findUnique({ where: { id } });
        if (!reservation)
          throw new BadRequestException('Reservation not found');

        this.lifecycle.validateTransition(reservation.status, 'ACTIVE');

        const updated = await tx.reservation.update({
          where: { id },
          data: {
            status: 'ACTIVE',
            actualStart: new Date(),
          },
        });

        await this.audit.recordReservationEvent({
          reservationId: id,
          previousStatus: reservation.status,
          nextStatus: 'ACTIVE',
          previousFinancialStatus: reservation.financialStatus,
          nextFinancialStatus: reservation.financialStatus,
          eventType: 'RESERVATION_STARTED',
          correlationId: id,
          createdById: caller.sub,
          tx,
        });

        this.logger.log(`[START-RIDE] Success: Res ${id} -> ACTIVE`);
        return updated;
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      )
        throw error;
      this.logger.error('[START-RIDE] Failed', error);
      throw new InternalServerErrorException('Failed to start ride');
    }
  }

  // ─────────────────────────────────────────────
  // COMPLETE RIDE (Operational End)
  // ─────────────────────────────────────────────
  async complete(id: string, caller: any, dto?: CompleteRideDto) {
    try {
      this.logger.log(`[COMPLETE-RIDE] Ending ride for Reservation ${id}`);
      if (caller.role !== 'ADMIN')
        throw new ForbiddenException('Only admins can end rides');

      return await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT * FROM "Reservation" WHERE id = ${id} FOR UPDATE`;
        const reservation = await tx.reservation.findUnique({
          where: { id },
          include: { payments: true },
        });
        if (!reservation)
          throw new BadRequestException('Reservation not found');

        this.lifecycle.validateTransition(reservation.status, 'COMPLETED');

        const actualEnd = dto?.actualEnd ? new Date(dto.actualEnd) : new Date();
        const isCompanyFault = dto?.incidentCategory === 'COMPANY_FAULT';
        const { balance, priceActual } = this.lifecycle.calculateFinancials(
          reservation,
          actualEnd,
          dto?.priceActual !== undefined,
          dto?.priceActual,
          isCompanyFault,
        );

        const targetStatus = balance !== 0 ? 'SETTLEMENT_PENDING' : 'SETTLED';

        const updated = await tx.reservation.update({
          where: { id },
          data: {
            status: 'COMPLETED', // Operational completion first
            actualEnd,
            priceActual,
            incidentType: dto?.incidentType || null,
            incidentCategory: dto?.incidentCategory || null,
            incidentNotes: dto?.incidentNotes || null,
          },
        });

        await this.audit.recordReservationEvent({
          reservationId: id,
          previousStatus: reservation.status,
          nextStatus: 'COMPLETED',
          previousFinancialStatus: reservation.financialStatus,
          nextFinancialStatus: reservation.financialStatus,
          eventType: 'RESERVATION_COMPLETED',
          correlationId: id,
          createdById: caller.sub,
          tx,
        });

        // We don't release bike yet, we wait for settlement to be COMPLETED -> SETTLEMENT_PENDING -> SETTLED
        // Actually, operational completion should move to SETTLEMENT_PENDING immediately if there is balance
        await tx.reservation.update({
          where: { id },
          data: { status: targetStatus },
        });

        await this.audit.recordReservationEvent({
          reservationId: id,
          previousStatus: 'COMPLETED',
          nextStatus: targetStatus,
          previousFinancialStatus: reservation.financialStatus,
          nextFinancialStatus: reservation.financialStatus,
          eventType: 'RESERVATION_PENDING_SETTLEMENT',
          correlationId: id,
          createdById: caller.sub,
          tx,
        });

        this.logger.log(
          `[COMPLETE-RIDE] Success: Res ${id} -> ${targetStatus}, priceActual: ${priceActual}`,
        );
        return updated;
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      )
        throw error;
      this.logger.error('[COMPLETE-RIDE] Failed', error);
      throw new InternalServerErrorException('Failed to complete ride');
    }
  }

  // ─────────────────────────────────────────────
  // SETTLE (Financial Closure)
  // ─────────────────────────────────────────────
  async settle(id: string, caller: any, dto?: SettleRideDto) {
    try {
      this.logger.log(
        `[SETTLE] Initiating financial closure for Reservation ${id}`,
      );
      if (caller.role !== 'ADMIN')
        throw new ForbiddenException('Only admins can settle');

      return await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT * FROM "Reservation" WHERE id = ${id} FOR UPDATE`;
        const reservation = await tx.reservation.findUnique({
          where: { id },
          include: { payments: true },
        });
        if (!reservation)
          throw new BadRequestException('Reservation not found');

        // Idempotency Check
        if (reservation.status === 'SETTLED') {
          this.logger.warn(
            `[SETTLE] Reservation ${id} is already SETTLED. Skipping.`,
          );
          return reservation;
        }

        const { balance, priceActual } = this.lifecycle.calculateFinancials(
          reservation,
          reservation.actualEnd || new Date(),
        );

        const payments: any[] = [];
        let finalFinancialStatus = reservation.financialStatus;

        if (balance > 0) {
          // Generate balance payment if it doesn't exist
          const existingBalance = reservation.payments.find(
            (p) => p.type === 'BALANCE' && p.status === 'PENDING',
          );
          if (!existingBalance) {
            payments.push({
              amount: balance,
              userId: reservation.userId,
              status: 'PAID', // In this flow we assume admin marks it as paid manually or via stripe
              type: 'BALANCE',
            });
            finalFinancialStatus = 'PAID';
          } else {
            // Update existing
            await tx.payment.update({
              where: { id: existingBalance.id },
              data: { status: 'PAID' },
            });
            finalFinancialStatus = 'PAID';
          }
        } else if (balance < 0) {
          payments.push({
            amount: Math.abs(balance),
            userId: reservation.userId,
            status: 'PAID',
            type: 'REFUND',
          });
          finalFinancialStatus = 'REFUNDED';
        } else {
          finalFinancialStatus = 'PAID';
        }

        // Validate settlement criteria
        this.lifecycle.validateSettlement(finalFinancialStatus);

        const updated = await tx.reservation.update({
          where: { id },
          data: {
            status: 'SETTLED',
            financialStatus: finalFinancialStatus,
            settledAt: new Date(),
            settlementReference:
              dto?.settlementReference ||
              `SETTLE-${Date.now()}-${id.slice(0, 4)}`,
            payments: payments.length > 0 ? { create: payments } : undefined,
          },
        });

        // Record payment events if new payments created
        if (payments.length > 0) {
          // Since we created them via nested write, let's find them or log the event
          // For safety, we can query or audit using a general event or resolve from updated payments
          await this.audit.recordPaymentEvent({
            paymentId: `settle-nested-payment-${id}`,
            reservationId: id,
            eventType: 'SETTLEMENT_PAYMENTS_GENERATED',
            amount: balance,
            currency: 'USD',
            statusAfter: 'PAID',
            tx,
          });
        }

        await this.audit.recordReservationEvent({
          reservationId: id,
          previousStatus: reservation.status,
          nextStatus: 'SETTLED',
          previousFinancialStatus: reservation.financialStatus,
          nextFinancialStatus: finalFinancialStatus,
          eventType: 'RESERVATION_SETTLED',
          correlationId: id,
          createdById: caller.sub,
          tx,
        });

        const isTechnicalIncident = [
          'ACCIDENT',
          'BREAKDOWN',
          'TECHNICAL_FAULT',
        ].includes(reservation.incidentCategory || '');

        // BikeOperationalStatus: AVAILABLE | RESERVED | CHECKED_IN | IN_USE
        // BikeOperationalStatus has NO OUT_OF_SERVICE — that lives in BikeTechnicalStatus
        await tx.bike.update({
          where: { id: reservation.bikeId },
          data: {
            operationalStatus: 'AVAILABLE', // Always returns to fleet operationally
            technicalStatus: isTechnicalIncident ? 'OUT_OF_SERVICE' : 'OK', // Technical flag if incident
            status: isTechnicalIncident ? 'MAINTENANCE' : 'AVAILABLE', // Legacy compatibility
          },
        });

        await this.audit.recordBikeEvent({
          bikeId: reservation.bikeId,
          previousOperationalStatus: 'IN_USE',
          nextOperationalStatus: 'AVAILABLE',
          previousTechnicalStatus: 'OK',
          nextTechnicalStatus: isTechnicalIncident ? 'OUT_OF_SERVICE' : 'OK',
          eventType: 'OPERATIONAL_STATUS_CHANGED',
          source: 'SETTLEMENT',
          correlationId: id,
          createdById: caller.sub,
          tx,
        });

        const nextTechLabel = isTechnicalIncident
          ? 'OUT_OF_SERVICE (incident)'
          : 'OK';
        this.logger.log(
          `[SETTLE] Success: Res ${id} -> SETTLED, Bike ${reservation.bikeId} -> AVAILABLE / ${nextTechLabel}`,
        );
        return updated;
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      )
        throw error;
      this.logger.error('[SETTLE] Failed', error);
      throw new InternalServerErrorException('Failed to settle reservation');
    }
  }

  // ─────────────────────────────────────────────
  // REPORT INCIDENT
  // ─────────────────────────────────────────────
  async reportIncident(id: string, caller: any, dto: any) {
    try {
      this.logger.log(
        `[REPORT INCIDENT] for Reservation ${id} by User ${caller.sub}`,
      );

      const reservation = await this.prisma.reservation.findUnique({
        where: { id },
      });

      if (!reservation) throw new BadRequestException('Reservation not found');

      this.lifecycle.validateOwnership(
        reservation.userId,
        caller.sub,
        caller.role,
      );

      if (reservation.status === 'COMPLETED') {
        throw new BadRequestException(
          'Cannot report an incident on a completed ride',
        );
      }

      const updatedReservation = await this.prisma.reservation.update({
        where: { id },
        data: {
          incidentType: dto.incidentType,
          incidentNotes: dto.incidentNotes || null,
          incidentReportedAt: new Date(),
          incidentReportedById: caller.sub,
        },
      });

      return updatedReservation;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      )
        throw error;
      this.logger.error('[REPORT INCIDENT] Failed', error);
      throw new InternalServerErrorException('Failed to report incident');
    }
  }

  // ─────────────────────────────────────────────
  // CANCEL
  // ─────────────────────────────────────────────
  async cancel(id: string, caller: any) {
    try {
      this.logger.log(`[CANCEL] Cancelling Reservation ${id}`);
      const reservation = await this.prisma.reservation.findUnique({
        where: { id },
      });
      if (!reservation) throw new BadRequestException('Reservation not found');

      this.lifecycle.validateOwnership(
        reservation.userId,
        caller.sub,
        caller.role,
      );
      this.lifecycle.validateTransition(reservation.status, 'CANCELLED');

      const [updatedReservation] = await this.prisma.$transaction(
        async (tx) => {
          // Pessimistic Lock
          await tx.$queryRaw`SELECT * FROM "Reservation" WHERE id = ${id} FOR UPDATE`;
          await tx.$queryRaw`SELECT * FROM "Bike" WHERE id = ${reservation.bikeId} FOR UPDATE`;

          const res = await tx.reservation.update({
            where: { id },
            data: { status: 'CANCELLED' },
          });

          await tx.bike.update({
            where: { id: reservation.bikeId },
            data: {
              operationalStatus: 'AVAILABLE',
              status: 'AVAILABLE',
            },
          });

          await this.audit.recordBikeEvent({
            bikeId: reservation.bikeId,
            previousOperationalStatus: 'RESERVED', // Cancellations happen from RESERVED/PENDING
            nextOperationalStatus: 'AVAILABLE',
            previousTechnicalStatus: 'OK',
            nextTechnicalStatus: 'OK',
            eventType: 'OPERATIONAL_STATUS_CHANGED',
            source: 'LIFECYCLE',
            correlationId: id,
            createdById: caller.sub,
            tx,
          });

          await tx.payment.updateMany({
            where: { reservationId: id, status: 'PENDING' },
            data: { status: 'FAILED' },
          });

          return [res];
        },
      );

      return updatedReservation;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      )
        throw error;
      this.logger.error('[CANCEL] Failed', error);
      throw new InternalServerErrorException('Failed to cancel reservation');
    }
  }

  // ─────────────────────────────────────────────
  // FIND
  // ─────────────────────────────────────────────
  async findOne(id: string, caller: any) {
    try {
      const reservation = await this.prisma.reservation.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              documentType: true,
              documentNumber: true,
            },
          },
          bike: true,
          payments: { orderBy: { createdAt: 'asc' } },
          incidentReportedBy: { select: { name: true, email: true } },
        },
      });
      if (!reservation) throw new BadRequestException('Reservation not found');

      this.lifecycle.validateOwnership(
        reservation.userId,
        caller.sub,
        caller.role,
      );

      return reservation;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      )
        throw error;
      this.logger.error('[findOne]', error);
      throw new InternalServerErrorException('Failed to fetch reservation');
    }
  }

  async findAllByUserId(userId: string) {
    try {
      return this.prisma.reservation.findMany({
        where: { userId },
        include: {
          bike: true,
          payments: true,
          incidentReportedBy: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error('[findAllByUserId]', error);
      throw new InternalServerErrorException('Failed to fetch reservations');
    }
  }

  async findAll(caller: any) {
    try {
      const where = caller.role === 'ADMIN' ? {} : { userId: caller.sub };
      return this.prisma.reservation.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              documentNumber: true,
              documentType: true,
            },
          },
          bike: true,
          payments: true,
          incidentReportedBy: { select: { name: true, email: true } },
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

      this.logger.log(
        `[Cron] Found ${expired.length} expired reservation(s) to cancel.`,
      );

      for (const res of expired) {
        await this.prisma.$transaction(async (tx) => {
          // Lock records
          await tx.$queryRaw`SELECT * FROM "Reservation" WHERE id = ${res.id} FOR UPDATE`;
          await tx.$queryRaw`SELECT * FROM "Bike" WHERE id = ${res.bikeId} FOR UPDATE`;

          await tx.reservation.update({
            where: { id: res.id },
            data: { status: 'CANCELLED' },
          });

          await tx.bike.update({
            where: { id: res.bikeId },
            data: {
              operationalStatus: 'AVAILABLE',
              status: 'AVAILABLE',
            },
          });

          await this.audit.recordBikeEvent({
            bikeId: res.bikeId,
            previousOperationalStatus: 'RESERVED',
            nextOperationalStatus: 'AVAILABLE',
            previousTechnicalStatus: 'OK',
            nextTechnicalStatus: 'OK',
            eventType: 'OPERATIONAL_STATUS_CHANGED',
            source: 'CRON',
            correlationId: res.id,
            tx,
          });

          await tx.payment.updateMany({
            where: { reservationId: res.id, status: 'PENDING' },
            data: { status: 'FAILED' },
          });
        });

        this.trackingGateway.server.emit('reservation_expired', {
          bikeId: res.bikeId,
          reservationId: res.id,
        });

        this.logger.log(
          `[Cron] Expired reservation ${res.id} → CANCELLED, Bike ${res.bikeId} → AVAILABLE (Operational)`,
        );
      }
    } catch (error) {
      this.logger.error('[Cron] Failed to process expired reservations', error);
    }
  }
}
