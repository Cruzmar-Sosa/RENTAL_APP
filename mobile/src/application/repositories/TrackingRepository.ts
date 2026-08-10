import { ITrackingEngine, TrackingEngineState } from '@platform/tracking';

export class TrackingRepository {
  constructor(private readonly engine: ITrackingEngine) {}

  public async startTracking(rideId: string, bikeId: string): Promise<void> {
    await this.engine.start({ rideId, bikeId });
  }

  public async stopTracking(): Promise<void> {
    await this.engine.stop();
  }

  public async pauseTracking(): Promise<void> {
    await this.engine.pause();
  }

  public async resumeTracking(): Promise<void> {
    await this.engine.resume();
  }

  public getTrackingState(): TrackingEngineState {
    return this.engine.getState();
  }
}
