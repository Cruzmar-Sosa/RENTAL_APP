'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Station, Bike } from '@/types';
import { toast } from 'sonner';
import { MapPin, Bike as BikeIcon, Zap, ShieldCheck, DollarSign, Activity, Settings2, Play } from 'lucide-react';
import { LoadingScreen } from '@/components/ui/loading-screen';

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { ReserveModal } from '@/components/modals/ReserveModal';
import { SettlementModal } from '@/components/modals/SettlementModal';
import { CheckInModal } from '@/components/modals/CheckInModal';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoaded: authLoaded, isAuthenticated } = useAuthStore();

  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  const [selectedBikeId, setSelectedBikeId] = useState<string | null>(null);

  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
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

  // Real-time Expiration Listener (Guard 4)
  useEffect(() => {
    if (!authLoaded || !user) return;

    const wsUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    const socket = io(`${wsUrl}/tracking`, {
      path: '/socket.io',
      transports: ['websocket'],
    });

    socket.on('reservation_expired', (data: { bikeId: string, reservationId: string }) => {
      console.log('🔔 Reservation Expired Real-time:', data);
      toast.info(`Reservation #${data.reservationId.slice(0,8)} expired and bike was released.`);
      refetch();
      if (user?.role === 'ADMIN') refetchReservations();
    });

    return () => {
      socket.disconnect();
    };
  }, [authLoaded, user, refetch, refetchReservations]);

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
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reserve. This bike might be already active or low battery.');
    }
  };

  const handleOpenCheckIn = (res: any) => {
    setSelectedReservation(res);
    setCheckInModalOpen(true);
  };

  const executeCheckIn = async (id: string, data: any) => {
    try {
      await api.patch(`/reservations/${id}/start`, data);
      toast.success('Ride started!');
      refetch();
      refetchReservations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to start ride.');
    }
  };

  const handleOpenSettlement = (reservation: any) => {
    setSelectedReservation(reservation);
    setSettlementModalOpen(true);
  };

  const executeSettlement = async (id: string, action: string, data?: any) => {
    try {
      await api.patch(`/reservations/${id}/${action}`, data);
      toast.success(action === 'report-incident' ? 'Incident reported successfully' : 'Ride completed and settled!');
      refetch();
      refetchReservations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Action failed.');
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
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {user?.role === 'ADMIN' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-black text-white p-6 rounded-3xl flex flex-col justify-between shadow-xl shadow-black/10 border border-white/10 transition-all hover:scale-[1.02]">
              <h3 className="text-white/40 text-[10px] font-black flex items-center gap-2 uppercase tracking-widest">
                <DollarSign size={14} className="text-emerald-400"/> Revenue
              </h3>
              <p className="text-4xl font-black mt-2 leading-none">${totalRevenue.toFixed(0)}</p>
            </div>
            <div className="bg-white border-2 border-gray-100 p-6 rounded-3xl flex flex-col justify-between transition-all hover:scale-[1.02]">
              <h3 className="text-gray-400 text-[10px] font-black flex items-center gap-2 uppercase tracking-widest">
                <Activity size={14} className="text-emerald-500"/> Active Rides
              </h3>
              <p className="text-4xl font-black mt-2 text-emerald-500 leading-none">{activeRides}</p>
            </div>
            <div className="bg-white border-2 border-gray-100 p-6 rounded-3xl flex flex-col justify-between transition-all hover:scale-[1.02]">
              <h3 className="text-gray-400 text-[10px] font-black flex items-center gap-2 uppercase tracking-widest">
                <Settings2 size={14} className="text-blue-500"/> Reserved
              </h3>
              <p className="text-4xl font-black mt-2 text-blue-500 leading-none">{pendingRides}</p>
            </div>
            <div className="bg-white border-2 border-gray-100 p-6 rounded-3xl flex flex-col justify-between transition-all hover:scale-[1.02]">
              <h3 className="text-gray-400 text-[10px] font-black flex items-center gap-2 uppercase tracking-widest">
                <BikeIcon size={14}/> Available
              </h3>
              <p className="text-4xl font-black mt-2 leading-none">{availableBikesCount}</p>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-100 rounded-[2.5rem] p-8 shadow-sm overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                  <ShieldCheck size={24} className="text-blue-500" /> Operational Control
                </h2>
                <p className="text-gray-400 text-xs font-medium">Manage pending confirmed and active sessions.</p>
              </div>
              <button onClick={() => router.push('/reservations')} className="text-xs font-black uppercase text-blue-600 hover:underline">View All Records</button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Reservation</th>
                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Bicycle</th>
                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {adminReservations?.filter((r: any) => ['PENDING', 'CONFIRMED', 'ACTIVE'].includes(r.status)).map((res: any) => (
                    <tr key={res.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="py-5 font-bold text-gray-400 text-xs">
                        #{res.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="py-5 text-center">
                        <span className="bg-gray-100 px-3 py-1 rounded-lg font-black text-xs text-gray-900">#{res.bike?.code || 'N/A'}</span>
                      </td>
                      <td className="py-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 leading-tight">{res.guestName || res.clientName || res.user?.name || 'No Name'}</span>
                          <span className="text-[10px] text-gray-400 uppercase font-black">{res.user?.email || 'Walk-in Guest'}</span>
                        </div>
                      </td>
                      <td className="py-5 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          res.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                          res.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                          res.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {res.status}
                        </span>
                      </td>
                      <td className="py-5">
                        <div className="flex justify-end gap-2">
                          {res.status === 'CONFIRMED' && (
                            <button 
                              onClick={() => handleOpenCheckIn(res)} 
                              className="bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-1.5"
                            >
                              <Play size={12} fill="currentColor" /> Check-in
                            </button>
                          )}
                          {res.status === 'ACTIVE' && (
                            <button 
                              onClick={() => handleOpenSettlement(res)} 
                              className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                            >
                              Settlement
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!adminReservations || adminReservations.filter((r: any) => ['PENDING', 'CONFIRMED', 'ACTIVE'].includes(r.status)).length === 0) && (
                 <div className="py-10 text-center">
                    <p className="text-gray-400 text-sm font-bold italic">No operational actions pending.</p>
                 </div>
              )}
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
          <div key={station.id} className="group relative bg-white border-2 border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all duration-500 overflow-hidden">
            <div className="absolute top-0 right-0 p-8 text-black/5 group-hover:text-black/10 transition-colors pointer-events-none">
              <MapPin size={140} strokeWidth={1} />
            </div>

            <div className="relative z-10">
              <div className="bg-black text-white w-fit px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                Active Station
              </div>
              <h2 className="text-3xl font-black text-gray-900 group-hover:translate-x-1 transition-transform">{station.name}</h2>
              <div className="flex items-center gap-2 text-gray-400 mt-2 font-bold text-xs uppercase tracking-wider">
                <MapPin size={14} className="text-blue-500" />
                <span>{station.address}</span>
              </div>
              
              <div className="mt-12 space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h3 className="font-black text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <BikeIcon size={16} className="text-black" />
                    Available Fleet
                  </h3>
                  <span className="text-[10px] font-black bg-gray-100 px-3 py-1 rounded-lg uppercase">
                    {station.bikes?.filter(b => b.status === 'AVAILABLE').length || 0} Units
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {station.bikes?.map((bike: Bike) => (
                    <div key={bike.id} className={`p-5 rounded-[1.5rem] flex flex-col gap-4 transition-all duration-300 border-2 ${
                      bike.status === 'AVAILABLE' ? 'bg-gray-50/50 border-gray-100 hover:bg-white hover:border-black' :
                      bike.status === 'RESERVED' ? 'bg-orange-50/30 border-orange-100 opacity-80' :
                      bike.status === 'IN_USE' ? 'bg-emerald-50/30 border-emerald-100 opacity-80' :
                      'bg-red-50/30 border-red-100 opacity-80'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-gray-900 bg-white px-2 py-1 rounded-lg shadow-sm border border-gray-100">#{bike.code || '??'}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${
                            bike.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' :
                            bike.status === 'RESERVED' ? 'bg-orange-100 text-orange-700' :
                            bike.status === 'IN_USE' ? 'bg-blue-100 text-blue-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {bike.status}
                          </span>
                          <Zap size={14} className={bike.batteryLevel && bike.batteryLevel > 20 ? 'text-amber-400 fill-amber-400' : 'text-red-400 fill-red-400'} />
                        </div>
                      </div>
                      
                      {bike.status === 'AVAILABLE' && (
                        <button 
                          onClick={() => handleOpenReserve(bike.id)}
                          className="w-full bg-black text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-black/20"
                        >
                          Reserve Now
                        </button>
                      )}
                    </div>
                  ))}
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

      <CheckInModal 
        isOpen={checkInModalOpen} 
        onClose={() => setCheckInModalOpen(false)} 
        reservation={selectedReservation} 
        onConfirm={executeCheckIn} 
      />
      
      <SettlementModal 
        isOpen={settlementModalOpen} 
        onClose={() => setSettlementModalOpen(false)} 
        reservation={selectedReservation} 
        mode={user?.role === 'ADMIN' ? 'admin' : 'user'}
        onConfirm={executeSettlement} 
      />
    </div>
  );
}
