import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CreateReservationDto } from './dto/create-reservation.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  create(@Request() req: any, @Body() createReservationDto: CreateReservationDto) {
    return this.reservationsService.create(req.user.sub, createReservationDto);
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

  @Patch(':id/start')
  @Permissions('RESERVATIONS', 'UPDATE')
  start(@Param('id') id: string) {
    return this.reservationsService.start(id);
  }

  @Patch(':id/complete')
  @Permissions('RESERVATIONS', 'UPDATE')
  complete(@Param('id') id: string) {
    return this.reservationsService.complete(id);
  }

  @Patch(':id/cancel')
  @Permissions('RESERVATIONS', 'UPDATE')
  cancel(@Param('id') id: string) {
    return this.reservationsService.cancel(id);
  }
}
