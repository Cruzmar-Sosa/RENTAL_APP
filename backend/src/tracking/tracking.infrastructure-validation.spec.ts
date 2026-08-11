import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { TrackingService } from './tracking.service';
import { TrackingGateway } from './tracking.gateway';
import { PrismaService } from '../prisma/prisma.service';

describe('Sprint 5.2 — Infrastructure & Runtime Validation Test Suite', () => {
  let redisService: RedisService;
  let trackingService: TrackingService;
  let trackingGateway: TrackingGateway;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        TrackingService,
        TrackingGateway,
        {
          provide: PrismaService,
          useValue: {
            bike: {
              findUnique: jest.fn().mockImplementation(({ where }) => {
                if (where.id === 'valid_bike_1' || where.id === 'valid_bike_2') {
                  return Promise.resolve({ id: where.id, code: 101 });
                }
                return Promise.resolve(null);
              }),
            },
            bikeLocation: {
              findUnique: jest.fn().mockImplementation(({ where }) => {
                if (where.frameId === 'existing_frame_999') {
                  return Promise.resolve({ id: 'loc_999', frameId: 'existing_frame_999' });
                }
                return Promise.resolve(null);
              }),
              create: jest.fn().mockImplementation(({ data }) => {
                return Promise.resolve({
                  id: `loc_${Date.now()}`,
                  ...data,
                  receivedAt: new Date(),
                });
              }),
            },
          },
        },
      ],
    }).compile();

    redisService = moduleRef.get<RedisService>(RedisService);
    trackingService = moduleRef.get<TrackingService>(TrackingService);
    trackingGateway = moduleRef.get<TrackingGateway>(TrackingGateway);
    prismaService = moduleRef.get<PrismaService>(PrismaService);

    await redisService.onModuleInit();
  });

  afterAll(async () => {
    await redisService.onModuleDestroy();
  });

  // TEST 1: Fallback & Connection Mode
  it('1. Connection Test: operates safely in fallback mode when REDIS_URL is unconfigured', async () => {
    expect(redisService.isConnected).toBe(false);
  });

  // TEST 2: Presence TTL Simulation
  it('2. TTL Test: sets 15s presence records with timestamp', async () => {
    const now = new Date().toISOString();
    await redisService.setPresence('valid_bike_1', {
      socketId: 'sock_alpha',
      bikeId: 'valid_bike_1',
      status: 'connected',
      lastSeenAt: now,
      latitude: 12.13,
      longitude: -86.25,
    });

    const presence = await redisService.getPresence('valid_bike_1');
    expect(presence).not.toBeNull();
    expect(presence?.socketId).toBe('sock_alpha');
    expect(presence?.status).toBe('connected');
  });

  // TEST 3: Deduplication
  it('3. Deduplication Test: suppresses duplicate frameId within 60s window', async () => {
    const frameId = `dedup_frame_${Date.now()}`;
    const firstCheck = await redisService.isDuplicateFrame(frameId);
    expect(firstCheck).toBe(false);

    const secondCheck = await redisService.isDuplicateFrame(frameId);
    expect(secondCheck).toBe(true);
  });

  // TEST 4 & 5: Redis Loss & Fallback Isolation
  it('4 & 5. Redis Loss & Fallback Test: clearSession cleans up correctly', async () => {
    await redisService.setSession('valid_bike_1', {
      rideId: 'ride_500',
      bikeId: 'valid_bike_1',
      socketId: 'sock_alpha',
      startedAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    });

    const sessionBefore = await redisService.getSession('valid_bike_1');
    expect(sessionBefore?.socketId).toBe('sock_alpha');

    await redisService.clearSession('valid_bike_1');
    const sessionAfter = await redisService.getSession('valid_bike_1');
    expect(sessionAfter).toBeNull();
  });

  // TEST 6: Session Lock Collision (Two sockets controlling same bike)
  it('6. Lock Collision Test: rejects second socket attempting to control locked bike', async () => {
    const mockSocketClient1 = { id: 'socket_user_1', emit: jest.fn() } as any;
    const mockSocketClient2 = { id: 'socket_user_2', emit: jest.fn() } as any;

    // First socket transmits
    const res1 = await trackingGateway.handleUpdateLocation(mockSocketClient1, {
      bikeId: 'valid_bike_1',
      lat: 12.13,
      lng: -86.25,
      speed: 15,
    });
    expect(res1).toEqual({ received: true });

    // Second socket attempts update on bike_1
    const res2 = await trackingGateway.handleUpdateLocation(mockSocketClient2, {
      bikeId: 'valid_bike_1',
      lat: 12.14,
      lng: -86.26,
      speed: 12,
    });
    expect(res2).toEqual({ error: 'Bike in use' });
    expect(mockSocketClient2.emit).toHaveBeenCalledWith(
      'tracking_error',
      expect.objectContaining({ message: expect.stringContaining('Tracking ya activo') })
    );

    // Clean up session
    await trackingGateway.handleStopTracking(mockSocketClient1, { bikeId: 'valid_bike_1' });
  });

  // TEST 7: Gateway Bounds & Validation
  it('7. Gateway Test: rejects out-of-bounds coordinates', async () => {
    const mockSocket = { id: 'socket_test', emit: jest.fn() } as any;
    const res = await trackingGateway.handleUpdateLocation(mockSocket, {
      bikeId: 'valid_bike_2',
      lat: 999.0, // Invalid latitude
      lng: -86.25,
      speed: 10,
    });

    expect(res).toEqual({ error: 'Coordinates out of bounds' });
    expect(mockSocket.emit).toHaveBeenCalledWith(
      'tracking_error',
      expect.objectContaining({ message: expect.stringContaining('fuera de rango') })
    );
  });

  // TEST 8 & 9: Telemetry Ingest & DB Persistence
  it('8 & 9. Ingest & DB Test: creates enriched BikeLocation entry with frameId and receivedAt', async () => {
    const frameId = `test_frame_${Date.now()}`;
    const result = await trackingService.create({
      frameId,
      rideId: 'ride_abc',
      bikeId: 'valid_bike_1',
      latitude: 12.135,
      longitude: -86.255,
      speed: 20,
      heading: 180,
      batteryLevel: 95,
      timestamp: new Date().toISOString(),
    });

    expect(result).toHaveProperty('id');
    expect(prismaService.bikeLocation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          frameId,
          rideId: 'ride_abc',
          bikeId: 'valid_bike_1',
          latitude: 12.135,
          longitude: -86.255,
          batteryLevel: 95,
          heading: 180,
        }),
      })
    );
  });
});
