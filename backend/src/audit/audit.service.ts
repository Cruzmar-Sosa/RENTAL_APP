import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReservationStatus, ReservationFinancialStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async recordReservationEvent(params: {
    reservationId: string;
    previousStatus?: ReservationStatus;
    nextStatus: ReservationStatus;
    previousFinancialStatus?: ReservationFinancialStatus;
    nextFinancialStatus: ReservationFinancialStatus;
    eventType: string;
    metadata?: any;
    createdById?: string;
    correlationId?: string;
    tx?: any; // Allow passing transaction client
  }) {
    const { tx, ...data } = params;
    const db = tx || this.prisma;

    try {
      return await db.reservationEvent.create({
        data: {
          reservationId: data.reservationId,
          previousStatus: data.previousStatus,
          nextStatus: data.nextStatus,
          previousFinancialStatus: data.previousFinancialStatus,
          nextFinancialStatus: data.nextFinancialStatus,
          eventType: data.eventType,
          metadata: data.metadata,
          createdById: data.createdById,
          correlationId: data.correlationId,
        },
      });
    } catch (error) {
      this.logger.error(`[AUDIT] Failed to record reservation event for ${data.reservationId}`, error);
    }
  }

  async recordPaymentEvent(params: {
    paymentId: string;
    reservationId: string;
    eventType: string;
    amount: any;
    currency: string;
    provider?: string;
    providerReference?: string;
    statusBefore?: PaymentStatus;
    statusAfter: PaymentStatus;
    metadata?: any;
    tx?: any;
  }) {
    const { tx, ...data } = params;
    const db = tx || this.prisma;

    try {
      return await db.paymentEvent.create({
        data: {
          paymentId: data.paymentId,
          reservationId: data.reservationId,
          eventType: data.eventType,
          amount: data.amount,
          currency: data.currency,
          provider: data.provider,
          providerReference: data.providerReference,
          statusBefore: data.statusBefore,
          statusAfter: data.statusAfter,
          metadata: data.metadata,
        },
      });
    } catch (error) {
      this.logger.error(`[AUDIT] Failed to record payment event for payment ${data.paymentId}`, error);
    }
  }
}
