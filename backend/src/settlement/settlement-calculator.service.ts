import { Injectable } from '@nestjs/common';
import { ReservationFinancialStatus } from '@prisma/client';
import { SettlementCalculation } from './types/settlement.types';

@Injectable()
export class SettlementCalculatorService {
  private readonly DEFAULT_RATE = 50;

  // Política de overtime — configurable, nunca hardcodeada dentro del cálculo.
  private readonly GRACE_PERIOD_MINUTES = 0;
  private readonly OVERTIME_BLOCK_MINUTES = 30;
  private readonly OVERTIME_BLOCK_PERCENT = 0.5; // % de ratePerHour por bloque

  /**
   * Cargo por overtime, en bloques de OVERTIME_BLOCK_MINUTES.
   * Sin período de gracia: apenas termina la reserva, el primer minuto
   * ya cuenta para el primer bloque (redondeado hacia arriba).
   * Cada bloque cobra OVERTIME_BLOCK_PERCENT del ratePerHour.
   */
  private calculateOvertimeCharge(overtimeMinutes: number, ratePerHour: number) {
  const blocks = Math.ceil(overtimeMinutes / this.OVERTIME_BLOCK_MINUTES); // 30 min
  const overtimeBillableHours = blocks * this.OVERTIME_BLOCK_PERCENT;      // 0.5
  const overtimeCharges = overtimeBillableHours * ratePerHour;             // dinero
  return { overtimeCharges, overtimeBillableHours, blocks };
}

  calculate(
    reservation: any,
    payments: any[],
    actualEnd: Date | null = null,
    overrides?: { priceActual?: number; incidentCharges?: number },
  ): SettlementCalculation {
    const ratePerHour = Number(reservation.ratePerHour) || this.DEFAULT_RATE;
    const extrasTotal = Number(reservation.extrasTotal) || 0;

    const startTime = new Date(reservation.startTime);
    const endTime = reservation.endTime ? new Date(reservation.endTime) : null;
    const actualStart = reservation.actualStart ? new Date(reservation.actualStart) : startTime;
    const endReference = actualEnd
      ? new Date(actualEnd)
      : reservation.actualEnd
      ? new Date(reservation.actualEnd)
      : new Date();

    const estimatedDurationHours = endTime
      ? Math.max(1, Math.ceil((endTime.getTime() - startTime.getTime()) / 3600000))
      : 2;

    const actualDurationHours = Math.max(
      1,
      Math.ceil((endReference.getTime() - actualStart.getTime()) / 3600000),
    );

    // Minutos reales de retraso, medidos contra la hora de entrega pactada (endTime).
    const overtimeMinutes = endTime
      ? Math.max(0, (endReference.getTime() - endTime.getTime()) / 60000)
      : 0;

    const { overtimeCharges, overtimeBillableHours } = this.calculateOvertimeCharge(
      overtimeMinutes,
      ratePerHour,
    );

    // overtimeHours ahora refleja directamente lo facturable (0.5h, 1h, 1.5h, 2h...),
    // no un ceil crudo de minutos/60 — así el UI muestra el mismo número que se cobra.
    const overtimeHours = overtimeBillableHours;
    const isEarlyReturn = endTime ? endReference.getTime() < endTime.getTime() : false;
    const isLateReturn = overtimeMinutes > 0;

    // El tiempo contratado ya está pagado: el costo base es siempre lo reservado.
    const actualBaseCost = estimatedDurationHours * ratePerHour;
    const estimatedCost = actualBaseCost + extrasTotal;

    let incidentCharges = Number(overrides?.incidentCharges) || 0;
    let incidentCredits = 0;
    let damageCharges = 0;

    // No existe recargo por retraso separado del overtime; se mantiene en 0
    // solo por compatibilidad con el tipo SettlementCalculation.
    const latePenalty = 0;

    const isCompanyFault =
      reservation.incidentCategory === 'COMPANY' ||
      reservation.incidentCategoryEnum === 'COMPANY';
    if (isCompanyFault) {
      incidentCredits = actualBaseCost + extrasTotal + overtimeCharges + latePenalty;
    }

    const totalPaid = payments
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + (p.type === 'REFUND' ? -Number(p.amount) : Number(p.amount)), 0);

    const depositAmount = payments
      .filter((p) => p.status === 'PAID' && p.type === 'DEPOSIT')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const upfrontAmount = payments
      .filter((p) => p.status === 'PAID' && p.type === 'UPFRONT')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const grossTotal = actualBaseCost + extrasTotal + overtimeCharges + incidentCharges + latePenalty;
    const creditsApplied = incidentCredits;
    const netTotal = Math.max(0, grossTotal - creditsApplied);
    const balance = Number((netTotal - totalPaid).toFixed(2));

    let recommendedFinancialStatus: ReservationFinancialStatus = 'PENDING';
    let recommendedAction: 'COLLECT' | 'REFUND' | 'SETTLED' = 'SETTLED';

    if (balance > 0) {
      recommendedFinancialStatus = totalPaid > 0 ? 'PARTIALLY_PAID' : 'PENDING';
      recommendedAction = 'COLLECT';
    } else if (balance < 0) {
      recommendedFinancialStatus = 'PAID';
      recommendedAction = 'REFUND';
    } else {
      recommendedFinancialStatus = 'PAID';
      recommendedAction = 'SETTLED';
    }

    return {
      estimatedDurationHours,
      actualDurationHours,
      overtimeHours,
      isEarlyReturn,
      isLateReturn,
      ratePerHour,
      estimatedCost,
      actualBaseCost,
      extrasTotal,
      overtimeCharges,
      incidentCharges,
      incidentCredits,
      damageCharges,
      latePenalty,
      totalPaid,
      depositAmount,
      upfrontAmount,
      grossTotal,
      creditsApplied,
      netTotal,
      balance,
      recommendedFinancialStatus,
      recommendedAction,
    };
  }
}