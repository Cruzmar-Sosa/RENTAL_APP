import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Permissions('USERS', 'CREATE')
  create(@Body() data: any) {
    return this.usersService.createUser(data);
  }

  @Get()
  @Permissions('USERS', 'READ')
  findAll() {
    return this.usersService.findAll();
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.usersService.search(query || '');
  }

  @Get(':id')
  @Permissions('USERS', 'READ')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Permissions('USERS', 'UPDATE')
  update(@Param('id') id: string, @Body() data: any) {
    return this.usersService.update(id, data);
  }

  @Patch(':id/permissions')
  @Permissions('SETTINGS', 'UPDATE')
  updatePermissions(@Param('id') id: string, @Body() data: { permissions: any[] }) {
    return this.usersService.updatePermissions(id, data.permissions);
  }

  @Delete(':id')
  @Permissions('USERS', 'DELETE')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
