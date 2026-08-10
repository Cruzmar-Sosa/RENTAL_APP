import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  GatewayTimeoutException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Observable, TimeoutError, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { SKIP_TIMEOUT_KEY } from '../decorators/skip-timeout.decorator';
import { SecurityAuditService } from '../security/security-audit.service';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly defaultTimeoutMs: number;

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly auditService: SecurityAuditService,
  ) {
    this.defaultTimeoutMs = this.configService.get<number>('REQUEST_TIMEOUT_MS', 10000);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isSkipped = this.reflector.getAllAndOverride<boolean>(SKIP_TIMEOUT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isSkipped) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const path = request?.originalUrl || request?.url;
    const method = request?.method;

    return next.handle().pipe(
      timeout(this.defaultTimeoutMs),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          this.auditService.logEvent({
            type: 'REQUEST_TIMEOUT',
            path,
            method,
            ip: request?.ip,
            details: { timeoutMs: this.defaultTimeoutMs },
          });

          return throwError(
            () =>
              new GatewayTimeoutException(
                'El tiempo de espera de la solicitud ha expirado. Por favor, reintente más tarde.',
              ),
          );
        }
        return throwError(() => err);
      }),
    );
  }
}
