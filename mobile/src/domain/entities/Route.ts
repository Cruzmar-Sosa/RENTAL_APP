export interface POIProps {
  id: string;
  name: string;
  description?: string | null | undefined;
  latitude: number;
  longitude: number;
  category?: string | null | undefined;
  audioGuideUrl?: string | null | undefined;
  gallery?: string[] | null | undefined;
  order: number;
}

export interface RouteProps {
  id: string;
  code: number;
  name: string;
  description?: string | null | undefined;
  difficulty: 'EASY' | 'MODERATE' | 'HARD' | 'EXPERT';
  distanceKm: number;
  durationMin: number;
  thumbnail?: string | null | undefined;
  visibility: boolean;
  pois?: POIProps[] | undefined;
}

export class RouteEntity {
  constructor(public readonly props: RouteProps) {}

  public get id(): string {
    return this.props.id;
  }

  public get name(): string {
    return this.props.name;
  }

  public get difficulty(): string {
    return this.props.difficulty;
  }

  public get distanceKm(): number {
    return this.props.distanceKm;
  }

  public get durationMin(): number {
    return this.props.durationMin;
  }

  public get pois(): POIProps[] {
    return this.props.pois || [];
  }
}
