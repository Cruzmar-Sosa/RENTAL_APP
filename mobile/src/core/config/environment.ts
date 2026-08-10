export interface AppEnvironmentConfig {
  readonly apiUrl: string;
  readonly trackingUrl: string;
  readonly env: 'development' | 'staging' | 'production';
  readonly isDevelopment: boolean;
  readonly isProduction: boolean;
}

const envName = (process.env.EXPO_PUBLIC_APP_ENV as 'development' | 'staging' | 'production') || 'development';

export const environmentConfig: AppEnvironmentConfig = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  trackingUrl: process.env.EXPO_PUBLIC_TRACKING_URL || 'ws://localhost:3001/tracking',
  env: envName,
  isDevelopment: envName === 'development',
  isProduction: envName === 'production',
};
