'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Reservation } from '@/types';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { getPresentationState } from '@/utils/states';
import { fmtReservation, fmtBike } from '@/lib/businessCode';
import { formatCurrency } from '@/lib/financial';
import { CalendarRange, Key, Clock, ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function CustomerMyRidesPage() {
  const [selectedPinRes, setSelectedPinRes] = useState<Reservation | null>(null);
  const [pinCode, setPinCode] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);

  const { data: reservations, isLoading } = useQuery<Reservation[]>({
    queryKey: ['my-reservations'],
    queryFn: async () => (await api.get('/reservations/my')).data,
  });

  if (isLoading) {
    return <LoadingScreen message="Cargando tu historial de alquileres..." />;
  }

  const handleFetchPin = async (res: Reservation) => {
    setSelectedPinRes(res);
    setPinLoading(true);
    try {
      const response = await api.post(`/reservations/${res.id}/generate-pin`);
      setPinCode(response.data.pin || response.data.maskedPin);
    } catch {
      setPinCode('----');
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Mis Alquileres</h1>
        <p className="text-gray-500 font-medium mt-1 text-sm">
          Gestiona tus reservas, consulta tu PIN de check-in y efectúa la liquidación final de tus viajes.
        </p>
      </div>

      {reservations && reservations.length > 0 ? (
        <div className="space-y-4">
          {reservations.map((res) => {
            const stateConfig = getPresentationState(res.status);
            const StateIcon = stateConfig.icon;

            return (
              <motion.div
                key={res.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-gray-200 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-gray-900">
                      {res.code ? fmtReservation(res.code) : `#${res.id.slice(0, 6)}`}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${stateConfig.color}`}>
                      <StateIcon size={14} />
                      {stateConfig.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500">
                    <span>🚲 Bici #{res.bike?.code || 'N/A'} ({res.bike?.model || 'Estándar'})</span>
                    <span>•</span>
                    <span>📅 {new Date(res.startTime).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>💰 Est. ${formatCurrency(res.priceEstimated)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {res.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleFetchPin(res)}
                      className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs"
                    >
                      <Key size={14} />
                      Ver PIN Check-in
                    </button>
                  )}

                  {res.status === 'SETTLEMENT_PENDING' && (
                    <Link
                      href={`/settlement/${res.id}`}
                      className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs"
                    >
                      💳 Pagar Saldo
                    </Link>
                  )}

                  {res.status === 'CHECKED_IN' && (
                    <div className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-100">
                      🔓 Listo en estación
                    </div>
                  )}

                  {res.status === 'ACTIVE' && (
                    <div className="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-100 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Ride en progreso
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-[2.5rem] border border-dashed border-gray-200 space-y-4">
          <CalendarRange size={48} className="mx-auto text-gray-300" />
          <p className="text-gray-500 font-bold text-lg">Aún no tienes ningún alquiler registrado.</p>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-105 transition"
          >
            Reservar una Bicicleta <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* PIN Modal */}
      {selectedPinRes && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full space-y-6 text-center shadow-2xl">
            <div className="w-14 h-14 bg-teal-50 text-teal-700 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldCheck size={28} />
            </div>

            <div>
              <h3 className="text-xl font-black text-gray-900">PIN de Check-in</h3>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                Muestra este código de 4 dígitos al operador de la estación para retirar la bici #{selectedPinRes.bike?.code || 'N/A'}.
              </p>
            </div>

            <div className="p-6 bg-teal-50 border-2 border-teal-200 rounded-2xl">
              <span className="block text-xs font-bold text-teal-800 uppercase tracking-widest mb-1">
                CÓDIGO DE VERIFICACIÓN
              </span>
              <span className="text-4xl font-black text-teal-900 tracking-[0.25em]">
                {pinLoading ? '...' : pinCode}
              </span>
            </div>

            <button
              onClick={() => { setSelectedPinRes(null); setPinCode(null); }}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
