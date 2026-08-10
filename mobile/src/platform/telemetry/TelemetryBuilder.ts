import { ITelemetryBuilder, RawFrameInput, BuiltTelemetryFrame } from './ITelemetryBuilder';

export class TelemetryBuilder implements ITelemetryBuilder {
  public buildFrame(input: RawFrameInput): BuiltTelemetryFrame {
    return {
      ...input,
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
  }
}
