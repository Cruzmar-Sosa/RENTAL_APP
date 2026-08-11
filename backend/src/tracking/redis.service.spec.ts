import { RedisService } from './redis.service';

describe('RedisService Runtime & Fallback Audit', () => {
  let service: RedisService;

  beforeEach(async () => {
    service = new RedisService();
    await service.onModuleInit();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it('should operate in Fallback In-Memory mode when REDIS_URL is omitted', async () => {
    expect(service.isConnected).toBe(false);
  });

  it('should store and retrieve presence in Fallback mode', async () => {
    await service.setPresence('bike_1', {
      socketId: 'sock_1',
      bikeId: 'bike_1',
      status: 'connected',
      lastSeenAt: new Date().toISOString(),
      latitude: 12.136,
      longitude: -86.251,
    });

    const presence = await service.getPresence('bike_1');
    expect(presence).not.toBeNull();
    expect(presence?.socketId).toBe('sock_1');
    expect(presence?.status).toBe('connected');
    expect(presence?.latitude).toBe(12.136);
  });

  it('should manage session locks and reverse socket lookup', async () => {
    await service.setSession('bike_1', {
      rideId: 'ride_100',
      bikeId: 'bike_1',
      socketId: 'sock_1',
      startedAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    });

    const session = await service.getSession('bike_1');
    expect(session).not.toBeNull();
    expect(session?.rideId).toBe('ride_100');

    const bikeId = await service.getBikeBySocket('sock_1');
    expect(bikeId).toBe('bike_1');
  });

  it('should detect duplicate frames via isDuplicateFrame', async () => {
    const frameId = 'frame_test_123';

    const isDup1 = await service.isDuplicateFrame(frameId);
    expect(isDup1).toBe(false);

    const isDup2 = await service.isDuplicateFrame(frameId);
    expect(isDup2).toBe(true);
  });

  it('should clean session locks safely on clearSession', async () => {
    await service.setSession('bike_1', {
      rideId: 'ride_100',
      bikeId: 'bike_1',
      socketId: 'sock_1',
      startedAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    });

    await service.clearSession('bike_1');

    const session = await service.getSession('bike_1');
    expect(session).toBeNull();

    const bikeId = await service.getBikeBySocket('sock_1');
    expect(bikeId).toBeNull();
  });
});
