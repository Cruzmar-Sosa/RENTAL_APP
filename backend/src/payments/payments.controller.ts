import { Controller, Post, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
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
    return this.paymentsService.create(createPaymentDto, req.user.sub);
  }

  @Patch(':id/pay')
  @Permissions('PAYMENTS', 'UPDATE')
  pay(@Param('id') id: string) {
    return this.paymentsService.pay(id);
  }

  @Get()
  @Permissions('PAYMENTS', 'READ')
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get('my')
  findMyPayments(@Request() req: any) {
    return this.paymentsService.findAllByUser(req.user.sub);
  }
}
