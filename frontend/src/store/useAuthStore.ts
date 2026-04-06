import { create } from 'zustand';
import { api } from '@/lib/api';

export function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

interface AuthState {
  user: { sub: string, email: string, role: string, name?: string } | null;
  token: string | null;
  permissions: Record<string, Record<string, boolean>> | null;
  isAuthenticated: boolean;
  isLoaded: boolean;
  login: (token: string, userData: any) => Promise<void>;
  logout: () => void;
  hydrateSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  permissions: null,
  isAuthenticated: false,
  isLoaded: false,

  login: async (token, userData) => {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Set authenticated but NOT loaded yet — keep Sidebar in Skeleton state
    set({ token, user: userData, isAuthenticated: true, isLoaded: false });

    // Fetch permissions immediately on login before rendering the app
    try {
      const fetchPromise = api.get('/auth/me');
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Login /auth/me timeout')), 5000)
      );
      const res: any = await Promise.race([fetchPromise, timeoutPromise]);

      const normalizedPermissions: Record<string, Record<string, boolean>> = {};
      res.data.permissions.forEach((p: any) => {
        if (!normalizedPermissions[p.module]) normalizedPermissions[p.module] = {};
        normalizedPermissions[p.module][p.action] = true;
      });

      console.log('LOGIN PERMISSIONS:', normalizedPermissions);

      set({
        user: { ...userData, name: res.data.name },
        permissions: normalizedPermissions,
        isLoaded: true
      });
    } catch (e) {
      // Even on failure, unblock the UI — user is authenticated but with empty permissions
      console.warn('Could not load permissions after login:', e);
      set({ permissions: {}, isLoaded: true });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({
      user: null,
      token: null,
      permissions: null,
      isAuthenticated: false,
      isLoaded: true,
    });
    window.location.href = '/login';
  },

  hydrateSession: async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      set({ isLoaded: true, isAuthenticated: false });
      return;
    }

    const decoded = decodeJwt(token);
    if (!decoded || !decoded.role) {
      localStorage.removeItem('token');
      set({ isLoaded: true, isAuthenticated: false });
      return;
    }

    // Attempt to fetch fresh permissions from the backend
    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const fetchPromise = api.get('/auth/me');
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Hydration timeout')), 5000)
      );

      const res: any = await Promise.race([fetchPromise, timeoutPromise]);
      
      const normalizedPermissions: Record<string, Record<string, boolean>> = {};
      
      res.data.permissions.forEach((p: any) => {
        // Since backend maps to an array of strictly allowed actions:
        if (!normalizedPermissions[p.module]) {
          normalizedPermissions[p.module] = {};
        }
        normalizedPermissions[p.module][p.action] = true;
      });

      console.log('PERMISSIONS:', normalizedPermissions);
      console.log('IS LOADED:', true);

      set({
        token,
        user: { ...decoded, name: res.data.name },
        permissions: normalizedPermissions,
        isAuthenticated: true,
        isLoaded: true
      });
    } catch (error) {
      localStorage.removeItem('token');
      set({ isLoaded: true, isAuthenticated: false, user: null, token: null });
    }
  }
}));
