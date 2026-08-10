import { ICacheManager } from './ICacheManager';
import { Nullable } from '@core/types';
import { NotImplementedError } from '@core/errors';

export class CacheManager implements ICacheManager {
  public async get<T>(_key: string): Promise<Nullable<T>> {
    return null;
  }

  public async set<T>(_key: string, _value: T, _ttlMs?: number): Promise<void> {
    throw new NotImplementedError('CacheManager.set');
  }

  public async invalidate(_key: string): Promise<void> {
    throw new NotImplementedError('CacheManager.invalidate');
  }

  public async clear(): Promise<void> {
    throw new NotImplementedError('CacheManager.clear');
  }
}
