import { IsString, IsNumber, IsOptional } from 'class-validator';

export class ReservePaymentIntentDto {
  @IsString()
  reservationId!: string;

  @IsNumber()
  amount!: number;
}

export class SettlePaymentDto {
  @IsNumber()
  finalAmount!: number;

  @IsNumber()
  depositAmount!: number;
}

export class RefundPaymentDto {
  @IsString()
  reason!: string;
}

export class PaymentResponseDto {
  id!: string;
  reservationId!: string;
  userId!: string;
  amount!: number;
  currency!: string;
  type!: string;
  status!: string;
  stripePaymentIntentId?: string;
  depositAmount?: number;
  settledAmount?: number;
  balanceRefund?: number;
  paidAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;
}
