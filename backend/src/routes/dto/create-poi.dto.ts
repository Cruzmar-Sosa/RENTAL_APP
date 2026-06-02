import { IsString, IsOptional, IsNumber, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePoiDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  gallery?: string[];

  @IsOptional()
  @IsString()
  audioGuideUrl?: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude!: number;

  @IsNumber()
  @Min(-1)
  @Type(() => Number)
  order!: number;
}
