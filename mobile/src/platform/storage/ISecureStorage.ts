import { Nullable } from '@core/types';

export interface ISecureStorage {
  getItem(key: string): Promise<Nullable<string>>;
  setItem(key: string, value: string): Promise<void>;
  deleteItem(key: string): Promise<void>;
  clearAll(): Promise<void>;
}
