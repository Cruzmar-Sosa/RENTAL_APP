import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService
  ) {}

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

    return await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          reservationId: data.reservationId,
          userId: userId,
          amount: data.amount,
          status: 'PENDING',
          type: 'POST_RIDE',
        },
      });

      await this.audit.recordPaymentEvent({
        paymentId: payment.id,
        reservationId: payment.reservationId,
        eventType: 'PAYMENT_CREATED',
        amount: payment.amount,
        currency: payment.currency,
        // statusBefore: null,
        statusAfter: 'PENDING',
        tx,
      });

      return payment;
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

    return await this.prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          stripePaymentIntentId: `mock_pi_${Date.now()}`,
        },
      });

      await this.audit.recordPaymentEvent({
        paymentId: updatedPayment.id,
        reservationId: updatedPayment.reservationId,
        eventType: 'PAYMENT_PAID',
        amount: updatedPayment.amount,
        currency: updatedPayment.currency,
        statusBefore: 'PENDING',
        statusAfter: 'PAID',
        tx,
      });

      if (
        payment.reservation.status === 'PENDING' &&
        (payment.type === 'UPFRONT' || payment.type === 'DEPOSIT')
      ) {
        await tx.reservation.update({
          where: { id: payment.reservationId },
          data: { status: 'CONFIRMED' },
        });

        await this.audit.recordReservationEvent({
          reservationId: payment.reservationId,
          previousStatus: 'PENDING',
          nextStatus: 'CONFIRMED',
          previousFinancialStatus: payment.reservation.financialStatus,
          nextFinancialStatus: payment.reservation.financialStatus,
          eventType: 'RESERVATION_CONFIRMED_BY_PAYMENT',
          tx,
        });
      }

      return updatedPayment;
    });
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
          select: {
            id: true,
            code: true,
            bike: { select: { id: true, code: true, model: true, status: true, imageUrl: true } },
          },
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
          select: {
            id: true,
            code: true,
            bike: { select: { id: true, code: true, model: true, status: true, imageUrl: true } },
          },
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

}