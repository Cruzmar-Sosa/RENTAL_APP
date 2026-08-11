import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';

describe('Sprint 5.4 — Redis Integration & Key Strategy Spec', () => {
  let redisService: RedisService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [RedisService],
    }).compile();

    redisService = moduleRef.get<RedisService>(RedisService);
    await redisService.onModuleInit();
  });

  afterAll(async () => {
    await redisService.onModuleDestroy();
  });

  it('Presence Key: stores presence record with 15s TTL convention', async () => {
    const now = new Date().toISOString();
    await redisService.setPresence('bike_redis_1', {
      socketId: 'sock_r1',
      bikeId: 'bike_redis_1',
      status: 'connected',
      lastSeenAt: now,
      latitude: 12.13,
      longitude: -86.25,
    });

    const record = await redisService.getPresence('bike_redis_1');
    expect(record).not.toBeNull();
    expect(record?.bikeId).toBe('bike_redis_1');
    expect(record?.status).toBe('connected');
    expect(record?.socketId).toBe('sock_r1');
  });

  it('Session Key: acquires 24h session lock and reverse socket mapping', async () => {
    const now = new Date().toISOString();
    await redisService.setSession('bike_redis_1', {
      rideId: 'ride_r100',
      bikeId: 'bike_redis_1',
      socketId: 'sock_r1',
      startedAt: now,
      lastSeenAt: now,
    });

    const session = await redisService.getSession('bike_redis_1');
    expect(session).not.toBeNull();
    expect(session?.rideId).toBe('ride_r100');

    const mappedBike = await redisService.getBikeBySocket('sock_r1');
    expect(mappedBike).toBe('bike_redis_1');
  });

  it('Session Cleanup: removes presence and socket mappings on clearSession', async () => {
    await redisService.clearSession('bike_redis_1');

    const presence = await redisService.getPresence('bike_redis_1');
    const session = await redisService.getSession('bike_redis_1');
    const socketMap = await redisService.getBikeBySocket('sock_r1');

    expect(presence).toBeNull();
    expect(session).toBeNull();
    expect(socketMap).toBeNull();
  });
});
