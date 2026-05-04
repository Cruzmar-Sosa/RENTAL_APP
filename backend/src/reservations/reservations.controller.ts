import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CreateReservationDto, StartRideDto, CompleteRideDto } from './dto/create-reservation.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateReservationDto) {
    return this.reservationsService.create(req.user.sub, dto);
  }

  @Get('my')
  findMyReservations(@Request() req: any) {
    return this.reservationsService.findAllByUserId(req.user.sub);
  }

  @Get()
  @Permissions('RESERVATIONS', 'READ')
  findAll() {
    return this.reservationsService.findAll();
  }

  @Get(':id')
  @Permissions('RESERVATIONS', 'READ')
  findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }

  @Patch(':id/start')
  @Permissions('RESERVATIONS', 'UPDATE')
  start(@Param('id') id: string, @Body() dto: StartRideDto) {
    return this.reservationsService.start(id, dto);
  }

  @Patch(':id/complete')
  @Permissions('RESERVATIONS', 'UPDATE')
  complete(@Param('id') id: string, @Body() dto: CompleteRideDto) {
    return this.reservationsService.complete(id, dto);
  }

  @Patch(':id/cancel')
  @Permissions('RESERVATIONS', 'UPDATE')
  cancel(@Param('id') id: string) {
    return this.reservationsService.cancel(id);
  }
}
