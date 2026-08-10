export type OperationalStatus = 'AVAILABLE' | 'RESERVED' | 'CHECKED_IN' | 'IN_USE';
export type TechnicalStatus = 'OK' | 'MAINTENANCE' | 'OUT_OF_SERVICE';

export interface BikeProps {
  id: string;
  code: number;
  model: string | null;
  batteryLevel: number;
  operationalStatus: OperationalStatus;
  technicalStatus: TechnicalStatus;
  stationId: string | null;
  imageUrl: string | null;
  depositRequired: boolean;
}

export class Bike {
  constructor(public readonly props: BikeProps) {}

  public get id(): string {
    return this.props.id;
  }
  public get code(): number {
    return this.props.code;
  }
  public get batteryLevel(): number {
    return this.props.batteryLevel;
  }
  public get operationalStatus(): OperationalStatus {
    return this.props.operationalStatus;
  }
  public get technicalStatus(): TechnicalStatus {
    return this.props.technicalStatus;
  }

  public isAvailableForReservation(): boolean {
    return (
      this.props.technicalStatus === 'OK' &&
      this.props.operationalStatus === 'AVAILABLE' &&
      this.props.batteryLevel >= 20
    );
  }
}
