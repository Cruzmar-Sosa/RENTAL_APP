import { Nullable } from '@core/types';

export interface ICacheManager {
  get<T>(key: string): Promise<Nullable<T>>;
  set<T>(key: string, value: T, ttlMs?: number): Promise<void>;
  invalidate(key: string): Promise<void>;
  clear(): Promise<void>;
}
