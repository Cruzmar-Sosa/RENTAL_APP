export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type PaymentType = 'UPFRONT' | 'DEPOSIT' | 'POST_RIDE';

export interface PaymentProps {
  id: string;
  reservationId: string;
  userId: string;
  amount: number;
  currency?: string;
  status: PaymentStatus;
  type: PaymentType;
  stripePaymentIntentId?: string | null;
  createdAt: string;
  paidAt?: string | null;
  reservationCode?: number;
}

export class Payment {
  constructor(public readonly props: PaymentProps) {}

  get id(): string {
    return this.props.id;
  }

  get reservationId(): string {
    return this.props.reservationId;
  }

  get amount(): number {
    return this.props.amount;
  }

  get status(): PaymentStatus {
    return this.props.status;
  }

  get type(): PaymentType {
    return this.props.type;
  }

  get paidAt(): string | null | undefined {
    return this.props.paidAt;
  }

  isPaid(): boolean {
    return this.props.status === 'PAID';
  }

  isPending(): boolean {
    return this.props.status === 'PENDING';
  }
}
