import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not defined');
}

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Global Response Interceptor for HTTP 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
      const isLoginPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/login');

      // Only trigger logout if it is an authenticated route, not currently logging in or on login page
      if (!isAuthEndpoint && !isLoginPage && typeof window !== 'undefined') {
        console.warn('[API Interceptor] HTTP 401 received. Clearing auth state and redirecting.');
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  },
);
