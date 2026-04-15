'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Station, Bike } from '@/types';
import { toast } from 'sonner';
import { MapPin, Bike as BikeIcon, Zap, ShieldCheck, DollarSign, Activity, Settings2 } from 'lucide-react';
import { LoadingScreen } from '@/components/ui/loading-screen';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoaded: authLoaded, isAuthenticated } = useAuthStore();

  const { data: stations, isLoading: stationsLoading, refetch } = useQuery({
    queryKey: ['stations'],
    queryFn: async () => {
      const res = await api.get('/stations');
      return res.data;
    }
  });

  const { data: adminReservations, isLoading: resLoading } = useQuery({
    queryKey: ['dashboard-kpi-reservations'],
    queryFn: async () => {
      const res = await api.get('/reservations');
      return res.data;
    },
    enabled: authLoaded && user?.role === 'ADMIN'
  });

  const reserveBike = async (bikeId: string) => {
    try {
      await api.post('/reservations', { bikeId });
      toast.success('Bicycle reserved! Safe travels 🚲');
      refetch();
    } catch {
      toast.error('Failed to reserve. This bike might be already active or low battery.');
    }
  };

  if (!authLoaded) return <LoadingScreen message="Hydrating dashboard profile..." />;
  if (!isAuthenticated) return null;

  if (stationsLoading) return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-64 bg-gray-100 rounded-3xl animate-pulse border" />
      ))}
    </div>
  );

  const availableBikesCount = stations?.reduce((acc: number, station: any) => 
    acc + (station.bikes?.filter((b: any) => b.status === 'AVAILABLE').length || 0), 0
  ) || 0;

  const totalRevenue = adminReservations?.reduce((acc: number, res: any) => 
    acc + (res.status === 'COMPLETED' ? (res.priceActual || 0) : 0), 0
  ) || 0;

  const activeRides = adminReservations?.filter((r: any) => r.status === 'ACTIVE').length || 0;
  const pendingRides = adminReservations?.filter((r: any) => r.status === 'CONFIRMED' || r.status === 'PENDING').length || 0;


  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {user?.role === 'ADMIN' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-black text-white p-6 rounded-3xl flex flex-col justify-between shadow-xl shadow-black/10">
            <h3 className="text-gray-400 text-sm font-bold flex items-center gap-2 uppercase tracking-wide">
              <DollarSign size={16}/> Revenue
            </h3>
            <p className="text-3xl font-black mt-2">${totalRevenue}</p>
          </div>
          <div className="bg-white border p-6 rounded-3xl flex flex-col justify-between">
            <h3 className="text-gray-500 text-sm font-bold flex items-center gap-2 uppercase tracking-wide">
              <Activity size={16}/> Active Rides
            </h3>
            <p className="text-3xl font-black mt-2 text-green-500">{activeRides}</p>
          </div>
          <div className="bg-white border p-6 rounded-3xl flex flex-col justify-between">
            <h3 className="text-gray-500 text-sm font-bold flex items-center gap-2 uppercase tracking-wide">
              <Settings2 size={16}/> Reserved
            </h3>
            <p className="text-3xl font-black mt-2 text-blue-500">{pendingRides}</p>
          </div>
          <div className="bg-white border p-6 rounded-3xl flex flex-col justify-between">
            <h3 className="text-gray-500 text-sm font-bold flex items-center gap-2 uppercase tracking-wide">
              <BikeIcon size={16}/> Available Bikes
            </h3>
            <p className="text-3xl font-black mt-2">{availableBikesCount}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-black">Explora León</h1>
        <p className="text-gray-500 font-medium">Find a station, pick a bike, and enjoy the ride.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {stations?.map((station: Station) => (
          <div key={station.id} className="group relative bg-white border rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all duration-500 overflow-hidden">
            <div className="absolute top-0 right-0 p-8 text-black/5 group-hover:text-black/10 transition-colors">
              <MapPin size={120} strokeWidth={1} />
            </div>

            <div className="relative z-10">
              <div className="bg-black text-white w-fit px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                Active Station
              </div>
              <h2 className="text-2xl font-bold text-black group-hover:translate-x-1 transition-transform">{station.name}</h2>
              <div className="flex items-center gap-2 text-gray-400 mt-2 font-medium">
                <MapPin size={16} />
                <span className="text-sm">{station.address}</span>
              </div>
              
              <div className="mt-10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <BikeIcon size={20} />
                    Available Fleet
                  </h3>
                  <span className="text-sm font-black bg-gray-100 px-3 py-1 rounded-lg">
                    {station.bikes?.filter(b => b.status === 'AVAILABLE').length || 0} Bikes
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {station.bikes?.filter((b: Bike) => b.status === 'AVAILABLE').map((bike: Bike) => (
                    <div key={bike.id} className="bg-gray-50/50 border border-gray-100 p-4 rounded-2xl flex flex-col gap-3 hover:bg-white hover:border-black/10 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-mono font-bold text-gray-800">#{bike.code || bike.id.slice(-6).toUpperCase()}</span>
                        <Zap size={14} className={bike.batteryLevel && bike.batteryLevel > 20 ? 'text-amber-400 fill-amber-400' : 'text-red-400 fill-red-400'} />
                      </div>
                      <button 
                        onClick={() => reserveBike(bike.id)}
                        className="w-full bg-black text-white py-2 rounded-xl text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        Reserve Now
                      </button>
                    </div>
                  ))}
                  {(!station.bikes || station.bikes.filter(b => b.status === 'AVAILABLE').length === 0) && (
                    <div className="col-span-2 py-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <p className="text-gray-400 text-sm italic font-medium">All bikes are currently on the road.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
