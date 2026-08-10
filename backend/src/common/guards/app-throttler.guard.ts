import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { SecurityAuditService } from '../security/security-audit.service';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const ip =
      req.headers?.['x-forwarded-for']?.toString().split(',')[0].trim() ||
      req.headers?.['x-real-ip'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      '127.0.0.1';

    return ip;
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: any,
  ): Promise<void> {
    const req = context.switchToHttp().getRequest();
    const ip = await this.getTracker(req);

    // Get SecurityAuditService from Reflector / Module context if available
    const auditService = this.getSecurityAuditService(context);
    if (auditService) {
      auditService.logEvent({
        type: 'RATE_LIMIT_EXCEEDED',
        ip,
        method: req.method,
        path: req.originalUrl || req.url,
        details: throttlerLimitDetail,
      });
    }

    throw new ThrottlerException(
      'Has realizado demasiadas peticiones en poco tiempo. Por favor, intentalo más tarde.',
    );
  }

  private getSecurityAuditService(context: ExecutionContext): SecurityAuditService | null {
    try {
      // In NestJS, providers injected into custom ThrottlerGuard subclass are accessible via constructor or module ref
      return (this as any).securityAuditService || null;
    } catch {
      return null;
    }
  }
}
