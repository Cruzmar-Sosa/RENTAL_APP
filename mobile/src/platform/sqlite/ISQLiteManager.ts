export interface QueryResult<T = unknown> {
  rows: T[];
  rowsAffected: number;
  insertId?: number;
}

export interface ISQLiteManager {
  init(): Promise<void>;
  execute<T = unknown>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
  close(): Promise<void>;
}
