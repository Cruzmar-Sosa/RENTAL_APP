import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ILockoutStorage } from '../interfaces/lockout-storage.interface';

interface AttemptRecord {
  attempts: number;
  expiresAt: number;
}

interface LockoutRecord {
  lockedUntil: number;
}

@Injectable()
export class InMemoryLockoutStorage implements ILockoutStorage, OnModuleDestroy {
  private attemptsMap = new Map<string, AttemptRecord>();
  private lockoutMap = new Map<string, LockoutRecord>();
  private cleanupTimer: NodeJS.Timeout;

  constructor() {
    // Periodically prune expired entries every 5 minutes
    this.cleanupTimer = setInterval(() => this.pruneExpired(), 5 * 60 * 1000);
  }

  onModuleDestroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }

  async getAttempts(key: string): Promise<number> {
    const record = this.attemptsMap.get(key);
    if (!record) return 0;
    if (Date.now() > record.expiresAt) {
      this.attemptsMap.delete(key);
      return 0;
    }
    return record.attempts;
  }

  async incrementAttempts(key: string, ttlSeconds: number): Promise<number> {
    const now = Date.now();
    const existing = this.attemptsMap.get(key);

    if (!existing || now > existing.expiresAt) {
      const newRecord: AttemptRecord = {
        attempts: 1,
        expiresAt: now + ttlSeconds * 1000,
      };
      this.attemptsMap.set(key, newRecord);
      return 1;
    } else {
      existing.attempts += 1;
      return existing.attempts;
    }
  }

  async isLocked(key: string): Promise<boolean> {
    const record = this.lockoutMap.get(key);
    if (!record) return false;
    if (Date.now() > record.lockedUntil) {
      this.lockoutMap.delete(key);
      return false;
    }
    return true;
  }

  async setLockout(key: string, lockoutSeconds: number): Promise<void> {
    this.lockoutMap.set(key, {
      lockedUntil: Date.now() + lockoutSeconds * 1000,
    });
  }

  async reset(key: string): Promise<void> {
    this.attemptsMap.delete(key);
    this.lockoutMap.delete(key);
  }

  private pruneExpired() {
    const now = Date.now();
    for (const [key, record] of this.attemptsMap.entries()) {
      if (now > record.expiresAt) {
        this.attemptsMap.delete(key);
      }
    }
    for (const [key, record] of this.lockoutMap.entries()) {
      if (now > record.lockedUntil) {
        this.lockoutMap.delete(key);
      }
    }
  }
}
