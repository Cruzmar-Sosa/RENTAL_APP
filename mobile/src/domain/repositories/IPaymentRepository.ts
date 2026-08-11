import { Payment } from '../entities/Payment';
import { SettlementPreview } from '../entities/Settlement';

export interface CreatePaymentParams {
  reservationId: string;
  amount: number;
}

export interface IPaymentRepository {
  getMyPayments(): Promise<readonly Payment[]>;
  createPayment(params: CreatePaymentParams): Promise<Payment>;
  payPayment(paymentId: string): Promise<Payment>;
  getSettlementPreview(reservationId: string): Promise<SettlementPreview>;
}
