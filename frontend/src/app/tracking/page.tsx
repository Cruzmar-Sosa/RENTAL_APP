'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import { Map, MapPin, Bike as BikeIcon, Zap, Signal } from 'lucide-react';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { AccessDenied } from '@/components/ui/access-denied';
import { cn } from '@/lib/utils';

export default function TrackingPage() {
  const { canView, isLoaded } = usePermissions();

  const { data: bikes, isLoading } = useQuery({
    queryKey: ['tracking-bikes'],
    queryFn: async () => {
      const res = await api.get('/bikes');
      return res.data;
    },
    enabled: isLoaded
  });

  if (!isLoaded) return <LoadingScreen message="Loading Tracking Module..." />;
  if (!canView('TRACKING') && !canView('BIKES')) return <AccessDenied />;

  const activeBikes = bikes?.filter((b: any) => b.status === 'IN_USE') || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Real-Time Fleet Tracking</h1>
          <p className="text-gray-500 mt-1">Monitor active units and station occupancy across the city.</p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full border border-green-100">
           <Signal size={16} className="animate-pulse" />
           <span className="text-xs font-black uppercase tracking-widest">Live System Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Map Area */}
        <div className="lg:col-span-2 bg-white border rounded-[2rem] h-[600px] flex items-center justify-center p-8 relative overflow-hidden shadow-sm">
          <div className="absolute inset-0 bg-gray-50 z-0">
             <div className="h-full w-full opacity-[0.05]" style={{backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>
             {/* Mock Station Dots */}
             <div className="absolute top-1/4 left-1/3 w-4 h-4 bg-black rounded-full shadow-lg border-2 border-white animate-bounce" />
             <div className="absolute top-1/2 left-2/3 w-4 h-4 bg-black rounded-full shadow-lg border-2 border-white" />
             <div className="absolute bottom-1/4 left-1/2 w-4 h-4 bg-black rounded-full shadow-lg border-2 border-white" />
          </div>
          
          <div className="z-10 text-center space-y-4 bg-white/80 backdrop-blur-md p-8 rounded-3xl border border-white shadow-2xl max-w-sm">
             <div className="mx-auto w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg mb-4">
                <Map size={32}/>
             </div>
             <h3 className="text-2xl font-bold">Map View Layer</h3>
             <p className="text-gray-500 text-sm leading-relaxed">
               The geolocation engine is active. Google Maps render logic is pending API Key injection. 
               Coordinate data is already flowing from active units.
             </p>
             <button className="bg-black text-white px-6 py-2.5 rounded-xl text-sm font-bold w-full hover:scale-[1.02] transition active:scale-[0.98]">
                Configure Maps Key
             </button>
          </div>
        </div>

        {/* Info Panel */}
        <div className="space-y-6">
           <div className="bg-white border rounded-[2rem] p-6 shadow-sm overflow-hidden">
             <h3 className="font-bold flex items-center gap-2 mb-4">
               <Zap size={18} className="text-amber-500" />
               Active In-Use Units
             </h3>
             <div className="space-y-3">
                {activeBikes.length > 0 ? activeBikes.map((bike: any) => (
                  <div key={bike.id} className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between border border-transparent hover:border-black/5 transition">
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
                  <div className="py-12 text-center space-y-2">
                     <p className="text-gray-400 text-sm">No bikes currently in use.</p>
                  </div>
                )}
             </div>
           </div>

           <div className="bg-black text-white rounded-[2rem] p-8 space-y-4">
              <h3 className="font-bold text-lg">Fleet Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Health</p>
                   <p className="text-2xl font-bold">98.2%</p>
                 </div>
                 <div>
                   <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Active Dist.</p>
                   <p className="text-2xl font-bold">142km</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
