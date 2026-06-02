import { IsString } from 'class-validator';

export class GeneratePinDto {
  reservationId!: string; // Will be from :id in route
}

export class VerifyPinDto {
  @IsString()
  pinInput!: string;
}

export class PinResponseDto {
  pin?: string; // Only on generate, for immediate display
  maskedPin!: string; // ●●**
  expiresIn!: number; // in seconds
  isNew?: boolean;
}

export class VerifyPinResponseDto {
  success!: boolean;
  bikeId!: string;
  unlockedAt!: Date;
  sessionToken!: string;
}
