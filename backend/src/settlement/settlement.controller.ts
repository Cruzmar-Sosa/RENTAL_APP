import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
  Body,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { SettlementCalculatorService } from './settlement-calculator.service';
import { IncidentFinancialService } from './incident-financial.service';
import { SettlementOrchestratorService } from './settlement-orchestrator.service';
import { PrismaService } from '../prisma/prisma.service';
import { SettlementPreviewResponse } from './types/settlement.types';
import { IncidentType, IncidentCategory } from '@prisma/client';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reservations')
export class SettlementController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculator: SettlementCalculatorService,
    private readonly incidentService: IncidentFinancialService,
    private readonly orchestrator: SettlementOrchestratorService
  ) {}

  @Get(':id/settlement-preview')
  @Permissions('RESERVATIONS', 'READ')
  async getPreview(
    @Request() req: any,
    @Param('id') id: string
  ): Promise<SettlementPreviewResponse> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        payments: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (reservation.userId !== req.user.sub && req.user.role !== 'ADMIN') {
      throw new ForbiddenException(
        'You do not have permission to access this settlement preview'
      );
    }

    const incType: IncidentType = reservation.incidentTypeEnum || 'NONE';
    const incCat: IncidentCategory = reservation.incidentCategoryEnum || 'CUSTOMER';
    const ratePerHour = Number(reservation.ratePerHour) || 50;

    const actualEnd = reservation.actualEnd || new Date();
    const actualStart = reservation.actualStart || reservation.startTime;
    const durationHours = Math.max(1, Math.ceil((actualEnd.getTime() - actualStart.getTime()) / 3600000));
    const baseCost = durationHours * ratePerHour;
    const isOvertime = reservation.endTime ? actualEnd.getTime() > new Date(reservation.endTime).getTime() : false;

    const impact = this.incidentService.getFinancialImpact(
      incType,
      incCat,
      baseCost,
      isOvertime
    );

    const calculation = this.calculator.calculate(
      reservation,
      reservation.payments,
      reservation.actualEnd,
      {
        incidentCharges: impact.incidentCharges,
      }
    );

    calculation.damageCharges = impact.damageCharges;
    calculation.incidentCredits = impact.incidentCredits;
    calculation.latePenalty = impact.latePenalty;
    calculation.creditsApplied = impact.incidentCredits;
    
    calculation.netTotal = Math.max(0, calculation.grossTotal - calculation.creditsApplied);
    calculation.balance = Number((calculation.netTotal - calculation.totalPaid).toFixed(2));

    return {
      reservationId: reservation.id,
      userId: reservation.userId,
      bikeId: reservation.bikeId,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      actualStart: reservation.actualStart,
      actualEnd: reservation.actualEnd,
      status: reservation.status,
      clientName: reservation.user?.name || reservation.user?.email || null,
      calculation,
    };
  }

  @Post(':id/settle-v2')
  @Permissions('RESERVATIONS', 'UPDATE')
  async settle(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: { settlementReference?: string; idempotencyKey?: string }
  ) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can settle reservations');
    }
    return this.orchestrator.settleReservation(id, req.user, dto);
  }

  @Post(':id/complete-and-settle')
  @Permissions('RESERVATIONS', 'UPDATE')
  async completeAndSettle(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: { settlementReference?: string; idempotencyKey?: string }
  ) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can complete and settle rides');
    }
    return this.orchestrator.completeAndSettle(id, req.user, dto);
  }
}
