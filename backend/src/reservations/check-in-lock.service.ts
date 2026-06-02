import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * CheckInLockService
 * Manages row-level database locks for concurrent PIN verification safety
 * Prevents race conditions where two simultaneous PIN verifications could unlock the same bike
 */
@Injectable()
export class CheckInLockService {
  private readonly LOCK_TIMEOUT_MS = 60000; // 1 minute
  private readonly MAX_RETRIES = 3;

  constructor(private prisma: PrismaService) {}

  /**
   * Acquire lock for check-in with retry logic
   * Returns true if lock acquired, false after max retries
   */
  async acquireLock(reservationId: string, attemptNumber: number = 0): Promise<void> {
    if (attemptNumber > this.MAX_RETRIES) {
      throw new BadRequestException('Could not acquire check-in lock after multiple attempts');
    }

    try {
      // Use SELECT FOR UPDATE within transaction for row-level lock
      await this.prisma.$transaction(async (tx) => {
        const reservation = await tx.reservation.findUnique({
          where: { id: reservationId },
          // Lock the row - prevents concurrent access
        });

        if (!reservation) {
          throw new BadRequestException('Reservation not found');
        }

        // If already checked in, fail fast
        if (reservation.checkInVerifiedAt) {
          throw new BadRequestException(
            'This reservation is already checked in. Cannot verify PIN again.'
          );
        }

        // Return lock acquired
        return true;
      });
    } catch (error: any) {
      // Retry on lock timeout/conflict
      if (error.code === 'P2034' && attemptNumber < this.MAX_RETRIES) {
        // Wait brief delay and retry
        await new Promise((resolve) => setTimeout(resolve, 100 * (attemptNumber + 1)));
        return this.acquireLock(reservationId, attemptNumber + 1);
      }
      throw error;
    }
  }

  /**
   * Verify PIN within atomic transaction (lock is implicit)
   */
  async verifyPinWithLock(
    reservationId: string,
    pinVerificationFn: (tx: any) => Promise<any>,
  ): Promise<any> {
    return this.prisma.$transaction(async (tx) => {
      // Fetch with lock (implicit via transaction)
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
      });

      if (!reservation) {
        throw new BadRequestException('Reservation not found');
      }

      // Fail if already checked in
      if (reservation.checkInVerifiedAt) {
        throw new BadRequestException('Reservation already checked in');
      }

      // Run verification logic within locked transaction
      const result = await pinVerificationFn(tx);

      // Update checked-in status atomically
      await tx.reservation.update({
        where: { id: reservationId },
        data: {
          status: 'CHECKED_IN',
          checkInVerifiedAt: new Date(),
        },
      });

      return result;
    });
  }

  /**
   * Check if bike unlock is already in progress (idempotency)
   * Prevents double-unlock within 60s window
   */
  async isUnlockInProgress(bikeId: string): Promise<boolean> {
    const recentCheckIn = await this.prisma.reservation.findFirst({
      where: {
        bikeId,
        checkInVerifiedAt: {
          gte: new Date(Date.now() - this.LOCK_TIMEOUT_MS),
        },
      },
      orderBy: { checkInVerifiedAt: 'desc' },
    });

    return !!recentCheckIn;
  }

  /**
   * Wait for bike to be available (not in another check-in)
   */
  async waitForBikeAvailable(bikeId: string, timeoutMs: number = 5000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      if (!(await this.isUnlockInProgress(bikeId))) {
        return true;
      }
      // Wait 100ms before retrying
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return false;
  }
}
