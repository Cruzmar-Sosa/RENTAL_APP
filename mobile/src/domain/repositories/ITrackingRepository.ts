import { TelemetryFrame } from '../entities/TelemetryFrame';

export interface ITrackingRepository {
  sendTelemetryFrame(frame: TelemetryFrame): Promise<boolean>;
  flushOfflineTelemetryQueue(): Promise<number>;
}
