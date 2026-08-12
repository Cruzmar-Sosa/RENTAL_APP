import { Module } from '@nestjs/common';
import { RoutesController } from './routes.controller';
import { RoutesService } from './routes.service';
import { RouteMediaService } from './route-media.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RoutesController],
  providers: [RoutesService, RouteMediaService],
  exports: [RoutesService, RouteMediaService],
})
export class RoutesModule {}
