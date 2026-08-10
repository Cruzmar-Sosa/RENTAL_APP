import { IStationRepository } from '@domain/repositories/IStationRepository';
import { Station, StationProps } from '@domain/entities/Station';
import { Coordinates } from '@domain/value-objects/Coordinates';
import { IHttpClient } from '@platform/api';
import { APP_URLS } from '@core/config';
import { AppError, ErrorCode } from '@core/errors';

interface ApiStationResponse {
  id: string;
  code: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
  capacity: number;
  bikes?: {
    id: string;
    code: number;
    model: string | null;
    batteryLevel: number;
    operationalStatus: 'AVAILABLE' | 'RESERVED' | 'CHECKED_IN' | 'IN_USE';
    technicalStatus: 'OK' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
    stationId: string | null;
    imageUrl: string | null;
    depositRequired: boolean;
  }[];
}

export class StationRepository implements IStationRepository {
  constructor(private readonly httpClient: IHttpClient) {}

  private mapToDomain(raw: ApiStationResponse): Station {
    const coordinates = Coordinates.create(raw.latitude, raw.longitude);
    const props: StationProps = {
      id: raw.id,
      code: raw.code,
      name: raw.name,
      coordinates,
      address: raw.address,
      capacity: raw.capacity,
      ...(raw.bikes
        ? {
            bikes: raw.bikes.map((b) => ({
              id: b.id,
              code: b.code,
              model: b.model,
              batteryLevel: b.batteryLevel,
              operationalStatus: b.operationalStatus,
              technicalStatus: b.technicalStatus,
              stationId: b.stationId,
              imageUrl: b.imageUrl,
              depositRequired: b.depositRequired ?? true,
            })),
          }
        : {}),
    };
    return new Station(props);
  }

  public async getAllStations(): Promise<readonly Station[]> {
    const response = await this.httpClient.get<ApiStationResponse[] | { data: ApiStationResponse[] }>(
      APP_URLS.stations.list
    );
    const list = Array.isArray(response) ? response : response.data;
    return list.map((s) => this.mapToDomain(s));
  }

  public async getStationById(id: string): Promise<Station> {
    try {
      const response = await this.httpClient.get<ApiStationResponse | { data: ApiStationResponse }>(
        APP_URLS.stations.byId(id)
      );
      const data = 'data' in response && response.data ? response.data : (response as ApiStationResponse);
      return this.mapToDomain(data);
    } catch (err) {
      throw new AppError(`Station not found [id=${id}]`, ErrorCode.NOT_FOUND, 404, { originalError: err });
    }
  }
}
