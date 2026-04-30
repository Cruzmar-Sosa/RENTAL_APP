import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreatePaymentDto, userId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: data.reservationId }
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (reservation.userId !== userId) {
      throw new BadRequestException('Reservation does not belong to you');
    }

    // Usually payments are created when completing a reservation, but this allows creating manually if needed a retry.
    return this.prisma.payment.create({
      data: {
        reservationId: data.reservationId,
        userId: userId,
        amount: data.amount,
        status: 'PENDING',
        type: 'POST_RIDE'
      }
    });
  }

  async pay(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status === 'PAID') throw new BadRequestException('Payment already completed');

    // MOCK STRIPE FLOW: Just mark as PAID directly
    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        stripePaymentIntentId: `mock_pi_${Date.now()}`
      }
    });
  }

  async findAll() {
    return this.prisma.payment.findMany({
      include: {
        user: { select: { id: true, email: true, name: true } },
        reservation: { select: { id: true, status: true, priceActual: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      include: {
        reservation: { select: { id: true, status: true, priceActual: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
