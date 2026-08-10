import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ILockoutStorage } from './interfaces/lockout-storage.interface';
import { SecurityAuditService } from './security-audit.service';

export const LOCKOUT_STORAGE_TOKEN = 'ILockoutStorage';

@Injectable()
export class LoginProtectionService {
  private readonly maxAttempts: number;
  private readonly lockoutMinutes: number;

  constructor(
    @Inject(LOCKOUT_STORAGE_TOKEN)
    private readonly storage: ILockoutStorage,
    private readonly configService: ConfigService,
    private readonly auditService: SecurityAuditService,
  ) {
    this.maxAttempts = this.configService.get<number>('MAX_LOGIN_ATTEMPTS', 5);
    this.lockoutMinutes = this.configService.get<number>('LOGIN_LOCKOUT_MINUTES', 15);
  }

  private getLockoutKey(email: string, ip: string): string {
    const sanitizedEmail = (email || '').trim().toLowerCase();
    return `login_lockout:${sanitizedEmail}:${ip}`;
  }

  async checkLockout(email: string, ip: string): Promise<void> {
    const key = this.getLockoutKey(email, ip);
    const locked = await this.storage.isLocked(key);

    if (locked) {
      this.auditService.logEvent({
        type: 'LOGIN_LOCKOUT',
        email,
        ip,
        details: { message: 'Attempt on locked account/IP' },
      });

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: `Demasiados intentos fallidos. Tu cuenta/IP ha sido bloqueada temporalmente por ${this.lockoutMinutes} minutos.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async recordFailedAttempt(email: string, ip: string): Promise<void> {
    const key = this.getLockoutKey(email, ip);
    const ttlSeconds = this.lockoutMinutes * 60;

    const attempts = await this.storage.incrementAttempts(key, ttlSeconds);

    this.auditService.logEvent({
      type: 'LOGIN_FAILED',
      email,
      ip,
      details: { attempt: attempts, maxAttempts: this.maxAttempts },
    });

    if (attempts >= this.maxAttempts) {
      await this.storage.setLockout(key, ttlSeconds);
      this.auditService.logEvent({
        type: 'LOGIN_LOCKOUT',
        email,
        ip,
        details: { lockoutDurationMinutes: this.lockoutMinutes },
      });
    }
  }

  async recordSuccessfulLogin(email: string, ip: string): Promise<void> {
    const key = this.getLockoutKey(email, ip);
    await this.storage.reset(key);
  }
}
