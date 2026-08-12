import { ITransmissionManager } from './ITransmissionManager';
import { BuiltTelemetryFrame } from './ITelemetryBuilder';
import { ISocketClient } from '@platform/websocket';

export class TransmissionManager implements ITransmissionManager {
  constructor(private readonly socketClient: ISocketClient) {}

  public async transmitFrame(frame: BuiltTelemetryFrame): Promise<boolean> {
    if (!this.socketClient.isConnected()) {
      return false;
    }

    try {
      this.socketClient.emit('update_location', {
        bikeId: frame.bikeId,
        // Use canonical field names (backend accepts both lat/lng and latitude/longitude)
        latitude: frame.latitude,
        longitude: frame.longitude,
        lat: frame.latitude,
        lng: frame.longitude,
        speed: frame.speed ?? 0,
        heading: frame.heading ?? undefined,
        batteryLevel: frame.batteryLevel,
        frameId: frame.id,          // enables server-side deduplication
        rideId: frame.rideId,       // enables session attribution
        timestamp: frame.timestamp,
      });
      return true;
    } catch {
      return false;
    }
  }

  public async transmitBatch(frames: readonly BuiltTelemetryFrame[]): Promise<readonly string[]> {
    if (!this.socketClient.isConnected() || frames.length === 0) {
      return [];
    }

    const transmittedIds: string[] = [];
    for (const frame of frames) {
      const success = await this.transmitFrame(frame);
      if (success) {
        transmittedIds.push(frame.id);
      } else {
        break; // Stop batch transmission if connection fails mid-way
      }
    }
    return transmittedIds;
  }
}
