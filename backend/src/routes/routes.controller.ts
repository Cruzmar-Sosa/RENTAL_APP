import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { CreatePoiDto } from './dto/create-poi.dto';
import { UpdatePoiDto } from './dto/update-poi.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Post()
  @Permissions('ROUTES', 'CREATE')
  create(@Body() createRouteDto: CreateRouteDto) {
    return this.routesService.create(createRouteDto);
  }

  @Get()
  @Permissions('ROUTES', 'READ')
  findAll() {
    return this.routesService.findAll();
  }

  @Get(':id')
  @Permissions('ROUTES', 'READ')
  findOne(@Param('id') id: string) {
    return this.routesService.findOne(id);
  }

  @Put(':id')
  @Permissions('ROUTES', 'UPDATE')
  update(@Param('id') id: string, @Body() updateRouteDto: UpdateRouteDto) {
    return this.routesService.update(id, updateRouteDto);
  }

  @Delete(':id')
  @Permissions('ROUTES', 'DELETE')
  remove(@Param('id') id: string) {
    return this.routesService.remove(id);
  }

  // ─────────────────────────────────────────────
  // Directions and POI Endpoints
  // ─────────────────────────────────────────────

  @Post('directions')
  @Permissions('ROUTES', 'READ')
  getDirections(@Body() body: { coordinates: { lat: number; lng: number }[] }) {
    return this.routesService.getDirections(body.coordinates);
  }

  @Put(':id/pois/reorder')
  @Permissions('ROUTES', 'UPDATE')
  reorderPois(
    @Param('id') routeId: string,
    @Body() body: { orders: { id: string; order: number }[] },
  ) {
    return this.routesService.reorderPois(routeId, body.orders);
  }

  @Post(':id/pois')
  @Permissions('ROUTES', 'UPDATE')
  addPoi(@Param('id') routeId: string, @Body() createPoiDto: CreatePoiDto) {
    return this.routesService.addPoi(routeId, createPoiDto);
  }

  @Put(':id/pois/:poiId')
  @Permissions('ROUTES', 'UPDATE')
  updatePoi(
    @Param('id') routeId: string,
    @Param('poiId') poiId: string,
    @Body() updatePoiDto: UpdatePoiDto,
  ) {
    return this.routesService.updatePoi(poiId, updatePoiDto);
  }

  @Delete(':id/pois/:poiId')
  @Permissions('ROUTES', 'UPDATE')
  deletePoi(@Param('id') routeId: string, @Param('poiId') poiId: string) {
    return this.routesService.deletePoi(poiId);
  }
}
