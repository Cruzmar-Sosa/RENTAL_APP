import { ReservationFinancialStatus, IncidentType, IncidentCategory } from '@prisma/client';

export interface SettlementCalculation {
  // Time
  estimatedDurationHours: number;
  actualDurationHours: number;
  overtimeHours: number;
  isEarlyReturn: boolean;
  isLateReturn: boolean;

  // Pricing
  ratePerHour: number;
  estimatedCost: number;
  actualBaseCost: number;
  extrasTotal: number;
  overtimeCharges: number;
  
  // Incidents
  incidentCharges: number;
  incidentCredits: number;  // Company-fault credits/refunds
  damageCharges: number;
  
  // Penalties
  latePenalty: number;
  
  // Payment history
  totalPaid: number;
  depositAmount: number;
  upfrontAmount: number;
  
  // Final
  grossTotal: number;     // actualBaseCost + extrasTotal + overtimeCharges + incidentCharges + latePenalty
  creditsApplied: number; // company-fault credits
  netTotal: number;       // grossTotal - creditsApplied
  balance: number;        // netTotal - totalPaid (positive = client owes, negative = refund to client)
  
  // Status & Recommendations
  recommendedFinancialStatus: ReservationFinancialStatus;
  recommendedAction: 'COLLECT' | 'REFUND' | 'SETTLED';
}

export interface SettlementPreviewResponse {
  reservationId: string;
  userId: string;
  bikeId: string;
  startTime: Date;
  endTime: Date | null;
  actualStart: Date | null;
  actualEnd: Date | null;
  status: string;
  clientName: string | null;
  calculation: SettlementCalculation;
}

export interface IncidentFinancialImpact {
  incidentCharges: number;
  incidentCredits: number;
  damageCharges: number;
  latePenalty: number;
}
