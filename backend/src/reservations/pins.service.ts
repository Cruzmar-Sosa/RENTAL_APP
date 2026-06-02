import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PinsService {
  private readonly PIN_LENGTH = 4;
  private readonly PIN_COST = 10; // bcrypt cost factor
  private readonly PIN_EXPIRY_MINUTES = 30;
  private readonly MAX_VERIFY_ATTEMPTS = 3;

  constructor(private prisma: PrismaService) {}

  /**
   * Generate a random PIN
   */
  private generateRandomPin(length: number = this.PIN_LENGTH): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  /**
   * Hash PIN with bcrypt
   */
  private async hashPin(pin: string): Promise<string> {
    return bcrypt.hash(pin, this.PIN_COST);
  }

  /**
   * Verify PIN against hash (private bcrypt compare)
   */
  private async comparePinHash(pin: string, hash: string): Promise<boolean> {
    return bcrypt.compare(pin, hash);
  }

  /**
   * Generate PIN for a reservation
   * Returns the PIN to the user (should be sent via SMS/email)
   */
  async generatePin(reservationId: string, userId: string): Promise<{ pin: string; maskedPin: string; expiresIn: number }> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (reservation.userId !== userId) {
      throw new BadRequestException('Reservation does not belong to you');
    }

    // Check if already checked in (prevent regeneration)
    if (reservation.checkInVerifiedAt) {
      throw new BadRequestException('PIN already verified for this reservation. Cannot regenerate.');
    }

    // Generate new PIN
    const plainPin = this.generateRandomPin();
    const hashedPin = await this.hashPin(plainPin);

    // Store encrypted PIN on reservation
    await this.prisma.reservation.update({
      where: { id: reservationId },
      data: {
        checkInPin: hashedPin,
        updatedAt: new Date(),
      },
    });

    // Mask PIN for display (show only last 2 digits)
    const maskedPin = '*'.repeat(this.PIN_LENGTH - 2) + plainPin.slice(-2);

    return {
      pin: plainPin,
      maskedPin,
      expiresIn: this.PIN_EXPIRY_MINUTES * 60, // in seconds
    };
  }

  /**
   * Retrieve existing PIN for a reservation
   * Returns masked PIN if already exists, generates new if not
   */
  async getPin(
    reservationId: string,
    userId: string,
  ): Promise<{ maskedPin: string; expiresIn: number; isNew: boolean }> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (reservation.userId !== userId) {
      throw new BadRequestException('Reservation does not belong to you');
    }

    // If PIN exists and not verified, return masked version
    if (reservation.checkInPin && !reservation.checkInVerifiedAt) {
      const maskedPin = '*'.repeat(this.PIN_LENGTH - 2) + '**'; // Fully masked on retrieve
      return {
        maskedPin,
        expiresIn: this.PIN_EXPIRY_MINUTES * 60,
        isNew: false,
      };
    }

    // Otherwise, generate new PIN
    const { maskedPin, expiresIn } = await this.generatePin(reservationId, userId);
    return {
      maskedPin,
      expiresIn,
      isNew: true,
    };
  }

  /**
   * Verify PIN for check-in
   * Updates checkInVerifiedAt on success
   */
  async verifyPin(
    reservationId: string,
    userId: string,
    pinInput: string,
  ): Promise<{
    success: boolean;
    bikeId: string;
    unlockedAt: Date;
    sessionToken: string;
  }> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { bike: true },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (reservation.userId !== userId) {
      throw new BadRequestException('Reservation does not belong to you');
    }

    if (!reservation.checkInPin) {
      throw new BadRequestException('No PIN generated for this reservation');
    }

    if (reservation.checkInVerifiedAt) {
      throw new BadRequestException('PIN already verified for this reservation');
    }

    // Verify PIN using bcrypt
    const isValidPin = await this.comparePinHash(pinInput, reservation.checkInPin);
    if (!isValidPin) {
      throw new UnauthorizedException('Invalid PIN');
    }

    // Update reservation: mark as checked in
    const verifiedReservation = await this.prisma.reservation.update({
      where: { id: reservationId },
      data: {
        checkInVerifiedAt: new Date(),
        status: 'CHECKED_IN',
        actualStart: new Date(),
      },
      include: { bike: true },
    });

    // Generate session token for bike unlock
    const sessionToken = `unlock_${reservationId}_${Date.now()}`;

    return {
      success: true,
      bikeId: verifiedReservation.bikeId,
      unlockedAt: new Date(),
      sessionToken,
    };
  }

  /**
   * Clear PIN from reservation (admin only, for recovery scenarios)
   */
  async clearPin(reservationId: string): Promise<{ cleared: boolean }> {
    await this.prisma.reservation.update({
      where: { id: reservationId },
      data: {
        checkInPin: null,
        checkInVerifiedAt: null,
      },
    });

    return { cleared: true };
  }
}
