import { ReservationStatus } from '../value-objects/ReservationStatus';
import { BikeProps } from './Bike';

export interface ReservationProps {
  id: string;
  code: number;
  userId: string;
  bikeId: string;
  status: ReservationStatus;
  financialStatus: string;
  priceEstimated: number | null;
  startTime: string;
  endTime: string | null;
  checkInAt: string | null;
  checkInPin: string | null;
  actualStart?: string | null | undefined;
  bike?: BikeProps | undefined;
}

export class Reservation {
  constructor(public readonly props: ReservationProps) {}

  public get id(): string {
    return this.props.id;
  }

  public get bikeId(): string {
    return this.props.bikeId;
  }

  public isActive(): boolean {
    return this.props.status.isActive();
  }
}
