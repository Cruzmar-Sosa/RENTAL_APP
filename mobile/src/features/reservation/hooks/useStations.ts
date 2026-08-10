import { useState, useEffect, useCallback } from 'react';
import { Station } from '@domain/entities/Station';
import { stationRepository } from '@platform/container';

export function useStations() {
  const [stations, setStations] = useState<readonly Station[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await stationRepository.getAllStations();
      setStations(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch stations';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  return { stations, isLoading, error, refresh: fetchStations };
}
