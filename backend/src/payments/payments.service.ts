import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreatePaymentDto, userId: string, userRole: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: data.reservationId },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (reservation.userId !== userId && userRole !== 'ADMIN') {
      throw new BadRequestException('Reservation does not belong to you');
    }

    // Usually payments are created when completing a reservation, but this allows creating manually if needed a retry.
    return this.prisma.payment.create({
      data: {
        reservationId: data.reservationId,
        userId: userId,
        amount: data.amount,
        status: 'PENDING',
        type: 'POST_RIDE',
      },
    });
  }

  async pay(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { reservation: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status === 'PAID')
      throw new BadRequestException('Payment already completed');

    // MOCK STRIPE FLOW: Just mark as PAID directly
    const transactionOps: any[] = [
      this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          stripePaymentIntentId: `mock_pi_${Date.now()}`,
        },
      }),
    ];

    // If payment is for a PENDING reservation, confirm it
    if (
      payment.reservation.status === 'PENDING' &&
      (payment.type === 'UPFRONT' || payment.type === 'DEPOSIT')
    ) {
      transactionOps.push(
        this.prisma.reservation.update({
          where: { id: payment.reservationId },
          data: { status: 'CONFIRMED' },
        }),
      );
    }

    const [updatedPayment] = await this.prisma.$transaction(transactionOps);

    return updatedPayment;
  }

  async findAll(userRole: string, userId: string) {
    const where = userRole === 'ADMIN' ? {} : { userId };
    return this.prisma.payment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            documentType: true,
            documentNumber: true,
          },
        },
        reservation: {
          include: { bike: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            documentType: true,
            documentNumber: true,
          },
        },
        reservation: {
          include: { bike: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Phase 3: Reserve PaymentIntent
   * Creates or reuses a Stripe PaymentIntent for upfront deposit payment
   */
  async reservePaymentIntent(
    userId: string,
    userRole: string,
    amount: number,
    reservationId: string,
  ) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (reservation.userId !== userId && userRole !== 'ADMIN') {
      throw new BadRequestException('Reservation does not belong to you');
    }

    // Check if PaymentIntent already exists for this reservation
    if (reservation.paymentIntentId) {
      return {
        paymentIntentId: reservation.paymentIntentId,
        clientSecret: `cs_secret_${reservation.paymentIntentId}`, // Mock client secret
        amount: amount,
      };
    }

    // Mock Stripe PaymentIntent creation
    const paymentIntentId = `pi_phase3_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Update reservation with PaymentIntent ID
    await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { paymentIntentId },
    });

    return {
      paymentIntentId,
      clientSecret: `cs_secret_${paymentIntentId}`,
      amount,
    };
  }

  /**
   * Phase 3: Settle Payment
   * Confirms charge post-ride and calculates final amount with refund
   */
  async settlePayment(
    reservationId: string,
    userId: string,
    userRole: string,
    finalAmount: number,
    depositAmount: number,
  ) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { payments: true },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (reservation.userId !== userId && userRole !== 'ADMIN') {
      throw new BadRequestException('Reservation does not belong to you');
    }

    // Calculate refund balance
    const balanceRefund = depositAmount > finalAmount ? depositAmount - finalAmount : 0;

    // Create or update settlement payment record
    const payment = await this.prisma.payment.create({
      data: {
        reservationId,
        userId,
        amount: finalAmount,
        currency: 'USD',
        type: 'POST_RIDE',
        status: 'PAID',
        depositAmount,
        settledAmount: finalAmount,
        balanceRefund,
        paidAt: new Date(),
        stripePaymentIntentId: reservation.paymentIntentId,
      },
    });

    // Update reservation financial status
    await this.prisma.reservation.update({
      where: { id: reservationId },
      data: {
        financialStatus: 'PAID',
        settledAt: new Date(),
      },
    });

    return {
      paymentId: payment.id,
      transactionId: reservation.paymentIntentId,
      settledAmount: finalAmount,
      balanceRefund,
      status: 'SETTLED',
    };
  }

  /**
   * Phase 3: Refund Payment
   * Issues refund for damage/incident reports
   */
  async refundPayment(
    paymentId: string,
    userId: string,
    userRole: string,
    reason: string,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.userId !== userId && userRole !== 'ADMIN') {
      throw new BadRequestException('Not authorized to refund this payment');
    }

    if (payment.status !== 'PAID') {
      throw new BadRequestException('Only paid payments can be refunded');
    }

    // Update payment status to REFUNDED
    const refundedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'REFUNDED',
        updatedAt: new Date(),
      },
    });

    // Mock Stripe refund
    const refundId = `rf_${Date.now()}`;

    return {
      refundId,
      paymentId: payment.id,
      refundedAmount: payment.amount,
      reason,
      status: 'REFUNDED',
      timestamp: new Date(),
    };
  }
}