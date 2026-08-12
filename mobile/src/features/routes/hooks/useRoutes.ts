import { useState, useCallback, useEffect } from 'react';
import { RouteEntity } from '@domain/entities/Route';
import { routeRepository } from '@platform/container';

export function useRoutes() {
  const [routes, setRoutes] = useState<RouteEntity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoutes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await routeRepository.findAll();
      setRoutes(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch routes';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  return {
    routes,
    isLoading,
    error,
    refreshRoutes: fetchRoutes,
  };
}
