import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BikeOperationalStatus } from '@prisma/client';

@Injectable()
export class BikeReconciliationService {
  private readonly logger = new Logger(BikeReconciliationService.name);

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleReconciliation() {
    this.logger.log('[Reconciliation] Starting Bike Operational Status Reconciliation...');

    try {
      // 1. Find all bikes that are NOT AVAILABLE
      const busyBikes = await this.prisma.bike.findMany({
        where: {
          operationalStatus: { in: ['RESERVED', 'CHECKED_IN', 'IN_USE'] }
        }
      });

      if (busyBikes.length === 0) {
        this.logger.log('[Reconciliation] No busy bikes found. Sync complete.');
        return;
      }

      for (const bike of busyBikes) {
        // 2. Check for any active reservation
        const activeReservation = await this.prisma.reservation.findFirst({
          where: {
            bikeId: bike.id,
            status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'ACTIVE'] }
          }
        });

        // 3. If no active reservation exists, the bike status is drifted
        if (!activeReservation) {
          this.logger.warn(`[Reconciliation] DRIFT DETECTED: Bike ${bike.code} is ${bike.operationalStatus} but has no active reservation. Resetting to AVAILABLE.`);

          await this.prisma.$transaction(async (tx) => {
            await tx.bike.update({
              where: { id: bike.id },
              data: { 
                operationalStatus: 'AVAILABLE',
                status: 'AVAILABLE' // Legacy field
              }
            });

            await this.audit.recordBikeEvent({
              bikeId: bike.id,
              previousOperationalStatus: bike.operationalStatus,
              nextOperationalStatus: 'AVAILABLE',
              previousTechnicalStatus: bike.technicalStatus,
              nextTechnicalStatus: bike.technicalStatus,
              eventType: 'AUTO_SYNC',
              source: 'SYNC_ENGINE',
              metadata: { reason: 'Reconciliation: No active reservation found for busy bike' },
              tx
            });
          });
        }
      }

      this.logger.log('[Reconciliation] Completed successfully.');
    } catch (error) {
      this.logger.error('[Reconciliation] Failed during execution', error);
    }
  }
}
