import { TelemetryFrame } from '@domain/entities/TelemetryFrame';

export interface ITelemetryService {
  recordFrame(frame: TelemetryFrame): Promise<void>;
  flushQueue(): Promise<number>;
  getPendingCount(): Promise<number>;
}
