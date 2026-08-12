'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Bike, Station } from '@/types';
import { BikeCardPremium } from '@/components/bikes/BikeCardPremium';
import { CheckoutModal } from '@/components/CheckoutModal';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Search, Filter, MapPin, Zap, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CustomerBikesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [stationFilter, setStationFilter] = useState<string>('ALL');
  const [selectedBike, setSelectedBike] = useState<Bike | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const [isReserving, setIsReserving] = useState(false);

  // Fetch Available Bikes
  const { data: bikes, isLoading: isBikesLoading } = useQuery<Bike[]>({
    queryKey: ['available-bikes'],
    queryFn: async () => (await api.get('/bikes/available')).data,
  });

  // Fetch Stations
  const { data: stations, isLoading: isStationsLoading } = useQuery<Station[]>({
    queryKey: ['stations'],
    queryFn: async () => (await api.get('/stations')).data,
  });

  const filteredBikes = useMemo(() => {
    if (!bikes) return [];
    return bikes.filter((bike) => {
      const matchesSearch =
        bike.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(bike.code).includes(searchTerm);

      const matchesStation =
        stationFilter === 'ALL' || bike.stationId === stationFilter;

      return matchesSearch && matchesStation;
    });
  }, [bikes, searchTerm, stationFilter]);

  if (isBikesLoading || isStationsLoading) {
    return <LoadingScreen message="Cargando flota disponible..." />;
  }

  const handleReserveClick = (bike: Bike) => {
    setSelectedBike(bike);
    setCheckoutOpen(true);
  };

  const handleConfirmReservation = async (paymentDetails: any) => {
    if (!selectedBike) return;
    setIsReserving(true);
    try {
      await api.post('/reservations', {
        bikeId: selectedBike.id,
        paymentOption: paymentDetails.paymentMethod === 'deposit' ? 'DEPOSIT' : 'FULL',
      });
      setCheckoutOpen(false);
      window.location.href = '/my-rides';
    } catch (err: any) {
      console.error('Failed to create reservation', err);
      alert(err?.response?.data?.message || 'Error al crear la reserva');
    } finally {
      setIsReserving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-8">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-linear-to-r from-teal-900 to-emerald-900 p-8 md:p-12 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
        <div className="space-y-3 z-10 max-w-xl">
          <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest text-teal-300">
            Reserva Web Customer
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Reserva tu Bicicleta Ecológica
          </h1>
          <p className="text-teal-100 text-sm md:text-base font-medium">
            Selecciona tu unidad, elige tu modalid de pago y obtén tu PIN de check-in para retirar en estación.
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-4 z-10">
          <div className="p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 text-center">
            <span className="block text-3xl font-black">{bikes?.length || 0}</span>
            <span className="text-[10px] uppercase font-bold text-teal-200">Disponibles</span>
          </div>
          <div className="p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 text-center">
            <span className="block text-3xl font-black">${bikes?.[0]?.depositRequired ? '10' : '0'}</span>
            <span className="text-[10px] uppercase font-bold text-teal-200">Depósito Requerido</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por modelo o código de bicicleta..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-black transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter size={18} className="text-gray-400 shrink-0" />
          <select
            className="w-full sm:w-auto px-4 py-3 bg-gray-50 rounded-xl text-sm font-bold text-gray-700 outline-none cursor-pointer border-none"
            value={stationFilter}
            onChange={(e) => setStationFilter(e.target.value)}
          >
            <option value="ALL">Todas las Estaciones</option>
            {stations?.map((s) => (
              <option key={s.id} value={s.id}>
                📍 {s.name} ({s.bikes?.length || 0} bicis)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bike Grid */}
      {filteredBikes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBikes.map((bike) => (
            <motion.div
              key={bike.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <BikeCardPremium
                bike={bike}
                onReserve={(b) => handleReserveClick(b)}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-[2rem] border border-dashed border-gray-200 space-y-3">
          <p className="text-gray-400 text-lg font-bold">No se encontraron bicicletas disponibles.</p>
          <p className="text-xs text-gray-400">Intenta cambiar los filtros de búsqueda o estación.</p>
        </div>
      )}

      {/* Reservation Checkout Modal */}
      {selectedBike && (
        <CheckoutModal
          isOpen={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          bike={selectedBike}
          onConfirm={handleConfirmReservation}
          isLoading={isReserving}
        />
      )}
    </div>
  );
}
