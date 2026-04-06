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
    return this.reservationsService.create(req.user.sub, createReservationDto.bikeId);
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

  @Patch(':id/complete')
  @Permissions('RESERVATIONS', 'UPDATE')
  complete(@Param('id') id: string) {
    return this.reservationsService.complete(id);
  }
}
