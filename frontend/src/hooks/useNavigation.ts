import { useState } from 'react';
import { Route } from '@/types';

export function useNavigation() {
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  const selectRoute = (route: Route) => {
    setSelectedRoute(route);
  };

  const clearRoute = () => {
    setSelectedRoute(null);
  };

  return {
    selectedRoute,
    selectRoute,
    clearRoute
  };
}
