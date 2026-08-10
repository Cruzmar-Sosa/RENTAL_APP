export interface ITrackingSession {
  readonly sessionId: string;
  readonly rideId: string;
  readonly bikeId: string;
  readonly startTime: Date;
  readonly activeDurationSeconds: number;
}
