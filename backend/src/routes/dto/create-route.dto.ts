import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { RouteDifficulty } from '@prisma/client';

export class CreateRouteDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsBoolean()
  visibility?: boolean;

  @IsOptional()
  @IsEnum(RouteDifficulty)
  difficulty?: RouteDifficulty;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  distanceKm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  durationMin?: number;

  @IsOptional()
  @IsArray()
  visualPolyline?: Array<{ lat: number; lng: number }>;

  @IsOptional()
  @IsArray()
  navigationPolyline?: Array<{ lat: number; lng: number }>;
}
