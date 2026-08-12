import { IRouteRepository } from '@domain/repositories/IRouteRepository';
import { RouteEntity, RouteProps } from '@domain/entities/Route';
import { IHttpClient } from '@platform/api';
import { APP_URLS } from '@core/config';

interface ApiRouteResponse {
  id: string;
  code: number;
  name: string;
  description?: string | null;
  difficulty: 'EASY' | 'MODERATE' | 'HARD' | 'EXPERT';
  distanceKm: number;
  durationMin: number;
  thumbnail?: string | null;
  visibility: boolean;
  pois?: Array<{
    id: string;
    name: string;
    description?: string | null;
    latitude: number;
    longitude: number;
    category?: string | null;
    audioGuideUrl?: string | null;
    gallery?: string[] | null;
    order: number;
  }>;
}

export class RouteRepository implements IRouteRepository {
  constructor(private readonly httpClient: IHttpClient) {}

  private mapToDomain(raw: ApiRouteResponse): RouteEntity {
    const props: RouteProps = {
      id: raw.id,
      code: raw.code,
      name: raw.name,
      description: raw.description ?? null,
      difficulty: raw.difficulty,
      distanceKm: Number(raw.distanceKm || 0),
      durationMin: Number(raw.durationMin || 0),
      thumbnail: raw.thumbnail ?? null,
      visibility: raw.visibility,
      pois: (raw.pois || []).map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description ?? null,
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
        category: p.category ?? null,
        audioGuideUrl: p.audioGuideUrl ?? null,
        gallery: p.gallery ?? null,
        order: Number(p.order || 0),
      })),
    };
    return new RouteEntity(props);
  }

  public async findAll(): Promise<RouteEntity[]> {
    const response = await this.httpClient.get<ApiRouteResponse[] | { data: ApiRouteResponse[] }>(
      APP_URLS.routes.list
    );
    const list = Array.isArray(response) ? response : response.data || [];
    return list.filter((r) => r.visibility !== false).map((r) => this.mapToDomain(r));
  }

  public async findById(id: string): Promise<RouteEntity> {
    const response = await this.httpClient.get<ApiRouteResponse | { data: ApiRouteResponse }>(
      APP_URLS.routes.byId(id)
    );
    const item = 'data' in response ? response.data : response;
    return this.mapToDomain(item);
  }
}
