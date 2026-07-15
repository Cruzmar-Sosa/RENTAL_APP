import { Injectable } from '@nestjs/common';
import { IncidentType, IncidentCategory } from '@prisma/client';
import { IncidentFinancialImpact } from './types/settlement.types';

@Injectable()
export class IncidentFinancialService {
  /**
   * Evaluates the financial impact of a reported incident.
   * Rules:
   * - COMPANY fault absorbs all rental costs (generates credits equal to base costs).
   * - CUSTOMER fault applies damage charges and potentially late penalties if return is late.
   * - THIRD_PARTY / UNKNOWN puts the settlement on hold.
   */
  getFinancialImpact(
    incidentType: IncidentType | null,
    incidentCategory: IncidentCategory | null,
    baseChargeAmount: number,
    isOvertime: boolean = false
  ): IncidentFinancialImpact {
    let incidentCharges = 0;
    let incidentCredits = 0;
    let damageCharges = 0;
    let latePenalty = 0;

    if (!incidentType || incidentType === 'NONE') {
      return { incidentCharges, incidentCredits, damageCharges, latePenalty };
    }

    // Determine responsibility rules
    if (incidentCategory === 'COMPANY') {
      // Full credit/refund for company fault
      incidentCredits = baseChargeAmount;
    } else if (incidentCategory === 'CUSTOMER') {
      // Standard damage penalty rates based on incident type
      switch (incidentType) {
        case 'DAMAGE':
          damageCharges = 150.00; // Flat damage fee
          incidentCharges = damageCharges;
          break;
        case 'ACCIDENT':
          damageCharges = 300.00; // High accident fee
          incidentCharges = damageCharges;
          if (isOvertime) {
            latePenalty = 50.00; // Extra penalty for late return due to accident
          }
          break;
        case 'THEFT':
          damageCharges = 500.00; // Full theft deductable/charge
          incidentCharges = damageCharges;
          break;
        case 'MECHANICAL':
          // Mechanical fault by customer implies negligent use
          damageCharges = 100.00;
          incidentCharges = damageCharges;
          break;
        default:
          damageCharges = 0;
          break;
      }
    } else if (incidentCategory === 'THIRD_PARTY' || incidentCategory === 'UNKNOWN') {
      // Put on hold: no automated charges until manual resolution
      incidentCharges = 0;
    }

    return {
      incidentCharges,
      incidentCredits,
      damageCharges,
      latePenalty,
    };
  }
}
