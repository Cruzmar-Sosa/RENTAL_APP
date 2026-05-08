import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsNumber, IsArray, IsBoolean } from 'class-validator';
import { DocumentType } from '@prisma/client';

export class CreateReservationDto {
  @IsString()
  @IsNotEmpty()
  bikeId: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsEnum(DocumentType)
  documentType?: DocumentType;

  @IsOptional()
  @IsString()
  documentNumber?: string;

  @IsOptional()
  @IsString()
  paymentOption?: 'DEPOSIT' | 'FULL' | 'LATER';

  @IsOptional()
  @IsNumber()
  ratePerHour?: number;

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsString()
  clientPhone?: string;

  @IsOptional()
  @IsString()
  targetUserId?: string;

  @IsOptional()
  @IsString()
  guestName?: string;

  @IsOptional()
  @IsString()
  guestDocument?: string;

  @IsOptional()
  @IsString()
  guestPhone?: string;

  @IsOptional()
  @IsArray()
  extras?: { name: string; price: number }[];

  @IsOptional()
  @IsNumber()
  extrasTotal?: number;
}

export class CheckInDto {
  @IsOptional()
  @IsString()
  bikeCondition?: string;

  @IsOptional()
  @IsString()
  bikeNotes?: string;

  @IsOptional()
  @IsBoolean()
  termsAccepted?: boolean;
}

export class StartRideDto {
  @IsOptional()
  @IsDateString()
  actualStart?: string;
}

export class CompleteRideDto {
  @IsOptional()
  @IsDateString()
  actualEnd?: string;

  @IsOptional()
  @IsString()
  incidentType?: string;

  @IsOptional()
  @IsString()
  incidentCategory?: string;

  @IsOptional()
  @IsString()
  incidentNotes?: string;

  @IsOptional()
  @IsNumber()
  priceActual?: number;
}

export class SettleRideDto {
  @IsOptional()
  @IsString()
  settlementReference?: string;
}

export class ReportIncidentDto {
  @IsString()
  @IsNotEmpty()
  incidentType: string;

  @IsOptional()
  @IsString()
  incidentNotes?: string;
}
