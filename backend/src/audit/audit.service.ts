import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ReservationStatus,
  ReservationFinancialStatus,
  PaymentStatus,
  BikeOperationalStatus,
  BikeTechnicalStatus,
  BikeEventType,
  BikeEventSource,
} from '@prisma/client';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async recordReservationEvent(params: {
    reservationId: string;
    previousStatus?: ReservationStatus | null;
    nextStatus: ReservationStatus;
    previousFinancialStatus?: ReservationFinancialStatus | null;
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
      this.logger.error(
        `[AUDIT] Failed to record reservation event for ${data.reservationId}`,
        error,
      );
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
    statusBefore?: PaymentStatus | null;
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
      this.logger.error(
        `[AUDIT] Failed to record payment event for payment ${data.paymentId}`,
        error,
      );
    }
  }

  async recordBikeEvent(params: {
    bikeId: string;
    previousOperationalStatus?: BikeOperationalStatus;
    nextOperationalStatus: BikeOperationalStatus;
    previousTechnicalStatus?: BikeTechnicalStatus;
    nextTechnicalStatus: BikeTechnicalStatus;
    eventType: BikeEventType;
    source: BikeEventSource;
    correlationId?: string;
    metadata?: any;
    createdById?: string;
    tx?: any;
  }) {
    const { tx, ...data } = params;
    const db = tx || this.prisma;

    try {
      return await db.bikeEvent.create({
        data: {
          bikeId: data.bikeId,
          previousOperationalStatus: data.previousOperationalStatus,
          nextOperationalStatus: data.nextOperationalStatus,
          previousTechnicalStatus: data.previousTechnicalStatus,
          nextTechnicalStatus: data.nextTechnicalStatus,
          eventType: data.eventType,
          source: data.source,
          correlationId: data.correlationId,
          metadata: data.metadata,
          createdById: data.createdById,
        },
      });
    } catch (error) {
      this.logger.error(
        `[AUDIT] Failed to record bike event for bike ${data.bikeId}`,
        error,
      );
    }
  }
}
