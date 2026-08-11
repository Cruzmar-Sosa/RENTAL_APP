import { Module } from '@nestjs/common';
import { TrackingGateway } from './tracking.gateway';
import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';
import { RedisService } from './redis.service';

@Module({
  providers: [TrackingGateway, TrackingService, RedisService],
  controllers: [TrackingController],
  exports: [TrackingGateway, TrackingService, RedisService],
})
export class TrackingModule {}
