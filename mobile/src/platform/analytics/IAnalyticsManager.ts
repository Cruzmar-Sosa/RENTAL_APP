export interface IAnalyticsManager {
  track(eventName: string, properties?: Record<string, unknown>): void;
  screen(screenName: string, properties?: Record<string, unknown>): void;
  identify(userId: string, traits?: Record<string, unknown>): void;
  reset(): void;
}
