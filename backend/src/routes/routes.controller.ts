import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CreateRouteDto } from './dto/create-route.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
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
}
