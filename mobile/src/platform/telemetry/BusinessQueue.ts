import { IOfflineQueue } from './IOfflineQueue';
import { NotImplementedError } from '@core/errors';

export interface BusinessActionPayload {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export class BusinessQueue implements IOfflineQueue<BusinessActionPayload> {
  public async enqueue(_item: BusinessActionPayload): Promise<void> {
    throw new NotImplementedError('BusinessQueue.enqueue');
  }

  public async dequeue(_limit: number): Promise<readonly BusinessActionPayload[]> {
    throw new NotImplementedError('BusinessQueue.dequeue');
  }

  public async acknowledge(_ids: readonly string[]): Promise<void> {
    throw new NotImplementedError('BusinessQueue.acknowledge');
  }

  public async size(): Promise<number> {
    return 0;
  }

  public async clear(): Promise<void> {
    throw new NotImplementedError('BusinessQueue.clear');
  }
}
