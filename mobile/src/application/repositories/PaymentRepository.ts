import { IPaymentRepository, CreatePaymentParams } from '@domain/repositories/IPaymentRepository';
import { Payment, PaymentProps, PaymentStatus, PaymentType } from '@domain/entities/Payment';
import { SettlementPreview } from '@domain/entities/Settlement';
import { IHttpClient } from '@platform/api';
import { APP_URLS } from '@core/config';

interface ApiPaymentResponse {
  id: string;
  reservationId: string;
  userId: string;
  amount: number | string;
  currency?: string;
  status: PaymentStatus;
  type: PaymentType;
  stripePaymentIntentId?: string | null;
  createdAt: string;
  paidAt?: string | null;
  reservation?: {
    id: string;
    code: number;
  };
}

interface ApiSettlementPreviewResponse {
  reservationId: string;
  userId: string;
  bikeId: string;
  startTime: string;
  endTime: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  status: string;
  clientName: string | null;
  calculation: {
    baseCost: number;
    durationHours: number;
    ratePerHour: number;
    overtimeCost: number;
    overtimeMinutes: number;
    incidentCharges: number;
    damageCharges: number;
    latePenalty: number;
    incidentCredits: number;
    creditsApplied: number;
    grossTotal: number;
    netTotal: number;
    totalPaid: number;
    balance: number;
  };
}

export class PaymentRepository implements IPaymentRepository {
  constructor(private readonly httpClient: IHttpClient) {}

  private mapToDomain(raw: ApiPaymentResponse): Payment {
    const props: PaymentProps = {
      id: raw.id,
      reservationId: raw.reservationId,
      userId: raw.userId,
      amount: Number(raw.amount),
      currency: raw.currency || 'USD',
      status: raw.status,
      type: raw.type,
      stripePaymentIntentId: raw.stripePaymentIntentId ?? null,
      createdAt: raw.createdAt,
      paidAt: raw.paidAt ?? null,
      ...(raw.reservation?.code ? { reservationCode: raw.reservation.code } : {}),
    };
    return new Payment(props);
  }

  public async getMyPayments(): Promise<readonly Payment[]> {
    const response = await this.httpClient.get<ApiPaymentResponse[] | { data: ApiPaymentResponse[] }>(
      APP_URLS.payments.my
    );
    const list = Array.isArray(response) ? response : response.data;
    return list.map((p) => this.mapToDomain(p));
  }

  public async createPayment(params: CreatePaymentParams): Promise<Payment> {
    const response = await this.httpClient.post<ApiPaymentResponse | { data: ApiPaymentResponse }>(
      APP_URLS.payments.create,
      {
        reservationId: params.reservationId,
        amount: params.amount,
      }
    );
    const data = 'data' in response && response.data ? response.data : (response as ApiPaymentResponse);
    return this.mapToDomain(data);
  }

  public async payPayment(paymentId: string): Promise<Payment> {
    const response = await this.httpClient.patch<ApiPaymentResponse | { data: ApiPaymentResponse }>(
      APP_URLS.payments.pay(paymentId)
    );
    const data = 'data' in response && response.data ? response.data : (response as ApiPaymentResponse);
    return this.mapToDomain(data);
  }

  public async getSettlementPreview(reservationId: string): Promise<SettlementPreview> {
    const response = await this.httpClient.get<ApiSettlementPreviewResponse | { data: ApiSettlementPreviewResponse }>(
      APP_URLS.reservations.settlementPreview(reservationId)
    );
    const data = 'data' in response && response.data ? response.data : (response as ApiSettlementPreviewResponse);
    return {
      reservationId: data.reservationId,
      userId: data.userId,
      bikeId: data.bikeId,
      startTime: data.startTime,
      endTime: data.endTime,
      actualStart: data.actualStart,
      actualEnd: data.actualEnd,
      status: data.status,
      clientName: data.clientName,
      calculation: {
        baseCost: Number(data.calculation.baseCost || 0),
        durationHours: Number(data.calculation.durationHours || 0),
        ratePerHour: Number(data.calculation.ratePerHour || 0),
        overtimeCost: Number(data.calculation.overtimeCost || 0),
        overtimeMinutes: Number(data.calculation.overtimeMinutes || 0),
        incidentCharges: Number(data.calculation.incidentCharges || 0),
        damageCharges: Number(data.calculation.damageCharges || 0),
        latePenalty: Number(data.calculation.latePenalty || 0),
        incidentCredits: Number(data.calculation.incidentCredits || 0),
        creditsApplied: Number(data.calculation.creditsApplied || 0),
        grossTotal: Number(data.calculation.grossTotal || 0),
        netTotal: Number(data.calculation.netTotal || 0),
        totalPaid: Number(data.calculation.totalPaid || 0),
        balance: Number(data.calculation.balance || 0),
      },
    };
  }
}
