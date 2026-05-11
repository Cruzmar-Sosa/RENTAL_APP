import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BikesService } from './bikes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CreateBikeDto } from './dto/create-bike.dto';
import { UpdateBikeDto } from './dto/update-bike.dto';

@Controller('bikes')
export class BikesController {
  constructor(private readonly bikesService: BikesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('BIKES', 'CREATE')
  create(@Body() createBikeDto: CreateBikeDto) {
    return this.bikesService.create(createBikeDto as any);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('BIKES', 'READ')
  findAll() {
    return this.bikesService.findAll();
  }

  @Get('available')
  checkAvailability() {
    return this.bikesService.checkAvailability();
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('BIKES', 'UPDATE')
  update(@Param('id') id: string, @Body() updateBikeDto: UpdateBikeDto, @Request() req: any) {
    return this.bikesService.update(id, updateBikeDto as any, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('BIKES', 'DELETE')
  remove(@Param('id') id: string) {
    return this.bikesService.remove(id);
  }

  @Post(':id/image')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('BIKES', 'UPDATE')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.bikesService.uploadImage(id, file);
  }
}

