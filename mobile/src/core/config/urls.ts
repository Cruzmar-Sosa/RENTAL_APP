import { environmentConfig } from './environment';

export const APP_URLS = {
  auth: {
    login: `${environmentConfig.apiUrl}/auth/login`,
    register: `${environmentConfig.apiUrl}/auth/register`,
    refresh: `${environmentConfig.apiUrl}/auth/refresh`,
    logout: `${environmentConfig.apiUrl}/auth/logout`,
    me: `${environmentConfig.apiUrl}/auth/me`,
  },
  bikes: {
    list: `${environmentConfig.apiUrl}/bikes`,
    available: `${environmentConfig.apiUrl}/bikes/available`,
    byId: (id: string) => `${environmentConfig.apiUrl}/bikes/${id}`,
  },
  stations: {
    list: `${environmentConfig.apiUrl}/stations`,
    byId: (id: string) => `${environmentConfig.apiUrl}/stations/${id}`,
  },
  reservations: {
    create: `${environmentConfig.apiUrl}/reservations`,
    my: `${environmentConfig.apiUrl}/reservations/my`,
    byId: (id: string) => `${environmentConfig.apiUrl}/reservations/${id}`,
    start: (id: string) => `${environmentConfig.apiUrl}/reservations/${id}/start`,
    complete: (id: string) => `${environmentConfig.apiUrl}/reservations/${id}/complete`,
    cancel: (id: string) => `${environmentConfig.apiUrl}/reservations/${id}/cancel`,
    getPin: (id: string) => `${environmentConfig.apiUrl}/reservations/${id}/pin`,
    verifyPin: (id: string) => `${environmentConfig.apiUrl}/reservations/${id}/verify-pin`,
  },
  tracking: {
    websocketGateway: environmentConfig.trackingUrl,
  },
} as const;
