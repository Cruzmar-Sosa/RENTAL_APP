import * as SQLite from 'expo-sqlite';
import { ISQLiteManager, QueryResult } from './ISQLiteManager';
import { AppError, ErrorCode } from '@core/errors';

export class SQLiteManager implements ISQLiteManager {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;

  public async init(): Promise<void> {
    if (this.isInitialized && this.db) {
      return;
    }
    try {
      this.db = await SQLite.openDatabaseAsync('telemetry.db');
      await this.db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS telemetry_frames (
          id TEXT PRIMARY KEY,
          rideId TEXT NOT NULL,
          bikeId TEXT NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          speed REAL,
          heading REAL,
          batteryLevel REAL NOT NULL,
          timestamp TEXT NOT NULL
        );
      `);
      this.isInitialized = true;
    } catch (err) {
      throw new AppError(
        'Failed to initialize SQLite database',
        ErrorCode.SQLITE_ERROR,
        500,
        { originalError: err }
      );
    }
  }

  private async getDb(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db || !this.isInitialized) {
      await this.init();
    }
    if (!this.db) {
      throw new AppError('SQLite database not open', ErrorCode.SQLITE_ERROR, 500);
    }
    return this.db;
  }

  public async execute<T = unknown>(sql: string, params: unknown[] = []): Promise<QueryResult<T>> {
    const db = await this.getDb();
    try {
      const result = await db.runAsync(sql, params as SQLite.SQLiteBindParams);
      return {
        rows: [],
        rowsAffected: result.changes,
        insertId: result.lastInsertRowId,
      };
    } catch (err) {
      throw new AppError(
        `SQLite execution failed: ${sql}`,
        ErrorCode.SQLITE_ERROR,
        500,
        { originalError: err }
      );
    }
  }

  public async query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    const db = await this.getDb();
    try {
      const rows = await db.getAllAsync<T>(sql, params as SQLite.SQLiteBindParams);
      return rows;
    } catch (err) {
      throw new AppError(
        `SQLite query failed: ${sql}`,
        ErrorCode.SQLITE_ERROR,
        500,
        { originalError: err }
      );
    }
  }

  public async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.isInitialized = false;
    }
  }
}
