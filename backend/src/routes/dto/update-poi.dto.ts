import { IsString, IsOptional, IsNumber, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePoiDto {
  @IsOptional()
  @IsString()
  name?: string;

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

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-1)
  @Type(() => Number)
  order?: number;
}
