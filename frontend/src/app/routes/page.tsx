'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import { MapPin, Route as RouteIcon, Clock, Move } from 'lucide-react';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { AccessDenied } from '@/components/ui/access-denied';
import { Route } from '@/types';

export default function RoutesPage() {
  const { canView, isLoaded } = usePermissions();

  const { data: routes, isLoading } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const res = await api.get('/routes');
      return res.data;
    },
    enabled: isLoaded
  });

  if (!isLoaded) return <LoadingScreen message="Loading Routes..." />;
  if (!canView('ROUTES') && !canView('BIKES')) return <AccessDenied />; // If we don't have routes permission yet we use BIKES as fallback to allow at least. But we do have it.

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Available Routes</h1>
          <p className="text-gray-500 mt-1">Discover pre-defined routes constructed for tourism.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
           Array.from({ length: 3 }).map((_, i) => (
             <div key={i} className="h-48 bg-gray-100 rounded-3xl animate-pulse border" />
           ))
        ) : routes?.map((route: Route) => (
          <div key={route.id} className="bg-white border p-6 rounded-3xl flex flex-col gap-4 hover:shadow-xl hover:shadow-black/5 transition">
             <div className="flex justify-between items-start">
               <div>
                 <h3 className="font-bold text-lg">{route.name}</h3>
                 <p className="text-xs font-bold text-gray-400 mt-1 flex items-center gap-1 uppercase tracking-wider"><RouteIcon size={14}/> {route.difficulty}</p>
               </div>
               <div className="bg-gray-100 p-3 rounded-2xl text-black">
                 <Move size={20}/>
               </div>
             </div>
             {route.description && <p className="text-sm text-gray-500">{route.description}</p>}
             <div className="mt-auto pt-4 border-t flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MapPin size={16} className="text-gray-400"/> {route.distanceKm} km
                </div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock size={16} className="text-gray-400"/> {route.durationMin} min
                </div>
             </div>
          </div>
        ))}
      </div>

      {!isLoading && (!routes || routes.length === 0) && (
        <div className="bg-gray-50 rounded-3xl p-12 text-center text-gray-400 border border-dashed border-gray-200">
           No predefined routes found in the database.
        </div>
      )}
    </div>
  );
}
