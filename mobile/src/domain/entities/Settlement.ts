export interface SettlementCalculation {
  baseCost: number;
  durationHours: number;
  ratePerHour: number;
  overtimeCost: number;
  overtimeMinutes: number;
  incidentCharges: number;
  damageCharges: number;
  latePenalty: number;
  incidentCredits: number;
  creditsApplied: number;
  grossTotal: number;
  netTotal: number;
  totalPaid: number;
  balance: number;
}

export interface SettlementPreview {
  reservationId: string;
  userId: string;
  bikeId: string;
  startTime: string;
  endTime: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  status: string;
  clientName: string | null;
  calculation: SettlementCalculation;
}
