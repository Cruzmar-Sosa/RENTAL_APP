export interface FeatureFlags {
  readonly enableOfflineReservations: boolean;
  readonly enableBiometricAuth: boolean;
  readonly enableAnalytics: boolean;
  readonly enableCrashReporting: boolean;
  readonly enableBackgroundTracking: boolean;
}

export const defaultFeatureFlags: FeatureFlags = {
  enableOfflineReservations: false,
  enableBiometricAuth: false,
  enableAnalytics: true,
  enableCrashReporting: true,
  enableBackgroundTracking: true,
};
