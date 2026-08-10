export type TrackingEngineState = 'IDLE' | 'ACTIVE' | 'PAUSED' | 'STOPPED';

export interface ITrackingEngine {
  start(session: { rideId: string; bikeId: string }): Promise<void>;
  stop(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  getState(): TrackingEngineState;
}
