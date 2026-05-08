import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, BikeOperationalStatus, BikeTechnicalStatus, BikeEventType, BikeEventSource } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class BikesService {
  private readonly logger = new Logger(BikesService.name);

  constructor(
    private prisma: PrismaService,
    private audit: AuditService
  ) {}

  async create(data: Prisma.BikeCreateInput) {
    return this.prisma.bike.create({ data });
  }

  async findAll() {
    return this.prisma.bike.findMany({
      include: { station: true },
      orderBy: [{ code: 'asc' }]
    });
  }

  async checkAvailability() {
    return this.prisma.bike.findMany({
      where: { 
        operationalStatus: 'AVAILABLE',
        technicalStatus: 'OK'
      },
      include: { station: true }
    });
  }

  async update(id: string, data: any, caller?: any, source: BikeEventSource = 'ADMIN', correlationId?: string) {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Fetch current state for audit and validation
      const bike = await tx.bike.findUnique({ where: { id } });
      if (!bike) throw new BadRequestException('Bike not found');

      // 2. Architectural Guard: operationalStatus is READONLY from this service
      if (data.operationalStatus) {
        throw new BadRequestException('Operational status must be managed via Reservation Lifecycle');
      }

      // 3. Technical Recovery Guard
      // If moving to OK, check if there are unresolved incidents or damage reported
      if (data.technicalStatus === 'OK' && bike.technicalStatus !== 'OK') {
        const unresolvedReservations = await tx.reservation.findFirst({
          where: {
            bikeId: id,
            OR: [
              { incidentType: { not: null }, status: { not: 'SETTLED' } },
              { bikeCondition: { in: ['REGULAR', 'DAMAGED'] }, status: { not: 'SETTLED' } }
            ]
          }
        });

        if (unresolvedReservations) {
          throw new BadRequestException(
            `Technical Recovery Denied: Bike ${bike.code} has unresolved incidents or reported damage in Reservation ${unresolvedReservations.id}.`
          );
        }
      }

      // 4. Handle Technical Status change and Auditing
      const nextTechnicalStatus = data.technicalStatus || bike.technicalStatus;
      const technicalChanged = nextTechnicalStatus !== bike.technicalStatus;

      // 5. Dual-Write for backward compatibility (Deprecated status field)
      // If technicalStatus is not OK, legacy status should be MAINTENANCE
      // If technicalStatus is OK, legacy status follows operationalStatus
      let legacyStatus = bike.status;
      if (nextTechnicalStatus !== 'OK') {
        legacyStatus = 'MAINTENANCE';
      } else {
        // Map operational to legacy
        const opToLegacy: Record<BikeOperationalStatus, any> = {
          AVAILABLE: 'AVAILABLE',
          RESERVED: 'RESERVED',
          CHECKED_IN: 'IN_USE',
          IN_USE: 'IN_USE'
        };
        legacyStatus = opToLegacy[bike.operationalStatus];
      }

      const updated = await tx.bike.update({
        where: { id },
        data: {
          ...data,
          status: legacyStatus // Maintain legacy field
        },
      });

      // 6. Record Audit Event
      if (technicalChanged || data.batteryLevel !== undefined || data.stationId !== undefined) {
        await this.audit.recordBikeEvent({
          bikeId: id,
          previousOperationalStatus: bike.operationalStatus,
          nextOperationalStatus: bike.operationalStatus,
          previousTechnicalStatus: bike.technicalStatus,
          nextTechnicalStatus: nextTechnicalStatus,
          eventType: technicalChanged ? 'TECHNICAL_STATUS_CHANGED' : 'AUTO_SYNC',
          source,
          correlationId,
          createdById: caller?.sub,
          tx
        });
      }

      return updated;
    });
  }

  async remove(id: string) {
    return this.prisma.bike.delete({ where: { id } });
  }
}
