import { Coordinates } from '../value-objects/Coordinates';

export interface TelemetryFrameProps {
  id: string;
  rideId: string;
  bikeId: string;
  coordinates: Coordinates;
  speed: number | null;
  heading: number | null;
  batteryLevelPercent: number;
  timestamp: string;
}

export class TelemetryFrame {
  constructor(public readonly props: TelemetryFrameProps) {}
}
