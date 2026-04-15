import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CreateLocationDto } from './dto/create-location.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post()
  @Permissions('TRACKING', 'CREATE')
  create(@Body() createLocationDto: CreateLocationDto) {
    return this.trackingService.create(createLocationDto);
  }

  @Get(':bikeId/latest')
  @Permissions('TRACKING', 'READ')
  getLatest(@Param('bikeId') bikeId: string) {
    return this.trackingService.getLatestByBike(bikeId);
  }
}
