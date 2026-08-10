export interface RawFrameInput {
  rideId: string;
  bikeId: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  batteryLevel: number;
}

export interface BuiltTelemetryFrame extends RawFrameInput {
  id: string;
  timestamp: string;
}

export interface ITelemetryBuilder {
  buildFrame(input: RawFrameInput): BuiltTelemetryFrame;
}
