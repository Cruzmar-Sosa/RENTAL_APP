import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Bike, User, Clock, CreditCard, ShieldCheck, MapPin, 
  Calendar, Info, AlertTriangle, FileText, CheckCircle2, 
  XCircle, Timer, Zap, History, Receipt
} from 'lucide-react';
import { api } from '@/lib/api';
import { Reservation } from '@/types';
import { toast } from 'sonner';

interface ReservationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservationId: string | null;
}

export function ReservationDetailModal({ isOpen, onClose, reservationId }: ReservationDetailModalProps) {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (reservationId && isOpen) {
      fetchDetail();
    }
  }, [reservationId, isOpen]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/reservations/${reservationId}`);
      setReservation(data);
    } catch (error) {
      toast.error('Failed to load reservation details');
    } finally {
      setLoading(false);
    }
  };

  if (!reservation && !loading) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-blue-100 text-blue-700';
      case 'CONFIRMED': return 'bg-emerald-100 text-emerald-700';
      case 'COMPLETED': return 'bg-gray-100 text-gray-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      case 'PENDING': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const clientName = reservation?.guestName || reservation?.clientName || reservation?.user?.name || 'Unknown';
  const clientEmail = reservation?.user?.email || 'Walk-in Guest';
  const clientDoc = reservation?.guestDocument || reservation?.user?.documentNumber || 'N/A';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-white rounded-[2.5rem] p-0 border-0 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent" />
            <p className="font-bold text-gray-500">Loading master records...</p>
          </div>
        ) : reservation && (
          <div className="flex flex-col">
            {/* Header Branding */}
            <div className={`p-10 text-white flex justify-between items-end ${getStatusColor(reservation.status).split(' ')[0] === 'bg-gray-100' ? 'bg-gray-900' : reservation.status === 'ACTIVE' ? 'bg-blue-600' : reservation.status === 'CONFIRMED' ? 'bg-emerald-600' : 'bg-black'}`}>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-3 rounded-2xl">
                    <Receipt size={28} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black">Reservation Detail</h2>
                    <p className="text-white/60 font-medium text-sm">Ref: {reservation.id}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                   <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/20 text-white`}>
                    {reservation.status}
                  </span>
                   <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-black/20 text-white">
                    {new Date(reservation.startTime).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase text-white/40 mb-1">Total Estimated</p>
                <p className="text-5xl font-black">${reservation.priceEstimated?.toFixed(2)}</p>
              </div>
            </div>

            <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-10">
              {/* Column 1: Client & Bike */}
              <div className="space-y-8">
                <section>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <User size={14} /> Client Identity
                  </h3>
                  <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center font-black text-xl">
                        {clientName.charAt(0)}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-gray-900 truncate">{clientName}</p>
                        <p className="text-xs text-gray-500 truncate">{clientEmail}</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-200 grid grid-cols-1 gap-2">
                       <p className="text-xs font-bold text-gray-600">Document: <span className="text-gray-900">{clientDoc}</span></p>
                       <p className="text-xs font-bold text-gray-600">Phone: <span className="text-gray-900">{reservation.guestPhone || reservation.clientPhone || reservation.user?.phone || 'N/A'}</span></p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Bike size={14} /> Vehicle Information
                  </h3>
                  <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-600">Bike Code</span>
                      <span className="font-black text-gray-900">#{reservation.bike?.code || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-600">Current Status</span>
                      <span className="px-2 py-0.5 rounded-lg bg-white text-[10px] font-black shadow-sm uppercase">{reservation.bike?.status}</span>
                    </div>
                    {reservation.bikeCondition && (
                       <div className="pt-4 border-t border-gray-200">
                          <p className="text-xs font-black text-gray-400 uppercase mb-1">Check-in Condition</p>
                          <p className="text-sm font-bold text-orange-600">{reservation.bikeCondition}</p>
                          <p className="text-xs text-gray-500 italic mt-1">"{reservation.bikeNotes || 'No notes provided'}"</p>
                       </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Column 2: Timeline & Duration */}
              <div className="space-y-8">
                <section>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Timer size={14} /> Timeline & Duration
                  </h3>
                  <div className="relative pl-6 border-l-2 border-gray-100 space-y-8">
                    {/* Created */}
                    <div className="relative">
                      <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white ring-1 ring-emerald-500" />
                      <p className="text-[10px] font-black text-gray-400 uppercase">Created</p>
                      <p className="text-sm font-bold text-gray-900">{new Date(reservation.startTime).toLocaleString()}</p>
                    </div>
                    {/* Actual Start */}
                    {reservation.actualStart && (
                      <div className="relative">
                        <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white ring-1 ring-blue-500" />
                        <p className="text-[10px] font-black text-gray-400 uppercase">Ride Started</p>
                        <p className="text-sm font-bold text-gray-900">{new Date(reservation.actualStart).toLocaleString()}</p>
                      </div>
                    )}
                    {/* Actual End */}
                    {reservation.actualEnd && (
                      <div className="relative">
                        <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-gray-900 border-4 border-white ring-1 ring-gray-900" />
                        <p className="text-[10px] font-black text-gray-400 uppercase">Ride Completed</p>
                        <p className="text-sm font-bold text-gray-900">{new Date(reservation.actualEnd).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                  
                  {reservation.incidentType && (
                    <div className="mt-6 p-5 bg-red-50 border border-red-100 rounded-3xl">
                       <h4 className="text-xs font-black text-red-600 uppercase mb-2 flex items-center gap-2">
                          <AlertTriangle size={14} /> Reported Incident
                       </h4>
                       <p className="text-sm font-bold text-red-900">{reservation.incidentType}</p>
                       <p className="text-xs text-red-700 mt-1">{reservation.incidentNotes}</p>
                    </div>
                  )}
                </section>

                <section>
                   <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Info size={14} /> Financial Audit
                  </h3>
                  <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 space-y-3">
                     <div className="flex justify-between text-xs font-bold text-gray-500">
                        <span>Rate per Hour</span>
                        <span className="text-gray-900">${reservation.ratePerHour}/hr</span>
                     </div>
                     <div className="flex justify-between text-xs font-bold text-gray-500">
                        <span>Extras Total</span>
                        <span className="text-gray-900">${reservation.extrasTotal?.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between text-xs font-bold text-gray-500 pt-2 border-t border-gray-200">
                        <span>Estimated Total</span>
                        <span className="text-gray-900 font-black">${reservation.priceEstimated?.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between text-xs font-bold text-gray-500">
                        <span>Actual Total</span>
                        <span className="text-emerald-600 font-black">${reservation.priceActual?.toFixed(2) || '---'}</span>
                     </div>
                  </div>
                </section>
              </div>

              {/* Column 3: Payments */}
              <div className="space-y-8">
                <section>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <History size={14} /> Payment Ledger
                  </h3>
                  <div className="space-y-3">
                    {reservation.payments && reservation.payments.length > 0 ? (
                      reservation.payments.map((p) => (
                        <div key={p.id} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-2">
                           <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black bg-gray-100 px-2 py-0.5 rounded-lg uppercase text-gray-500">{p.type}</span>
                              <span className={`text-[10px] font-black uppercase ${p.status === 'PAID' ? 'text-emerald-600' : 'text-orange-600'}`}>
                                {p.status}
                              </span>
                           </div>
                           <div className="flex justify-between items-end">
                              <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</p>
                              <p className="text-lg font-black">${p.amount.toFixed(2)}</p>
                           </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed">
                        <p className="text-xs font-bold text-gray-400">No payment records found.</p>
                      </div>
                    )}
                  </div>
                </section>

                <div className="p-6 bg-black text-white rounded-3xl space-y-4">
                   <p className="text-[10px] font-black uppercase text-white/40">Business Snapshot</p>
                   {reservation.status === 'ACTIVE' ? (
                      <div className="flex items-center gap-3">
                         <Zap className="text-yellow-400 animate-pulse" size={20} />
                         <p className="text-xs font-bold text-white/90">Revenue stream active</p>
                      </div>
                   ) : reservation.status === 'COMPLETED' ? (
                      <div className="flex items-center gap-3">
                         <CheckCircle2 className="text-emerald-400" size={20} />
                         <p className="text-xs font-bold text-white/90">Full lifecycle finalized</p>
                      </div>
                   ) : (
                      <div className="flex items-center gap-3">
                         <AlertTriangle className="text-orange-400" size={20} />
                         <p className="text-xs font-bold text-white/90">Awaiting status update</p>
                      </div>
                   )}
                   <Button onClick={onClose} className="w-full bg-white/10 hover:bg-white/20 text-white rounded-xl h-10 font-bold text-xs">
                      Close Master View
                   </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
