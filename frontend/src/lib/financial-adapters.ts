import { Reservation, Payment } from '../types';
import { safeCurrency } from './financial';

/**
 * Financial Adapters
 * 
 * Normalizes backend data objects to ensure all financial fields are true numbers.
 */

export function normalizeReservation(res: any): Reservation {
  if (!res) return res;

  return {
    ...res,
    priceEstimated: res.priceEstimated !== undefined ? safeCurrency(res.priceEstimated) : undefined,
    priceActual: res.priceActual !== undefined ? safeCurrency(res.priceActual) : undefined,
    ratePerHour: res.ratePerHour !== undefined ? safeCurrency(res.ratePerHour) : undefined,
    extrasTotal: res.extrasTotal !== undefined ? safeCurrency(res.extrasTotal) : undefined,
    extras: res.extras?.map((e: any) => ({
      ...e,
      price: safeCurrency(e.price)
    })),
    payments: res.payments?.map(normalizePayment)
  };
}

export function normalizePayment(pay: any): Payment {
  if (!pay) return pay;

  return {
    ...pay,
    amount: safeCurrency(pay.amount)
  };
}

/**
 * Normalizes an array of reservations.
 */
export function normalizeReservations(reservations: any[] | undefined): Reservation[] {
  if (!reservations) return [];
  return reservations.map(normalizeReservation);
}

/**
 * Normalizes an array of payments.
 */
export function normalizePayments(payments: any[] | undefined): Payment[] {
  if (!payments) return [];
  return payments.map(normalizePayment);
}

export function normalizeSettlementPreview(preview: any): any {
  if (!preview) return preview;
  return {
    ...preview,
    calculation: preview.calculation ? {
      ...preview.calculation,
      ratePerHour: safeCurrency(preview.calculation.ratePerHour),
      estimatedCost: safeCurrency(preview.calculation.estimatedCost),
      actualBaseCost: safeCurrency(preview.calculation.actualBaseCost),
      extrasTotal: safeCurrency(preview.calculation.extrasTotal),
      overtimeCharges: safeCurrency(preview.calculation.overtimeCharges),
      incidentCharges: safeCurrency(preview.calculation.incidentCharges),
      incidentCredits: safeCurrency(preview.calculation.incidentCredits),
      damageCharges: safeCurrency(preview.calculation.damageCharges),
      latePenalty: safeCurrency(preview.calculation.latePenalty),
      totalPaid: safeCurrency(preview.calculation.totalPaid),
      depositAmount: safeCurrency(preview.calculation.depositAmount),
      upfrontAmount: safeCurrency(preview.calculation.upfrontAmount),
      grossTotal: safeCurrency(preview.calculation.grossTotal),
      creditsApplied: safeCurrency(preview.calculation.creditsApplied),
      netTotal: safeCurrency(preview.calculation.netTotal),
      balance: safeCurrency(preview.calculation.balance),
    } : undefined,
  };
}
