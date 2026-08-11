import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { TrackingGateway } from './tracking.gateway';
import { TrackingService } from './tracking.service';
import { PrismaService } from '../prisma/prisma.service';

describe('Sprint 5.4 — Session Lock & Contention Spec', () => {
  let trackingGateway: TrackingGateway;
  let redisService: RedisService;

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
                if (where.id === 'bike_lock_target') return Promise.resolve({ id: 'bike_lock_target' });
                return Promise.resolve(null);
              }),
            },
            bikeLocation: {
              findUnique: jest.fn().mockResolvedValue(null),
              create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'loc_lock', ...data })),
            },
          },
        },
      ],
    }).compile();

    redisService = moduleRef.get<RedisService>(RedisService);
    trackingGateway = moduleRef.get<TrackingGateway>(TrackingGateway);
    await redisService.onModuleInit();
  });

  afterAll(async () => {
    await redisService.onModuleDestroy();
  });

  it('Session Contention: device A locks bike X; device B update is rejected with tracking_error', async () => {
    const socketDeviceA = { id: 'sock_device_a', emit: jest.fn() } as any;
    const socketDeviceB = { id: 'sock_device_b', emit: jest.fn() } as any;

    // Device A starts streaming for bike_lock_target
    const resA = await trackingGateway.handleUpdateLocation(socketDeviceA, {
      bikeId: 'bike_lock_target',
      lat: 12.13,
      lng: -86.25,
      speed: 10,
    });
    expect(resA).toEqual({ received: true });

    // Device B attempts streaming for the same bike_lock_target
    const resB = await trackingGateway.handleUpdateLocation(socketDeviceB, {
      bikeId: 'bike_lock_target',
      lat: 12.14,
      lng: -86.26,
      speed: 12,
    });
    expect(resB).toEqual({ error: 'Bike in use' });
    expect(socketDeviceB.emit).toHaveBeenCalledWith(
      'tracking_error',
      expect.objectContaining({ message: expect.stringContaining('Tracking ya activo') })
    );

    // Clean up session lock
    await trackingGateway.handleStopTracking(socketDeviceA, { bikeId: 'bike_lock_target' });
  });
});
