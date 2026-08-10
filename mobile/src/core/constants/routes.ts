export const ROUTES = {
  AUTH: {
    LOGIN: '/(auth)/login',
    REGISTER: '/(auth)/register',
    FORGOT_PASSWORD: '/(auth)/forgot-password',
  },
  APP: {
    MAP: '/(app)/map',
    RESERVATION: '/(app)/reservation',
    RIDE: '/(app)/ride',
    PROFILE: '/(app)/profile',
    SETTINGS: '/(app)/settings',
  },
} as const;
