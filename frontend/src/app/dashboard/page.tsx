'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Station, Bike } from '@/types';
import { toast } from 'sonner';
import { MapPin, Bike as BikeIcon, Zap, ShieldCheck, DollarSign, Activity, Settings2 } from 'lucide-react';
import { LoadingScreen } from '@/components/ui/loading-screen';

import { useState } from 'react';
import { ReserveModal } from '@/components/modals/ReserveModal';
import { SettlementModal } from '@/components/modals/SettlementModal';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoaded: authLoaded, isAuthenticated } = useAuthStore();

  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  const [selectedBikeId, setSelectedBikeId] = useState<string | null>(null);

  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);

  const { data: stations, isLoading: stationsLoading, refetch } = useQuery({
    queryKey: ['stations'],
    queryFn: async () => {
      const res = await api.get('/stations');
      return res.data;
    }
  });

  const { data: adminReservations, isLoading: resLoading, refetch: refetchReservations } = useQuery({
    queryKey: ['dashboard-kpi-reservations'],
    queryFn: async () => {
      const res = await api.get('/reservations');
      return res.data;
    },
    enabled: authLoaded && user?.role === 'ADMIN'
  });

  const handleOpenReserve = (bikeId: string) => {
    setSelectedBikeId(bikeId);
    setReserveModalOpen(true);
  };

  const executeReservation = async (payload: any) => {
    try {
      await api.post('/reservations', payload);
      toast.success('Bicycle reserved successfully! 🚲');
      refetch();
      if (user?.role === 'ADMIN') refetchReservations();
    } catch {
      toast.error('Failed to reserve. This bike might be already active or low battery.');
    }
  };

  const handleStartRide = async (id: string) => {
    try {
      await api.patch(`/reservations/${id}/start`);
      toast.success('Ride started!');
      refetch();
      refetchReservations();
    } catch {
      toast.error('Failed to start ride.');
    }
  };

  const handleOpenSettlement = (reservation: any) => {
    setSelectedReservation(reservation);
    setSettlementModalOpen(true);
  };

  const executeSettlement = async (id: string, action: string, data?: any) => {
    try {
      await api.patch(`/reservations/${id}/${action}`, data);
      toast.success('Ride completed and settled!');
      refetch();
      refetchReservations();
    } catch {
      toast.error('Failed to complete ride.');
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
        <>
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

          <div className="bg-white border rounded-3xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <ShieldCheck size={24} className="text-blue-500" /> Admin Reservation Management
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Reservation</th>
                    <th className="px-6 py-3">Bike</th>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminReservations?.filter((r: any) => ['PENDING', 'CONFIRMED', 'ACTIVE'].includes(r.status)).map((res: any) => (
                    <tr key={res.id} className="bg-white border-b">
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                        RES-#{res.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 font-bold text-black">
                        #{res.bike?.code || res.bikeId?.slice(-4)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{res.user?.name || 'No Name'}</span>
                          <span className="text-xs text-gray-500">{res.user?.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          res.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          res.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                          res.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : ''
                        }`}>
                          {res.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        {(res.status === 'PENDING' || res.status === 'CONFIRMED') && (
                          <button onClick={() => handleStartRide(res.id)} className="bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-green-600">Start Ride</button>
                        )}
                        {res.status === 'ACTIVE' && (
                          <button onClick={() => handleOpenSettlement(res)} className="bg-black text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-gray-800">Complete Ride</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {adminReservations?.filter((r: any) => ['PENDING', 'CONFIRMED', 'ACTIVE'].includes(r.status)).length === 0 && (
                     <tr><td colSpan={4} className="px-6 py-4 text-center">No active or pending reservations</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
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
                  {station.bikes?.map((bike: Bike) => (
                    <div key={bike.id} className={`p-4 rounded-2xl flex flex-col gap-3 transition-all duration-300 border ${
                      bike.status === 'AVAILABLE' ? 'bg-gray-50/50 border-gray-100 hover:bg-white hover:border-black/10' :
                      bike.status === 'RESERVED' ? 'bg-yellow-50 border-yellow-100 opacity-80' :
                      bike.status === 'IN_USE' ? 'bg-blue-50 border-blue-100 opacity-80' :
                      'bg-red-50 border-red-100 opacity-80'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-mono font-bold text-gray-800">#{bike.code || bike.id.slice(-6).toUpperCase()}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                            bike.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                            bike.status === 'RESERVED' ? 'bg-yellow-200 text-yellow-800' :
                            bike.status === 'IN_USE' ? 'bg-blue-200 text-blue-800' :
                            'bg-red-200 text-red-800'
                          }`}>
                            {bike.status}
                          </span>
                          <Zap size={14} className={bike.batteryLevel && bike.batteryLevel > 20 ? 'text-amber-400 fill-amber-400' : 'text-red-400 fill-red-400'} />
                        </div>
                      </div>
                      
                      {bike.status === 'AVAILABLE' && (
                        <button 
                          onClick={() => handleOpenReserve(bike.id)}
                          className="w-full bg-black text-white py-2 rounded-xl text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                          Reserve Now
                        </button>
                      )}
                    </div>
                  ))}
                  {(!station.bikes || station.bikes.length === 0) && (
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

      <ReserveModal 
        isOpen={reserveModalOpen} 
        onClose={() => setReserveModalOpen(false)} 
        bikeId={selectedBikeId} 
        onConfirm={executeReservation} 
        user={user} 
      />
      
      <SettlementModal 
        isOpen={settlementModalOpen} 
        onClose={() => setSettlementModalOpen(false)} 
        reservation={selectedReservation} 
        onConfirm={executeSettlement} 
      />
    </div>
  );
}
