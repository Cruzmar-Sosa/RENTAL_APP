import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

export interface PresenceRecord {
  socketId: string;
  bikeId: string;
  status: 'connected' | 'disconnected';
  lastSeenAt: string;
  latitude?: number;
  longitude?: number;
}

export interface SessionRecord {
  rideId?: string;
  bikeId: string;
  socketId: string;
  startedAt: string;
  lastSeenAt: string;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redisClient: Redis | null = null;
  private isRedisConnected = false;

  // In-memory fallback stores when Redis is offline or not configured
  private inMemoryPresence = new Map<string, PresenceRecord>();
  private inMemorySessions = new Map<string, SessionRecord>();
  private inMemorySockets = new Map<string, string>();
  private inMemoryDedup = new Set<string>();

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      this.logger.log('ℹ️ REDIS_URL not configured. Operating in In-Memory Fallback mode.');
      return;
    }

    try {
      this.logger.log(`Connecting to Redis at ${redisUrl}...`);
      this.redisClient = new Redis(redisUrl, {
        connectTimeout: 5000,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn('⚠️ Redis max retry limit reached. Falling back to In-Memory mode.');
            return null; // Stop retrying
          }
          return Math.min(times * 200, 2000);
        },
      });

      this.redisClient.on('connect', () => {
        this.isRedisConnected = true;
        this.logger.log('✅ Real Redis instance connected successfully.');
      });

      this.redisClient.on('error', (err) => {
        this.isRedisConnected = false;
        this.logger.warn(`⚠️ Redis Connection Error: ${err.message}. Operating in Fallback mode.`);
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.logger.warn(`⚠️ Failed to initialize Redis client: ${msg}. Using Fallback mode.`);
      this.isRedisConnected = false;
    }
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit().catch(() => {});
      this.redisClient = null;
    }
    this.inMemoryPresence.clear();
    this.inMemorySessions.clear();
    this.inMemorySockets.clear();
    this.inMemoryDedup.clear();
  }

  public get isConnected(): boolean {
    return this.isRedisConnected;
  }

  /**
   * Updates bike presence state
   */
  async setPresence(bikeId: string, record: PresenceRecord): Promise<void> {
    if (this.isRedisConnected && this.redisClient) {
      try {
        const key = `tracking:presence:${bikeId}`;
        await this.redisClient.hset(key, {
          socketId: record.socketId,
          bikeId: record.bikeId,
          status: record.status,
          lastSeenAt: record.lastSeenAt,
          latitude: record.latitude ?? 0,
          longitude: record.longitude ?? 0,
        });
        await this.redisClient.expire(key, 15); // 15-second TTL
        return;
      } catch {
        // Fallback to in-memory
      }
    }

    this.inMemoryPresence.set(bikeId, record);
  }

  /**
   * Retrieves active bike presence
   */
  async getPresence(bikeId: string): Promise<PresenceRecord | null> {
    if (this.isRedisConnected && this.redisClient) {
      try {
        const key = `tracking:presence:${bikeId}`;
        const data = await this.redisClient.hgetall(key);
        if (data && data.socketId) {
          return {
            socketId: data.socketId,
            bikeId: data.bikeId,
            status: data.status as 'connected' | 'disconnected',
            lastSeenAt: data.lastSeenAt,
            latitude: Number(data.latitude || 0),
            longitude: Number(data.longitude || 0),
          };
        }
        return null;
      } catch {
        // Fallback to in-memory
      }
    }

    return this.inMemoryPresence.get(bikeId) || null;
  }

  /**
   * Acquires session lock for a bike
   */
  async setSession(bikeId: string, record: SessionRecord): Promise<void> {
    if (this.isRedisConnected && this.redisClient) {
      try {
        const sessionKey = `tracking:session:${bikeId}`;
        const socketKey = `tracking:socket:${record.socketId}`;
        await this.redisClient.hset(sessionKey, {
          rideId: record.rideId || '',
          bikeId: record.bikeId,
          socketId: record.socketId,
          startedAt: record.startedAt,
          lastSeenAt: record.lastSeenAt,
        });
        await this.redisClient.set(socketKey, bikeId, 'EX', 86400); // 24h TTL
        return;
      } catch {
        // Fallback to in-memory
      }
    }

    this.inMemorySessions.set(bikeId, record);
    this.inMemorySockets.set(record.socketId, bikeId);
  }

  async getSession(bikeId: string): Promise<SessionRecord | null> {
    if (this.isRedisConnected && this.redisClient) {
      try {
        const sessionKey = `tracking:session:${bikeId}`;
        const data = await this.redisClient.hgetall(sessionKey);
        if (data && data.socketId) {
          return {
            rideId: data.rideId || undefined,
            bikeId: data.bikeId,
            socketId: data.socketId,
            startedAt: data.startedAt,
            lastSeenAt: data.lastSeenAt,
          };
        }
        return null;
      } catch {
        // Fallback to in-memory
      }
    }

    return this.inMemorySessions.get(bikeId) || null;
  }

  async getBikeBySocket(socketId: string): Promise<string | null> {
    if (this.isRedisConnected && this.redisClient) {
      try {
        const socketKey = `tracking:socket:${socketId}`;
        const bikeId = await this.redisClient.get(socketKey);
        if (bikeId) return bikeId;
      } catch {
        // Fallback to in-memory
      }
    }

    return this.inMemorySockets.get(socketId) || null;
  }

  async clearSession(bikeId: string): Promise<void> {
    if (this.isRedisConnected && this.redisClient) {
      try {
        const sessionKey = `tracking:session:${bikeId}`;
        const presenceKey = `tracking:presence:${bikeId}`;
        const sessionData = await this.redisClient.hgetall(sessionKey);
        if (sessionData && sessionData.socketId) {
          await this.redisClient.del(`tracking:socket:${sessionData.socketId}`);
        }
        await this.redisClient.del(sessionKey);
        await this.redisClient.del(presenceKey);
      } catch {
        // Fallback cleanup
      }
    }

    const session = this.inMemorySessions.get(bikeId);
    if (session) {
      this.inMemorySockets.delete(session.socketId);
    }
    this.inMemorySessions.delete(bikeId);
    this.inMemoryPresence.delete(bikeId);
  }

  /**
   * Idempotency Check: Returns true if frameId was already processed
   */
  async isDuplicateFrame(frameId: string): Promise<boolean> {
    if (!frameId) return false;

    if (this.isRedisConnected && this.redisClient) {
      try {
        const key = `tracking:dedup:${frameId}`;
        // SET key 1 EX 60 NX -> returns 'OK' if newly set, null if key already existed
        const result = await this.redisClient.set(key, '1', 'EX', 60, 'NX');
        return result === null; // If null, key already existed (duplicate)
      } catch {
        // Fallback to in-memory
      }
    }

    if (this.inMemoryDedup.has(frameId)) {
      return true;
    }
    this.inMemoryDedup.add(frameId);
    if (this.inMemoryDedup.size > 10000) {
      const firstKey = this.inMemoryDedup.values().next().value;
      if (firstKey) this.inMemoryDedup.delete(firstKey);
    }
    return false;
  }
}
