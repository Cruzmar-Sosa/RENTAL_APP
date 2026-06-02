import { Injectable } from '@nestjs/common';
//import { Decimal } from '@prisma/client';

export interface DepositCalculation {
  baseCharge: number;
  depositRequired: number;
  estimatedTotal: number;
  damageWaiverFee?: number;
}

@Injectable()
export class DepositCalculatorService {
  /**
   * Calculate deposit and charges based on bike type, duration, and damage risk
   */
  calculateDeposit(
    bikeModel: string,
    durationMinutes: number,
    damageRisk: 'low' | 'medium' | 'high' = 'low',
    ratePerHour: number = 50,
  ): DepositCalculation {
    // Base hourly charge
    const hours = durationMinutes / 60;
    const baseCharge = Math.ceil(hours * ratePerHour * 100) / 100;

    // Deposit calculation based on risk
    const depositMultiplier = {
      low: 0.25,      // 25% of base charge
      medium: 0.50,   // 50% of base charge
      high: 1.0,      // 100% of base charge (full charge as deposit)
    };

    const depositRequired = Math.ceil(
      baseCharge * depositMultiplier[damageRisk] * 100
    ) / 100;

    // Damage waiver fee (optional, 10% of deposit)
    const damageWaiverFee = Math.ceil(depositRequired * 0.1 * 100) / 100;

    return {
      baseCharge,
      depositRequired,
      estimatedTotal: baseCharge + damageWaiverFee,
      damageWaiverFee,
    };
  }

  /**
   * Calculate settlement after ride completion
   * Input: deposit amount, final ride charge, damage assessment
   * Output: amount to charge, refund owed
   */
  calculateSettlement(
    depositAmount: number,
    finalChargeAmount: number,
    damageAmount: number = 0,
  ): {
    totalCharge: number;
    refundDue: number;
    chargeDescription: string;
  } {
    const totalCharge = finalChargeAmount + damageAmount;
    const refundDue = Math.max(0, depositAmount - totalCharge);

    let chargeDescription = `Ride charge: $${finalChargeAmount.toFixed(2)}`;
    if (damageAmount > 0) {
      chargeDescription += ` + Damage fee: $${damageAmount.toFixed(2)}`;
    }
    if (refundDue > 0) {
      chargeDescription += ` - Refund: $${refundDue.toFixed(2)}`;
    }

    return {
      totalCharge,
      refundDue,
      chargeDescription,
    };
  }

  /**
   * Validate deposit amount meets minimum
   */
  validateDeposit(depositAmount: number, minimumDeposit: number): boolean {
    return depositAmount >= minimumDeposit;
  }
}
