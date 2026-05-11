import { Module } from '@nestjs/common';
import { BikesService } from './bikes.service';
import { BikesController } from './bikes.controller';
import { BikeReconciliationService } from './bike-reconciliation.service';
import { BikeMediaService } from './bike-media.service';

@Module({
  providers: [BikesService, BikeReconciliationService, BikeMediaService],
  controllers: [BikesController],
  exports: [BikesService, BikeMediaService]
})
export class BikesModule {}
