import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { TrackingGateway } from './tracking.gateway';
import { TrackingService } from './tracking.service';
import { PrismaService } from '../prisma/prisma.service';

describe('Sprint 5.4 — Failure Recovery & Isolation Spec', () => {
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
                if (where.id === 'bike_fail_test') return Promise.resolve({ id: 'bike_fail_test' });
                return Promise.resolve(null);
              }),
            },
            bikeLocation: {
              findUnique: jest.fn().mockResolvedValue(null),
              create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'loc_fail', ...data })),
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

  it('Out-of-bounds Latitude/Longitude Rejection: emits tracking_error without crashing server', async () => {
    const socket = { id: 'sock_bounds_err', emit: jest.fn() } as any;
    const res = await trackingGateway.handleUpdateLocation(socket, {
      bikeId: 'bike_fail_test',
      lat: 105.0, // Invalid latitude > 90
      lng: -86.25,
      speed: 5,
    });

    expect(res).toEqual({ error: 'Coordinates out of bounds' });
    expect(socket.emit).toHaveBeenCalledWith(
      'tracking_error',
      expect.objectContaining({ message: expect.stringContaining('fuera de rango') })
    );
  });

  it('Unknown Bike ID Rejection: rejects telemetry updates for non-existent bikes', async () => {
    const socket = { id: 'sock_unknown_bike', emit: jest.fn() } as any;
    const res = await trackingGateway.handleUpdateLocation(socket, {
      bikeId: 'non_existent_uuid_9999',
      lat: 12.13,
      lng: -86.25,
      speed: 5,
    });

    expect(res).toEqual({ error: 'Bike not found' });
    expect(socket.emit).toHaveBeenCalledWith(
      'tracking_error',
      expect.objectContaining({ message: expect.stringContaining('no encontrada') })
    );
  });
});
