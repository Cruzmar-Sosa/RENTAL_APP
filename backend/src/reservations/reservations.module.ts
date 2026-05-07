import { Module } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationLifecycleService } from './reservation-lifecycle.service';
import { ReservationsController } from './reservations.controller';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
  imports: [TrackingModule],
  providers: [ReservationsService, ReservationLifecycleService],
  controllers: [ReservationsController]
})
export class ReservationsModule {}
