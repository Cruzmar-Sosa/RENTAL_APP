import { Module } from '@nestjs/common';
import { SettlementCalculatorService } from './settlement-calculator.service';
import { IncidentFinancialService } from './incident-financial.service';
import { SettlementOrchestratorService } from './settlement-orchestrator.service';
import { SettlementController } from './settlement.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
  imports: [PrismaModule, AuditModule, TrackingModule],
  providers: [
    SettlementCalculatorService,
    IncidentFinancialService,
    SettlementOrchestratorService,
  ],
  controllers: [SettlementController],
  exports: [
    SettlementCalculatorService,
    IncidentFinancialService,
    SettlementOrchestratorService,
  ],
})
export class SettlementModule {}
