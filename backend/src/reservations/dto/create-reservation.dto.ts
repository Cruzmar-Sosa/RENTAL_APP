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

  // ── New fields ──

  @IsOptional()
  @IsNumber()
  ratePerHour?: number;

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsString()
  clientPhone?: string;

  /** Admin can create for another registered user */
  @IsOptional()
  @IsString()
  targetUserId?: string;

  /** Walk-in guest fields (no account required) */
  @IsOptional()
  @IsString()
  guestName?: string;

  @IsOptional()
  @IsString()
  guestDocument?: string;

  @IsOptional()
  @IsString()
  guestPhone?: string;

  /** Extras snapshot: [{name:"Helmet",price:10}] */
  @IsOptional()
  @IsArray()
  extras?: { name: string; price: number }[];

  @IsOptional()
  @IsNumber()
  extrasTotal?: number;
}

export class StartRideDto {
  @IsOptional()
  @IsString()
  bikeCondition?: string; // GOOD | REGULAR | DAMAGED

  @IsOptional()
  @IsString()
  bikeNotes?: string;

  @IsOptional()
  @IsBoolean()
  termsAccepted?: boolean;
}

export class CompleteRideDto {
  @IsOptional()
  @IsNumber()
  priceActual?: number;

  @IsOptional()
  @IsNumber()
  balance?: number;

  @IsOptional()
  @IsDateString()
  actualEnd?: string;

  @IsOptional()
  @IsString()
  incidentType?: string; // MECHANICAL | TECHNICAL | OTHER

  @IsOptional()
  @IsString()
  incidentCategory?: string; // COMPANY_FAULT | CUSTOMER_FAULT

  @IsOptional()
  @IsString()
  incidentNotes?: string;
}
