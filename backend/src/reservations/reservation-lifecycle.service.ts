import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ReservationStatus, Role } from '@prisma/client';

@Injectable()
export class ReservationLifecycleService {
  private readonly DEFAULT_RATE = 50;

  // ─────────────────────────────────────────────
  // 1. Strict State Transitions
  // ─────────────────────────────────────────────
  // ─────────────────────────────────────────────
  // 1. Strict State Transitions (Formal State Machine)
  // ─────────────────────────────────────────────
  validateTransition(
    currentStatus: ReservationStatus,
    targetStatus: ReservationStatus,
  ): void {
    const validTransitions: Record<ReservationStatus, ReservationStatus[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['CHECKED_IN', 'CANCELLED', 'NO_SHOW'],
      CHECKED_IN: ['ACTIVE', 'CANCELLED'],
      ACTIVE: ['COMPLETED'],
      COMPLETED: ['SETTLEMENT_PENDING', 'SETTLED'],
      SETTLEMENT_PENDING: ['SETTLED'],
      SETTLED: [],
      CANCELLED: [],
      NO_SHOW: [],
    };

    if (!validTransitions[currentStatus]?.includes(targetStatus)) {
      throw new BadRequestException(
        `Business Rule Violation: Invalid status transition from ${currentStatus} to ${targetStatus}`,
      );
    }
  }

  // ─────────────────────────────────────────────
  // 2. Settlement Criteria
  // ─────────────────────────────────────────────
  validateSettlement(financialStatus: string): void {
    const validFinancialStatuses = ['PAID', 'REFUNDED'];
    if (!validFinancialStatuses.includes(financialStatus)) {
      throw new BadRequestException(
        `Settlement Denied: Reservation must be fully PAID or REFUNDED to reach SETTLED status. Current status: ${financialStatus}`,
      );
    }
  }

  // ─────────────────────────────────────────────
  // 2. Strict Ownership vs Role Checking
  // ─────────────────────────────────────────────
  validateOwnership(
    reservationTargetUserId: string,
    callerUserId: string,
    callerRole: Role,
  ): void {
    if (callerRole === 'ADMIN') return;

    if (reservationTargetUserId !== callerUserId) {
      throw new ForbiddenException(
        'You do not have permission to access or modify this reservation',
      );
    }
  }

  // ─────────────────────────────────────────────
  // 3. Financial Calculations (Backend Single Source of Truth)
  // ─────────────────────────────────────────────
  calculateFinancials(
    reservation: any,
    actualEnd: Date,
    isAdminOverride: boolean = false,
    overridePrice?: number,
    isCompanyFault: boolean = false,
  ) {
    const actualStart = reservation.actualStart || reservation.startTime;
    const rate = reservation.ratePerHour ?? this.DEFAULT_RATE;

    let priceActual = 0;

    if (isCompanyFault) {
      priceActual = 0;
    } else if (isAdminOverride && overridePrice !== undefined) {
      priceActual = overridePrice;
    } else {
      const hours = Math.max(
        1,
        Math.ceil(
          (actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60),
        ),
      );
      priceActual = hours * rate + (reservation.extrasTotal ?? 0);
    }

    const paid =
      reservation.payments
        ?.filter((p: any) => p.status === 'PAID')
        .reduce(
          (acc: number, p: any) =>
            acc + (p.type === 'REFUND' ? -p.amount : p.amount),
          0,
        ) || 0;

    const pending =
      reservation.payments
        ?.filter((p: any) => p.status === 'PENDING')
        .reduce((acc: number, p: any) => acc + p.amount, 0) || 0;

    const balance = priceActual - paid;

    return { paid, pending, priceActual, balance };
  }
}
