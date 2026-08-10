import { Injectable, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SecurityAuditService } from './security-audit.service';

@Injectable()
export class RegistrationAbuseService {
  private registrationIpTracker = new Map<string, { count: number; resetAt: number }>();
  private readonly maxRegistrationsPerIpDay: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly auditService: SecurityAuditService,
  ) {
    this.maxRegistrationsPerIpDay = this.configService.get<number>(
      'MAX_REGISTRATIONS_PER_IP_DAY',
      3,
    );
  }

  validateHoneypot(honeypotValue?: string, ip?: string, email?: string): void {
    if (honeypotValue && honeypotValue.trim().length > 0) {
      this.auditService.logEvent({
        type: 'REGISTRATION_HONEYPOT_TRIGGERED',
        ip,
        email,
        details: { honeypotValue },
      });

      // Reject bot attempt immediately
      throw new BadRequestException('Petición no válida.');
    }
  }

  checkIpRegistrationLimit(ip: string, email?: string): void {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const record = this.registrationIpTracker.get(ip);

    if (!record || now > record.resetAt) {
      this.registrationIpTracker.set(ip, { count: 1, resetAt: now + dayMs });
      return;
    }

    if (record.count >= this.maxRegistrationsPerIpDay) {
      this.auditService.logEvent({
        type: 'REGISTRATION_LIMIT_EXCEEDED',
        ip,
        email,
        details: { count: record.count, limit: this.maxRegistrationsPerIpDay },
      });

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: 'Se ha alcanzado el límite máximo de registros permitidos desde esta dirección IP por hoy.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    record.count += 1;
  }
}
