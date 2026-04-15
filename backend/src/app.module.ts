import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './core/database/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { StationsModule } from './stations/stations.module';
import { BikesModule } from './bikes/bikes.module';
import { ReservationsModule } from './reservations/reservations.module';
import { TrackingModule } from './tracking/tracking.module';
import { PaymentsModule } from './payments/payments.module';
import { RoutesModule } from './routes/routes.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, UsersModule, AuthModule, StationsModule, BikesModule, ReservationsModule, TrackingModule, PaymentsModule, RoutesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
