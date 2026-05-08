import { Module } from '@nestjs/common';
import { BikesService } from './bikes.service';
import { BikesController } from './bikes.controller';
import { BikeReconciliationService } from './bike-reconciliation.service';

@Module({
  providers: [BikesService, BikeReconciliationService],
  controllers: [BikesController]
})
export class BikesModule {}
