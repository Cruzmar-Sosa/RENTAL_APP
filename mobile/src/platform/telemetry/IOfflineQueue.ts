export interface IOfflineQueue<T> {
  enqueue(item: T): Promise<void>;
  dequeue(limit: number): Promise<readonly T[]>;
  acknowledge(ids: readonly string[]): Promise<void>;
  size(): Promise<number>;
  clear(): Promise<void>;
}
