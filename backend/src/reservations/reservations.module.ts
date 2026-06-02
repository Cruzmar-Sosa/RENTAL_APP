import { Module } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationLifecycleService } from './reservation-lifecycle.service';
import { PinsService } from './pins.service';
import { NotificationsService } from './notifications.service';
import { CheckInLockService } from './check-in-lock.service';
import { ReservationsController } from './reservations.controller';
import { NotificationsController } from './notifications.controller';
import { TrackingModule } from '../tracking/tracking.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [TrackingModule, PrismaModule],
  providers: [
    ReservationsService,
    ReservationLifecycleService,
    PinsService,
    NotificationsService,
    CheckInLockService,
  ],
  controllers: [ReservationsController, NotificationsController],
  exports: [PinsService, NotificationsService, CheckInLockService],
})
export class ReservationsModule {}
