import { IOfflineQueue } from './IOfflineQueue';
import { BuiltTelemetryFrame } from './ITelemetryBuilder';
import { ISQLiteManager } from '@platform/sqlite';

export class TelemetryQueue implements IOfflineQueue<BuiltTelemetryFrame> {
  constructor(private readonly sqliteManager: ISQLiteManager) {}

  public async enqueue(item: BuiltTelemetryFrame): Promise<void> {
    await this.sqliteManager.execute(
      `INSERT OR REPLACE INTO telemetry_frames (id, rideId, bikeId, latitude, longitude, speed, heading, batteryLevel, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.rideId,
        item.bikeId,
        item.latitude,
        item.longitude,
        item.speed ?? null,
        item.heading ?? null,
        item.batteryLevel,
        item.timestamp,
      ]
    );
  }

  public async dequeue(limit: number): Promise<readonly BuiltTelemetryFrame[]> {
    const rows = await this.sqliteManager.query<{
      id: string;
      rideId: string;
      bikeId: string;
      latitude: number;
      longitude: number;
      speed: number | null;
      heading: number | null;
      batteryLevel: number;
      timestamp: string;
    }>(
      `SELECT id, rideId, bikeId, latitude, longitude, speed, heading, batteryLevel, timestamp
       FROM telemetry_frames
       ORDER BY timestamp ASC
       LIMIT ?`,
      [limit]
    );

    return rows.map((r) => ({
      id: r.id,
      rideId: r.rideId,
      bikeId: r.bikeId,
      latitude: r.latitude,
      longitude: r.longitude,
      speed: r.speed,
      heading: r.heading,
      batteryLevel: r.batteryLevel,
      timestamp: r.timestamp,
    }));
  }

  public async acknowledge(ids: readonly string[]): Promise<void> {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    await this.sqliteManager.execute(
      `DELETE FROM telemetry_frames WHERE id IN (${placeholders})`,
      [...ids]
    );
  }

  public async size(): Promise<number> {
    const rows = await this.sqliteManager.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM telemetry_frames`
    );
    return rows[0]?.count ?? 0;
  }

  public async clear(): Promise<void> {
    await this.sqliteManager.execute(`DELETE FROM telemetry_frames`);
  }
}
