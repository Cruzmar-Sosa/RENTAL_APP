export interface ILockoutStorage {
  getAttempts(key: string): Promise<number>;
  incrementAttempts(key: string, ttlSeconds: number): Promise<number>;
  isLocked(key: string): Promise<boolean>;
  setLockout(key: string, lockoutSeconds: number): Promise<void>;
  reset(key: string): Promise<void>;
}
