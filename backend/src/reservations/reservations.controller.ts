import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ReservationsService } from './reservations.service';
import { PinsService } from './pins.service';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import {
  CreateReservationDto,
  StartRideDto,
  CompleteRideDto,
  ReportIncidentDto,
  SettleRideDto,
  CheckInDto,
} from './dto/create-reservation.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
    private readonly pinsService: PinsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Throttle({ reservations: { limit: 15, ttl: 60000 } })
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

  @Throttle({ reservations: { limit: 15, ttl: 60000 } })
  @Patch(':id/check-in')
  checkIn(@Request() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.reservationsService.checkIn(id, req.user, dto);
  }

  @Throttle({ reservations: { limit: 15, ttl: 60000 } })
  @Patch(':id/start')
  start(@Request() req: any, @Param('id') id: string) {
    return this.reservationsService.start(id, req.user);
  }

  @Throttle({ reservations: { limit: 15, ttl: 60000 } })
  @Patch(':id/complete')
  complete(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: CompleteRideDto,
  ) {
    return this.reservationsService.complete(id, req.user, dto);
  }

  @Throttle({ reservations: { limit: 10, ttl: 60000 } })
  @Patch(':id/settle')
  settle(@Request() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.reservationsService.settle(id, req.user, dto);
  }

  @Throttle({ reservations: { limit: 15, ttl: 60000 } })
  @Patch(':id/report-incident')
  reportIncident(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ReportIncidentDto,
  ) {
    return this.reservationsService.reportIncident(id, req.user, dto);
  }

  @Throttle({ reservations: { limit: 15, ttl: 60000 } })
  @Patch(':id/cancel')
  cancel(@Request() req: any, @Param('id') id: string) {
    return this.reservationsService.cancel(id, req.user);
  }

  // Phase 3: PIN Management Endpoints

  /**
   * Generate PIN for a reservation
   * POST /reservations/:id/generate-pin
   */
  @Throttle({ auth: { limit: 10, ttl: 60000 } })
  @Post(':id/generate-pin')
  @Permissions('RESERVATIONS', 'READ')
  async generatePin(@Request() req: any, @Param('id') id: string) {
    return this.pinsService.generatePin(id, req.user.sub);
  }

  /**
   * Get/Retrieve existing PIN (generates new if doesn't exist)
   * GET /reservations/:id/pin
   */
  @Throttle({ auth: { limit: 10, ttl: 60000 } })
  @Get(':id/pin')
  @Permissions('RESERVATIONS', 'READ')
  async getPin(@Request() req: any, @Param('id') id: string) {
    return this.pinsService.getPin(id, req.user.sub);
  }

  /**
   * Verify PIN for check-in
   * POST /reservations/:id/verify-pin
   * Body: { pinInput: string }
   */
  @Throttle({ auth: { limit: 10, ttl: 60000 } })
  @Post(':id/verify-pin')
  @Permissions('RESERVATIONS', 'UPDATE')
  async verifyPin(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { pinInput: string },
  ) {
    return this.pinsService.verifyPin(id, req.user.sub, body.pinInput);
  }
}
