import { IBikeRepository } from '@domain/repositories/IBikeRepository';
import { Bike, BikeProps } from '@domain/entities/Bike';
import { IHttpClient } from '@platform/api';
import { Nullable } from '@core/types';
import { APP_URLS } from '@core/config';

interface ApiBikeResponse {
  id: string;
  code: number;
  model: string | null;
  batteryLevel: number;
  operationalStatus: 'AVAILABLE' | 'RESERVED' | 'CHECKED_IN' | 'IN_USE';
  technicalStatus: 'OK' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
  stationId: string | null;
  imageUrl: string | null;
  depositRequired?: boolean;
}

export class BikeRepository implements IBikeRepository {
  constructor(private readonly httpClient: IHttpClient) {}

  private mapToDomain(raw: ApiBikeResponse): Bike {
    const props: BikeProps = {
      id: raw.id,
      code: raw.code,
      model: raw.model,
      batteryLevel: raw.batteryLevel,
      operationalStatus: raw.operationalStatus,
      technicalStatus: raw.technicalStatus,
      stationId: raw.stationId,
      imageUrl: raw.imageUrl,
      depositRequired: raw.depositRequired ?? true,
    };
    return new Bike(props);
  }

  public async getAvailableBikes(): Promise<readonly Bike[]> {
    const response = await this.httpClient.get<ApiBikeResponse[] | { data: ApiBikeResponse[] }>(
      APP_URLS.bikes.available
    );
    const list = Array.isArray(response) ? response : response.data;
    return list.map((b) => this.mapToDomain(b));
  }

  public async getBikeById(id: string): Promise<Nullable<Bike>> {
    try {
      const response = await this.httpClient.get<ApiBikeResponse | { data: ApiBikeResponse }>(
        APP_URLS.bikes.byId(id)
      );
      const data = 'data' in response && response.data ? response.data : (response as ApiBikeResponse);
      return this.mapToDomain(data);
    } catch {
      // Fallback to searching available bikes
      try {
        const bikes = await this.getAvailableBikes();
        return bikes.find((b) => b.id === id) || null;
      } catch {
        return null;
      }
    }
  }
}
