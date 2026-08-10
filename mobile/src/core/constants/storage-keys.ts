export const STORAGE_KEYS = {
  SECURE: {
    ACCESS_TOKEN: 'rentapp_access_token',
    REFRESH_TOKEN: 'rentapp_refresh_token',
    USER_PIN: 'rentapp_user_pin',
  },
  SQLITE: {
    DB_NAME: 'rentapp_offline.db',
    TELEMETRY_TABLE: 'telemetry_queue',
    BUSINESS_TABLE: 'business_queue',
  },
  ASYNC: {
    THEME_PREFERENCE: 'rentapp_theme_pref',
    LANGUAGE: 'rentapp_language',
    LAST_USER_EMAIL: 'rentapp_last_email',
  },
} as const;
