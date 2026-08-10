import { Coordinates } from '../value-objects/Coordinates';
import { BikeProps } from './Bike';

export interface StationProps {
  id: string;
  code: number;
  name: string;
  coordinates: Coordinates;
  address: string | null;
  capacity: number;
  bikes?: BikeProps[] | undefined;
}

export class Station {
  constructor(public readonly props: StationProps) {}

  public get id(): string {
    return this.props.id;
  }
  public get name(): string {
    return this.props.name;
  }
  public get coordinates(): Coordinates {
    return this.props.coordinates;
  }
  public get capacity(): number {
    return this.props.capacity;
  }

  public get availableBikes(): readonly BikeProps[] {
    if (!this.props.bikes) return [];
    return this.props.bikes.filter(
      (b) => b.operationalStatus === 'AVAILABLE' && b.technicalStatus === 'OK' && b.batteryLevel >= 20
    );
  }

  public get availableBikeCount(): number {
    return this.availableBikes.length;
  }

  public get availableDockCount(): number {
    return Math.max(0, this.props.capacity - (this.props.bikes?.length || 0));
  }

  public hasAvailableBikes(): boolean {
    return this.availableBikeCount > 0;
  }
}
