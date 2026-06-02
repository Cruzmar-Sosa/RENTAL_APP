import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Permissions('PAYMENTS', 'CREATE')
  create(@Request() req: any, @Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto, req.user.sub, req.user.role);
  }

  @Patch(':id/pay')
  @Permissions('PAYMENTS', 'UPDATE')
  pay(@Param('id') id: string) {
    return this.paymentsService.pay(id);
  }

  @Get()
  @Permissions('PAYMENTS', 'READ')
  findAll(@Request() req: any) {
    return this.paymentsService.findAll(req.user.role, req.user.sub);
  }

  @Get('my')
  findMyPayments(@Request() req: any) {
    return this.paymentsService.findAllByUser(req.user.sub);
  }

  /**
   * Phase 3: Reserve PaymentIntent
   * POST /payments/reserve-intent
   * Body: { reservationId, amount }
   */
  @Post('reserve-intent')
  @Permissions('PAYMENTS', 'CREATE')
  async reservePaymentIntent(
    @Request() req: any,
    @Body() body: { reservationId: string; amount: number },
  ) {
    return this.paymentsService.reservePaymentIntent(
      req.user.sub,
      req.user.role,
      body.amount,
      body.reservationId,
    );
  }

  /**
   * Phase 3: Settle Payment
   * POST /payments/settle/:reservationId
   * Body: { finalAmount, depositAmount }
   */
  @Post('settle/:reservationId')
  @Permissions('PAYMENTS', 'UPDATE')
  async settlePayment(
    @Request() req: any,
    @Param('reservationId') reservationId: string,
    @Body() body: { finalAmount: number; depositAmount: number },
  ) {
    return this.paymentsService.settlePayment(
      reservationId,
      req.user.sub,
      req.user.role,
      body.finalAmount,
      body.depositAmount,
    );
  }

  /**
   * Phase 3: Refund Payment
   * POST /payments/refund/:paymentId
   * Body: { reason }
   */
  @Post('refund/:paymentId')
  @Permissions('PAYMENTS', 'DELETE')
  async refundPayment(
    @Request() req: any,
    @Param('paymentId') paymentId: string,
    @Body() body: { reason: string },
  ) {
    return this.paymentsService.refundPayment(
      paymentId,
      req.user.sub,
      req.user.role,
      body.reason,
    );
  }
}
