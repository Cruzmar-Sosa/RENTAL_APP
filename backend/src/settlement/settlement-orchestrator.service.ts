import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettlementCalculatorService } from './settlement-calculator.service';
import { IncidentFinancialService } from './incident-financial.service';
import { AuditService } from '../audit/audit.service';
import { TrackingGateway } from '../tracking/tracking.gateway';
import { ReservationStatus, ReservationFinancialStatus, IncidentType, IncidentCategory, PaymentType } from '@prisma/client';

@Injectable()
export class SettlementOrchestratorService {
  // In-memory lock to prevent concurrent admin settlements for the same reservation
  private activeSettlements = new Set<string>();

  constructor(
    private prisma: PrismaService,
    private calculator: SettlementCalculatorService,
    private incidentService: IncidentFinancialService,
    private audit: AuditService,
    private trackingGateway: TrackingGateway
  ) {}

  /**
   * Performs financial closure on a reservation.
   * Runs all critical updates within a single ACID database transaction.
   * Assures idempotency via check on Reservation.status.
   */
  async settleReservation(reservationId: string, caller: any, dto?: { settlementReference?: string; idempotencyKey?: string }) {
    if (this.activeSettlements.has(reservationId)) {
      throw new BadRequestException('Settlement for this reservation is already in progress.');
    }
    
    // Calculate expected reference if an idempotency key is provided
    const expectedReference = dto?.idempotencyKey 
      ? `SETTLE-${dto.idempotencyKey}-${reservationId.slice(0, 4)}` 
      : null;

    this.activeSettlements.add(reservationId);

    try {
      return await this.prisma.$transaction(async (tx) => {
      // 1. Pessimistic Lock on Reservation and associated Bike
      await tx.$queryRaw`SELECT * FROM "Reservation" WHERE id = ${reservationId} FOR UPDATE`;
      
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
        include: { payments: true, bike: true },
      });

      if (!reservation) {
        throw new NotFoundException('Reservation not found');
      }

      // Lock the associated bike
      await tx.$queryRaw`SELECT * FROM "Bike" WHERE id = ${reservation.bikeId} FOR UPDATE`;

      // 2. Idempotency Check
      if (reservation.status === 'SETTLED') {
        return {
          status: 'SETTLED',
          alreadySettled: true,
          reservation,
        };
      }

      // 2.5 Strict Idempotency Key check (if reference already exists in the DB for any other reason)
      if (expectedReference) {
        const existingByRef = await tx.reservation.findUnique({
          where: { settlementReference: expectedReference },
        });
        if (existingByRef && existingByRef.id !== reservationId) {
           throw new BadRequestException('Idempotency key already used for a different settlement.');
        }
      }

      const ratePerHour = Number(reservation.ratePerHour) || 50;
      const actualEnd = reservation.actualEnd || new Date();
      const actualStart = reservation.actualStart || reservation.startTime;
      const durationHours = Math.max(1, Math.ceil((actualEnd.getTime() - actualStart.getTime()) / 3600000));
      const baseCost = durationHours * ratePerHour;
      const isOvertime = reservation.endTime ? actualEnd.getTime() > new Date(reservation.endTime).getTime() : false;

      // Resolve incident details
      const incType: IncidentType = reservation.incidentTypeEnum || 'NONE';
      const incCat: IncidentCategory = reservation.incidentCategoryEnum || 'CUSTOMER';

      const impact = this.incidentService.getFinancialImpact(
        incType,
        incCat,
        baseCost,
        isOvertime
      );

      // 3. Authoritative server-side financial calculations
      const calc = this.calculator.calculate(
        reservation,
        reservation.payments,
        actualEnd,
        {
          incidentCharges: impact.incidentCharges,
        }
      );

      // Force Resolved incident figures into the calculation result
      calc.damageCharges = impact.damageCharges;
      calc.incidentCredits = impact.incidentCredits;
      calc.latePenalty = impact.latePenalty;
      calc.creditsApplied = impact.incidentCredits;
      calc.netTotal = Math.max(0, calc.grossTotal - calc.creditsApplied);
      calc.balance = Number((calc.netTotal - calc.totalPaid).toFixed(2));

      // Append-only payment ledger entries
      const paymentOps: any[] = [];
      let finalFinancialStatus: ReservationFinancialStatus = calc.recommendedFinancialStatus;

      const balanceValue = calc.balance;

      if (balanceValue > 0) {
        // Collect remaining balance
        const existingBalance = reservation.payments.find(
          (p) => p.type === 'BALANCE' && p.status === 'PENDING'
        );
        if (!existingBalance) {
          const newPayment = await tx.payment.create({
            data: {
              reservationId: reservation.id,
              userId: reservation.userId,
              amount: balanceValue,
              status: 'PAID',
              type: 'BALANCE',
            },
          });
          paymentOps.push(newPayment);
        } else {
          const updatedPay = await tx.payment.update({
            where: { id: existingBalance.id },
            data: { status: 'PAID' },
          });
          paymentOps.push(updatedPay);
        }
        finalFinancialStatus = 'PAID';
      } else if (balanceValue < 0) {
        // Refund excess upfront or deposit amount
        const refundPayment = await tx.payment.create({
          data: {
            reservationId: reservation.id,
            userId: reservation.userId,
            amount: Math.abs(balanceValue),
            status: 'PAID',
            type: 'REFUND',
          },
        });
        paymentOps.push(refundPayment);
        finalFinancialStatus = 'REFUNDED';
      } else {
        finalFinancialStatus = 'PAID';
      }

      const reference = dto?.settlementReference || `SETTLE-${dto?.idempotencyKey || Date.now()}-${reservation.id.slice(0, 4)}`;

      // 4. Update Reservation Status to SETTLED
      const updatedReservation = await tx.reservation.update({
        where: { id: reservation.id },
        data: {
          status: 'SETTLED',
          financialStatus: finalFinancialStatus,
          settledAt: new Date(),
          priceActual: calc.netTotal,
          overtimeHours: calc.overtimeHours,
          overtimeCharges: calc.overtimeCharges,
          incidentCharges: calc.incidentCharges,
          creditsApplied: calc.creditsApplied,
          settledById: caller.sub,
          settlementReference: reference,
        },
      });

      // 5. Update Bike State
      const isTechnicalIncident = ['ACCIDENT', 'MECHANICAL', 'DAMAGE', 'THEFT'].includes(incType);
      await tx.bike.update({
        where: { id: reservation.bikeId },
        data: {
          operationalStatus: 'AVAILABLE',
          technicalStatus: isTechnicalIncident ? 'OUT_OF_SERVICE' : 'OK',
          status: isTechnicalIncident ? 'MAINTENANCE' : 'AVAILABLE',
        },
      });

      // 6. Record all Audit Events (Reservation, Payment, Bike) within the Transaction
      await this.audit.recordReservationEvent({
        reservationId: reservation.id,
        previousStatus: reservation.status,
        nextStatus: 'SETTLED',
        previousFinancialStatus: reservation.financialStatus,
        nextFinancialStatus: finalFinancialStatus,
        eventType: 'RESERVATION_SETTLED_ORCHESTRATED',
        correlationId: reference,
        createdById: caller.sub,
        tx,
      });

      for (const op of paymentOps) {
        await this.audit.recordPaymentEvent({
          paymentId: op.id,
          reservationId: reservation.id,
          eventType: op.type === 'REFUND' ? 'PAYMENT_REFUNDED' : 'PAYMENT_BALANCED',
          amount: op.amount,
          currency: 'USD',
          statusBefore: 'PENDING',
          statusAfter: 'PAID',
          tx,
        });
      }

      await this.audit.recordBikeEvent({
        bikeId: reservation.bikeId,
        previousOperationalStatus: reservation.bike.operationalStatus,
        nextOperationalStatus: 'AVAILABLE',
        previousTechnicalStatus: reservation.bike.technicalStatus,
        nextTechnicalStatus: isTechnicalIncident ? 'OUT_OF_SERVICE' : 'OK',
        eventType: 'OPERATIONAL_STATUS_CHANGED',
        source: 'SETTLEMENT',
        correlationId: reference,
        createdById: caller.sub,
        tx,
      });

      // Emit WS event post transaction hook simulation (via gateway)
      this.trackingGateway.server?.emit('reservation_settled', {
        reservationId: reservation.id,
        bikeId: reservation.bikeId,
        reference,
      });

      return {
        status: 'SETTLED',
        alreadySettled: false,
        reservation: updatedReservation,
        calculation: calc,
      };
    });
    } finally {
      this.activeSettlements.delete(reservationId);
    }
  }

  /**
   * Combines operational completion and financial settlement into a single ACID transaction step.
   * Used for ACTIVE reservations returning directly to settlement.
   */
  async completeAndSettle(reservationId: string, caller: any, dto?: { settlementReference?: string; idempotencyKey?: string }) {
    await this.prisma.$transaction(async (tx) => {
      // First operationally complete
      await tx.reservation.update({
        where: { id: reservationId },
        data: {
          status: 'COMPLETED',
          actualEnd: new Date(),
        },
      });
    });

    return await this.settleReservation(reservationId, caller, dto);
  }
}
