import * as SecureStore from 'expo-secure-store';
import { ISecureStorage } from './ISecureStorage';
import { Nullable } from '@core/types';
import { AppError, ErrorCode } from '@core/errors';
import { STORAGE_KEYS } from '@core/constants';

export class SecureStorageService implements ISecureStorage {
  public async getItem(key: string): Promise<Nullable<string>> {
    try {
      const value = await SecureStore.getItemAsync(key);
      return value;
    } catch (error) {
      throw new AppError(
        `Failed to retrieve item from SecureStore [key=${key}]`,
        ErrorCode.SECURE_STORAGE_ERROR,
        undefined,
        { originalError: error }
      );
    }
  }

  public async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      throw new AppError(
        `Failed to store item in SecureStore [key=${key}]`,
        ErrorCode.SECURE_STORAGE_ERROR,
        undefined,
        { originalError: error }
      );
    }
  }

  public async deleteItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      throw new AppError(
        `Failed to delete item from SecureStore [key=${key}]`,
        ErrorCode.SECURE_STORAGE_ERROR,
        undefined,
        { originalError: error }
      );
    }
  }

  public async clearAll(): Promise<void> {
    try {
      const keysToClear = Object.values(STORAGE_KEYS.SECURE);
      await Promise.all(
        keysToClear.map((key) => SecureStore.deleteItemAsync(key).catch(() => {}))
      );
    } catch (error) {
      throw new AppError(
        'Failed to clear SecureStore',
        ErrorCode.SECURE_STORAGE_ERROR,
        undefined,
        { originalError: error }
      );
    }
  }
}
