import { create } from 'zustand';
import { User } from '@domain/entities/User';
import { Nullable } from '@core/types';

export interface AuthState {
  user: Nullable<User>;
  accessToken: Nullable<string>;
  isAuthenticated: boolean;
  isInitializing: boolean;
  setAuth: (user: User, token: string) => void;
  setUser: (user: Nullable<User>) => void;
  setInitializing: (isInitializing: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isInitializing: true,
  setAuth: (user, token) => set({ user, accessToken: token, isAuthenticated: true, isInitializing: false }),
  setUser: (user) => set({ user, isAuthenticated: Boolean(user), isInitializing: false }),
  setInitializing: (isInitializing) => set({ isInitializing }),
  clearAuth: () => set({ user: null, accessToken: null, isAuthenticated: false, isInitializing: false }),
}));
