import { IReservationRepository, CreateReservationParams } from '@domain/repositories/IReservationRepository';
import { Reservation, ReservationProps } from '@domain/entities/Reservation';
import { ReservationStatus, ReservationStatusEnum } from '@domain/value-objects/ReservationStatus';
import { IHttpClient } from '@platform/api';
import { APP_URLS } from '@core/config';

interface ApiReservationResponse {
  id: string;
  code: number;
  userId: string;
  bikeId: string;
  status: ReservationStatusEnum;
  financialStatus: string;
  priceEstimated: number | string | null;
  startTime: string;
  endTime: string | null;
  checkInAt: string | null;
  checkInPin: string | null;
  actualStart?: string | null;
  bike?: {
    id: string;
    code: number;
    model: string | null;
    batteryLevel: number;
    operationalStatus: 'AVAILABLE' | 'RESERVED' | 'CHECKED_IN' | 'IN_USE';
    technicalStatus: 'OK' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
    stationId: string | null;
    imageUrl: string | null;
    depositRequired: boolean;
  };
}

export class ReservationRepository implements IReservationRepository {
  constructor(private readonly httpClient: IHttpClient) {}

  private mapToDomain(raw: ApiReservationResponse): Reservation {
    const props: ReservationProps = {
      id: raw.id,
      code: raw.code,
      userId: raw.userId,
      bikeId: raw.bikeId,
      status: new ReservationStatus(raw.status),
      financialStatus: raw.financialStatus,
      priceEstimated: raw.priceEstimated ? Number(raw.priceEstimated) : null,
      startTime: raw.startTime,
      endTime: raw.endTime,
      checkInAt: raw.checkInAt,
      checkInPin: raw.checkInPin,
      actualStart: raw.actualStart,
      ...(raw.bike
        ? {
            bike: {
              id: raw.bike.id,
              code: raw.bike.code,
              model: raw.bike.model,
              batteryLevel: raw.bike.batteryLevel,
              operationalStatus: raw.bike.operationalStatus,
              technicalStatus: raw.bike.technicalStatus,
              stationId: raw.bike.stationId,
              imageUrl: raw.bike.imageUrl,
              depositRequired: raw.bike.depositRequired ?? true,
            },
          }
        : {}),
    };
    return new Reservation(props);
  }

  public async createReservation(params: CreateReservationParams): Promise<Reservation> {
    const response = await this.httpClient.post<ApiReservationResponse | { data: ApiReservationResponse }>(
      APP_URLS.reservations.create,
      {
        bikeId: params.bikeId,
        paymentOption: params.paymentOption || 'DEPOSIT',
        startTime: params.startTime,
        endTime: params.endTime,
      }
    );
    const data = 'data' in response && response.data ? response.data : (response as ApiReservationResponse);
    return this.mapToDomain(data);
  }

  public async getMyReservations(): Promise<readonly Reservation[]> {
    const response = await this.httpClient.get<ApiReservationResponse[] | { data: ApiReservationResponse[] }>(
      APP_URLS.reservations.my
    );
    const list = Array.isArray(response) ? response : response.data;
    return list.map((r) => this.mapToDomain(r));
  }

  public async getReservationById(id: string): Promise<Reservation> {
    const response = await this.httpClient.get<ApiReservationResponse | { data: ApiReservationResponse }>(
      APP_URLS.reservations.byId(id)
    );
    const data = 'data' in response && response.data ? response.data : (response as ApiReservationResponse);
    return this.mapToDomain(data);
  }

  public async getPin(reservationId: string): Promise<{ pin: string }> {
    // Call POST /generate-pin — returns { pin, maskedPin, expiresIn }.
    // The plaintext PIN is returned only at generation time.
    // If already verified, the backend will throw (PIN already used).
    const response = await this.httpClient.post<
      { pin: string; maskedPin: string; expiresIn: number } | { data: { pin: string; maskedPin: string; expiresIn: number } }
    >(APP_URLS.reservations.generatePin(reservationId), {});

    const data = 'data' in response && response.data ? response.data : (response as { pin: string; maskedPin: string; expiresIn: number });
    return { pin: data.pin };
  }

  public async verifyPin(reservationId: string, pinInput: string): Promise<{ valid: boolean }> {
    const response = await this.httpClient.post<{ valid: boolean } | { data: { valid: boolean } }>(
      APP_URLS.reservations.verifyPin(reservationId),
      { pinInput }
    );
    return 'data' in response && response.data ? response.data : (response as { valid: boolean });
  }

  public async startRide(reservationId: string): Promise<Reservation> {
    const response = await this.httpClient.patch<ApiReservationResponse | { data: ApiReservationResponse }>(
      APP_URLS.reservations.start(reservationId)
    );
    const data = 'data' in response && response.data ? response.data : (response as ApiReservationResponse);
    return this.mapToDomain(data);
  }

  public async cancelReservation(reservationId: string): Promise<Reservation> {
    const response = await this.httpClient.patch<ApiReservationResponse | { data: ApiReservationResponse }>(
      APP_URLS.reservations.cancel(reservationId)
    );
    const data = 'data' in response && response.data ? response.data : (response as ApiReservationResponse);
    return this.mapToDomain(data);
  }

  public async completeRide(reservationId: string, stationId: string): Promise<Reservation> {
    const response = await this.httpClient.patch<ApiReservationResponse | { data: ApiReservationResponse }>(
      APP_URLS.reservations.complete(reservationId),
      { endStationId: stationId }
    );
    const data = 'data' in response && response.data ? response.data : (response as ApiReservationResponse);
    return this.mapToDomain(data);
  }
}
