import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CreateReservationDto, StartRideDto, CompleteRideDto, ReportIncidentDto, SettleRideDto, CheckInDto } from './dto/create-reservation.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateReservationDto) {
    return this.reservationsService.create(req.user, dto);
  }

  @Get('my')
  findMyReservations(@Request() req: any) {
    return this.reservationsService.findAllByUserId(req.user.sub);
  }

  @Get()
  @Permissions('RESERVATIONS', 'READ')
  findAll(@Request() req: any) {
    return this.reservationsService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.reservationsService.findOne(id, req.user);
  }

  @Patch(':id/check-in')
  checkIn(@Request() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.reservationsService.checkIn(id, req.user, dto);
  }

  @Patch(':id/start')
  start(@Request() req: any, @Param('id') id: string) {
    return this.reservationsService.start(id, req.user);
  }

  @Patch(':id/complete')
  complete(@Request() req: any, @Param('id') id: string, @Body() dto: CompleteRideDto) {
    return this.reservationsService.complete(id, req.user, dto);
  }

  @Patch(':id/settle')
  settle(@Request() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.reservationsService.settle(id, req.user, dto);
  }

  @Patch(':id/report-incident')
  reportIncident(@Request() req: any, @Param('id') id: string, @Body() dto: ReportIncidentDto) {
    return this.reservationsService.reportIncident(id, req.user, dto);
  }

  @Patch(':id/cancel')
  cancel(@Request() req: any, @Param('id') id: string) {
    return this.reservationsService.cancel(id, req.user);
  }
}
