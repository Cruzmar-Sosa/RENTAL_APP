import { ICrashReporter } from './ICrashReporter';
import { logger } from '@core/logger';

export class CrashReporter implements ICrashReporter {
  public captureError(error: unknown, context?: Record<string, unknown>): void {
    logger.error('[CrashReporter] Captured exception', error, context);
  }

  public setUser(id: string, email?: string): void {
    logger.debug(`[CrashReporter] User set: ${id} (${email ?? ''})`);
  }

  public addBreadcrumb(message: string, category?: string): void {
    logger.debug(`[CrashReporter] Breadcrumb [${category ?? 'default'}]: ${message}`);
  }
}
