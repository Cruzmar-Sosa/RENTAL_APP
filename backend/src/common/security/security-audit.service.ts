import { Injectable, Logger } from '@nestjs/common';

export interface SecurityEvent {
  type:
    | 'RATE_LIMIT_EXCEEDED'
    | 'LOGIN_FAILED'
    | 'LOGIN_LOCKOUT'
    | 'REGISTRATION_HONEYPOT_TRIGGERED'
    | 'REGISTRATION_LIMIT_EXCEEDED'
    | 'REQUEST_TIMEOUT'
    | 'PAYLOAD_TOO_LARGE'
    | 'UNAUTHORIZED_ACCESS';
  ip?: string;
  userId?: string;
  email?: string;
  path?: string;
  method?: string;
  details?: Record<string, any>;
}

@Injectable()
export class SecurityAuditService {
  private readonly logger = new Logger('SecurityAudit');

  logEvent(event: SecurityEvent) {
    const logData = {
      timestamp: new Date().toISOString(),
      eventType: event.type,
      ip: event.ip || 'UNKNOWN',
      userId: event.userId || 'ANONYMOUS',
      email: event.email || 'N/A',
      method: event.method || 'UNKNOWN',
      path: event.path || 'UNKNOWN',
      details: event.details || {},
    };

    const message = `[SECURITY_AUDIT] ${event.type} | IP: ${logData.ip} | User: ${logData.email} | Path: ${logData.method} ${logData.path}`;

    switch (event.type) {
      case 'LOGIN_LOCKOUT':
      case 'REGISTRATION_HONEYPOT_TRIGGERED':
      case 'PAYLOAD_TOO_LARGE':
        this.logger.warn(message, JSON.stringify(logData));
        break;
      case 'RATE_LIMIT_EXCEEDED':
      case 'REQUEST_TIMEOUT':
      case 'UNAUTHORIZED_ACCESS':
        this.logger.warn(message, JSON.stringify(logData));
        break;
      default:
        this.logger.log(message, JSON.stringify(logData));
        break;
    }
  }
}
