import { IAnalyticsManager } from './IAnalyticsManager';
import { logger } from '@core/logger';

export class AnalyticsManager implements IAnalyticsManager {
  public track(eventName: string, properties?: Record<string, unknown>): void {
    logger.debug(`[Analytics] Track: ${eventName}`, properties);
  }

  public screen(screenName: string, properties?: Record<string, unknown>): void {
    logger.debug(`[Analytics] Screen: ${screenName}`, properties);
  }

  public identify(userId: string, traits?: Record<string, unknown>): void {
    logger.debug(`[Analytics] Identify: ${userId}`, traits);
  }

  public reset(): void {
    logger.debug('[Analytics] Reset');
  }
}
