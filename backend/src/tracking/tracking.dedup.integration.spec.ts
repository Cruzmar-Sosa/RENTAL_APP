import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { TrackingService } from './tracking.service';
import { PrismaService } from '../prisma/prisma.service';

describe('Sprint 5.4 — Telemetry Deduplication Spec', () => {
  let redisService: RedisService;
  let trackingService: TrackingService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        TrackingService,
        {
          provide: PrismaService,
          useValue: {
            bike: {
              findUnique: jest.fn().mockResolvedValue({ id: 'bike_dedup_1' }),
            },
            bikeLocation: {
              findUnique: jest.fn().mockImplementation(({ where }) => {
                if (where.frameId === 'frame_dup_999') {
                  return Promise.resolve({ id: 'loc_existing', frameId: 'frame_dup_999' });
                }
                return Promise.resolve(null);
              }),
              create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'loc_new', ...data })),
            },
          },
        },
      ],
    }).compile();

    redisService = moduleRef.get<RedisService>(RedisService);
    trackingService = moduleRef.get<TrackingService>(TrackingService);
    await redisService.onModuleInit();
  });

  afterAll(async () => {
    await redisService.onModuleDestroy();
  });

  it('Redis Deduplication: suppresses duplicate frameId within 60s window', async () => {
    const frameId = `unique_frame_${Date.now()}`;

    const isDupFirst = await redisService.isDuplicateFrame(frameId);
    expect(isDupFirst).toBe(false);

    const isDupSecond = await redisService.isDuplicateFrame(frameId);
    expect(isDupSecond).toBe(true);
  });

  it('Database Unique Constraint Fallback: returns existing location record when frameId is already in DB', async () => {
    const result = await trackingService.create({
      frameId: 'frame_dup_999',
      bikeId: 'bike_dedup_1',
      latitude: 12.13,
      longitude: -86.25,
    });

    expect(result).toHaveProperty('id', 'loc_existing');
  });
});
