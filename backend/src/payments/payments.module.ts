import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { DepositCalculatorService } from './deposit-calculator.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, DepositCalculatorService],
  exports: [DepositCalculatorService],
})
export class PaymentsModule {}
