'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import { Map, MapPin, Bike as BikeIcon, Zap, Signal, SignalZero, Navigation } from 'lucide-react';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { AccessDenied } from '@/components/ui/access-denied';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

// Dynamic import with no SSR for Leaflet
const MapViewer = dynamic(() => import('@/components/MapViewer'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-50 text-gray-400">
      <LoadingScreen message="Loading Map Engine..." />
    </div>
  ),
});

export default function TrackingPage() {
  const { canView, isLoaded } = usePermissions();
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const { data: bikes, isLoading: isBikesLoading } = useQuery({
    queryKey: ['tracking-bikes'],
    queryFn: async () => {
      const res = await api.get('/bikes');
      return res.data;
    },
    enabled: isLoaded
  });

  const { data: routes, isLoading: isRoutesLoading } = useQuery({
    queryKey: ['tracking-routes'],
    queryFn: async () => {
      const res = await api.get('/routes');
      return res.data;
    },
    enabled: isLoaded
  });

  if (!isLoaded || isBikesLoading || isRoutesLoading) return <LoadingScreen message="Loading Tracking Module..." />;
  if (!canView('TRACKING') && !canView('BIKES')) return <AccessDenied />;

  const activeBikes = bikes?.filter((b: any) => b.status === 'IN_USE') || [];
  const selectedRoute = routes?.find((r: any) => r.id === selectedRouteId);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Real-Time Fleet Tracking</h1>
          <p className="text-gray-500 mt-1">Monitor active units and station occupancy across the city.</p>
        </div>
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full border transition-colors",
          isSocketConnected 
            ? "bg-green-50 text-green-700 border-green-100" 
            : "bg-red-50 text-red-700 border-red-100"
        )}>
           {isSocketConnected ? <Signal size={16} className="animate-pulse" /> : <SignalZero size={16} />}
           <span className="text-xs font-black uppercase tracking-widest">
             {isSocketConnected ? 'Live System Active' : 'Disconnected'}
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Map Area */}
        <div className="lg:col-span-2 bg-white border rounded-[2rem] h-[600px] relative overflow-hidden shadow-sm">
          <MapViewer 
            initialBikes={activeBikes} 
            onSocketStatusChange={setIsSocketConnected}
            selectedRoute={selectedRoute}
          />
        </div>

        {/* Info Panel */}
        <div className="space-y-6">
           <div className="bg-white border rounded-[2rem] p-6 shadow-sm overflow-hidden">
             <h3 className="font-bold flex items-center gap-2 mb-4">
               <Zap size={18} className="text-amber-500" />
               Active In-Use Units
             </h3>
             <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {activeBikes.length > 0 ? activeBikes.map((bike: any) => (
                  <div key={bike.id} className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between border border-transparent hover:border-black/5 transition cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center">
                        <BikeIcon size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">#{bike.code || bike.id.slice(0,6)}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{bike.model}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-md border border-green-100">Live</span>
                       <p className="text-xs font-bold text-gray-700 mt-1">{bike.batteryLevel}% 🔋</p>
                    </div>
                  </div>
                )) : (
                  <div className="py-8 text-center space-y-2">
                     <p className="text-gray-400 text-sm">No bikes currently in use.</p>
                  </div>
                )}
             </div>
           </div>

           <div className="bg-white border rounded-[2rem] p-6 shadow-sm overflow-hidden">
             <h3 className="font-bold flex items-center gap-2 mb-4">
               <Navigation size={18} className="text-blue-500" />
               Suggested Routes
             </h3>
             <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {routes && routes.length > 0 ? routes.map((route: any) => (
                  <div 
                    key={route.id} 
                    onClick={() => setSelectedRouteId(selectedRouteId === route.id ? null : route.id)}
                    className={cn(
                      "p-3 rounded-xl border cursor-pointer transition select-none flex justify-between items-center",
                      selectedRouteId === route.id ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-transparent hover:bg-gray-100"
                    )}
                  >
                    <div>
                      <p className="text-sm font-bold">{route.name}</p>
                      <p className="text-[10px] text-gray-500">{route.distanceKm} km • {route.difficulty}</p>
                    </div>
                    {selectedRouteId === route.id && <MapPin size={16} className="text-blue-500" />}
                  </div>
                )) : (
                  <p className="text-gray-400 text-sm text-center py-4">No routes available.</p>
                )}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
