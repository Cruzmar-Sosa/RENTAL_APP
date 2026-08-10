import { BuiltTelemetryFrame } from './ITelemetryBuilder';

export interface ITransmissionManager {
  transmitFrame(frame: BuiltTelemetryFrame): Promise<boolean>;
  transmitBatch(frames: readonly BuiltTelemetryFrame[]): Promise<readonly string[]>;
}
