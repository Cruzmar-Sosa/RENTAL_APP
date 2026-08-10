import { useEffect, useState } from 'react';
import { useAuthStore } from '@application/stores/auth.store';
import { authRepository } from '@platform/container';
import { LoginCredentials } from '@domain/repositories/IAuthRepository';

export function useAuth() {
  const { user, isAuthenticated, isInitializing, setAuth, clearAuth, setInitializing } = useAuthStore();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function bootstrap() {
      try {
        const currentUser = await authRepository.getCurrentUser();
        if (isMounted) {
          if (currentUser) {
            useAuthStore.getState().setUser(currentUser);
          } else {
            clearAuth();
          }
        }
      } catch {
        if (isMounted) clearAuth();
      } finally {
        if (isMounted) setInitializing(false);
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [clearAuth, setInitializing]);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authRepository.login(credentials);
      setAuth(result.user, result.tokens.accessToken);
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authRepository.logout();
    } finally {
      clearAuth();
      setIsLoading(false);
    }
  };

  return {
    user,
    isAuthenticated,
    isInitializing,
    isLoading,
    error,
    login,
    logout,
  };
}
