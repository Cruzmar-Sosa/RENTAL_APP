"use client";

import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/button';
import { 
  Bike, User, Clock, CreditCard, ShieldCheck, MapPin, 
  Calendar, Info, AlertTriangle, FileText, CheckCircle2, 
  XCircle, Timer, Zap, History, Receipt, DollarSign,
  UserCheck, ClipboardList, Wallet
} from 'lucide-react';
import { api } from '@/lib/api';
import { Reservation } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatNIDate } from '@/lib/dateUtils';
import { normalizeReservation } from '@/lib/financial-adapters';
import { formatCurrency, safeCurrency } from '@/lib/financial';
import { getBikeImageUrl } from '@/lib/storageUtils';

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
    } else if (!isOpen) {
      setReservation(null); // Clear when closing
    }
  }, [reservationId, isOpen]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/reservations/${reservationId}`);
      setReservation(normalizeReservation(data));
    } catch (error) {
      toast.error('Failed to load reservation details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-blue-600 text-white';
      case 'CONFIRMED': return 'bg-emerald-600 text-white';
      case 'COMPLETED': return 'bg-gray-900 text-white';
      case 'CANCELLED': return 'bg-red-600 text-white';
      case 'PENDING': return 'bg-orange-600 text-white';
      default: return 'bg-black text-white';
    }
  };

  const amountPaid = reservation?.payments
    ?.filter(p => p.status === 'PAID')
    .reduce((acc, p) => acc + (p.type === 'REFUND' ? -safeCurrency(p.amount) : safeCurrency(p.amount)), 0) || 0;
  
  const amountPending = reservation?.payments
    ?.filter(p => p.status === 'PENDING')
    .reduce((acc, p) => acc + safeCurrency(p.amount), 0) || 0;

  const finalTotal = safeCurrency(reservation?.priceActual || reservation?.priceEstimated || 0);

  const clientName = reservation?.guestName || reservation?.clientName || reservation?.user?.name || 'Unknown';
  const clientEmail = reservation?.user?.email || 'Walk-in Guest';
  const clientDoc = reservation?.guestDocument || reservation?.user?.documentNumber || 'N/A';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      showFooter={false}
      className="max-w-6xl"
    >
      {reservation && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full mb-10">
          <div className="flex items-center gap-4">
            <div className={cn("p-3 rounded-2xl shadow-lg", getStatusStyle(reservation.status))}>
              <Receipt size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-gray-900">Master Reservation Record</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Ref: {reservation.id.slice(0, 8)}...</span>
                <div className="w-1 h-1 rounded-full bg-gray-300" />
                <span className={cn(
                  "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest",
                  reservation.status === 'ACTIVE' ? 'bg-blue-100 text-blue-600' :
                  reservation.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-600' :
                  'bg-gray-100 text-gray-600'
                )}>
                  {reservation.status}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right bg-gray-50 px-6 py-3 rounded-2xl border-2 border-gray-100">
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Financial State</p>
            <p className="text-2xl font-black text-black">${formatCurrency(finalTotal)}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-20 flex flex-col items-center justify-center gap-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-100 border-t-black" />
            <Receipt className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-300" size={24} />
          </div>
          <div className="text-center">
            <p className="font-black text-gray-900 text-lg">Retrieving Master Records</p>
            <p className="text-sm text-gray-500 font-medium">Synchronizing latest ledger state...</p>
          </div>
        </div>
      ) : reservation ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Column 1: Client & Unit */}
          <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] border-2 border-gray-100 p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <UserCheck size={18} />
                </div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Client Identity</h3>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-[1.5rem] bg-black text-white flex items-center justify-center font-black text-2xl shadow-xl">
                  {clientName.charAt(0)}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xl font-black text-gray-900 truncate leading-tight">{clientName}</p>
                  <p className="text-sm text-gray-500 font-bold truncate opacity-60">{clientEmail}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-4 border-t-2 border-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-400 uppercase">Document</span>
                  <span className="text-sm font-bold text-gray-900">{clientDoc}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-400 uppercase">Phone</span>
                  <span className="text-sm font-bold text-gray-900">{reservation.guestPhone || reservation.clientPhone || reservation.user?.phone || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border-2 border-gray-100 p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Bike size={18} />
                </div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Unit Information</h3>
              </div>
              
              {getBikeImageUrl(reservation.bike ?? {}) && (
                <div className="w-full aspect-video rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getBikeImageUrl(reservation.bike ?? {})!} alt="bike" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Assigned Code</p>
                  <p className="text-2xl font-black text-black">#{reservation.bike?.code || 'N/A'}</p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-gray-100 text-[10px] font-black uppercase text-gray-500 border border-gray-200">
                  {reservation.bike?.status}
                </span>
              </div>

              {reservation.bikeCondition && (
                <div className="pt-4 border-t-2 border-gray-50 bg-orange-50/50 -mx-6 px-6 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={14} className="text-orange-600" />
                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Condition Report</p>
                  </div>
                  <p className="text-sm font-black text-orange-950 mb-1">{reservation.bikeCondition}</p>
                  <p className="text-xs text-orange-800 font-medium italic opacity-80 leading-relaxed">"{reservation.bikeNotes || 'No additional notes provided'}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Timeline & Incidents */}
          <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] border-2 border-gray-100 p-8 shadow-sm space-y-8 relative overflow-hidden">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <History size={18} />
                </div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Operational Timeline</h3>
              </div>
              
              <div className="relative pl-8 space-y-10">
                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-100" />
                
                {[
                  { label: 'Reservation Created', time: reservation.createdAt, icon: Calendar, color: 'bg-emerald-500' },
                  { label: 'Check-in (Ride Start)', time: reservation.actualStart, icon: Zap, color: 'bg-blue-500', hide: !reservation.actualStart },
                  { label: 'Settlement (Ride End)', time: reservation.actualEnd, icon: ShieldCheck, color: 'bg-gray-900', hide: !reservation.actualEnd },
                ].filter(t => !t.hide).map((item, idx) => (
                  <div key={idx} className="relative group">
                    <div className={cn(
                      "absolute -left-[27px] top-0 w-6 h-6 rounded-full border-4 border-white ring-2 ring-gray-50 flex items-center justify-center text-white transition-transform group-hover:scale-110 shadow-sm",
                      item.color
                    )}>
                      <item.icon size={10} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{item.label}</p>
                      <p className="text-sm font-black text-gray-900">{formatNIDate(item.time!)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {reservation.incidentType && (
                <div className="mt-8 p-6 bg-red-50 border-2 border-red-100 rounded-[2rem] shadow-sm animate-in zoom-in-95">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-red-600 text-white rounded-lg">
                      <AlertTriangle size={14} />
                    </div>
                    <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest">Active Incident Record</h4>
                  </div>
                  <p className="text-lg font-black text-red-950 mb-1">{reservation.incidentType}</p>
                  <p className="text-xs text-red-800 font-bold leading-relaxed opacity-70 italic">"{reservation.incidentNotes}"</p>
                </div>
              )}
            </div>

            <div className="bg-gray-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Receipt size={100} />
              </div>
              <div className="relative">
                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-6">Financial Ledger Audit</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white/50">Initial Estimate</span>
                    <span className="font-black text-white">${formatCurrency(reservation.priceEstimated)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white/50">Settled Actual Cost</span>
                    <span className="font-black text-white">${formatCurrency(reservation.priceActual) || '---'}</span>
                  </div>
                  <div className="h-px bg-white/10 my-4" />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-black uppercase text-white/50">Total Paid</span>
                    </div>
                    <span className="text-xl font-black text-emerald-400">${formatCurrency(amountPaid)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <span className="text-[10px] font-black uppercase text-white/50">Pending</span>
                    </div>
                    <span className="text-xl font-black text-orange-400">${formatCurrency(amountPending)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Payment History */}
          <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] border-2 border-gray-100 p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Wallet size={18} />
                </div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Payment Ledger</h3>
              </div>

              <div className="space-y-4">
                {reservation.payments && reservation.payments.length > 0 ? (
                  reservation.payments.map((p) => (
                    <div key={p.id} className="p-5 bg-gray-50/50 border-2 border-gray-50 rounded-3xl group hover:border-black hover:bg-white transition-all shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black bg-white px-2 py-1 rounded-lg uppercase text-gray-500 border border-gray-100 shadow-sm">{p.type}</span>
                        <div className={cn(
                          "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest",
                          p.status === 'PAID' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
                        )}>
                          {p.status}
                        </div>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Transaction Date</p>
                          <p className="text-xs font-black text-gray-900">{formatNIDate(p.createdAt)}</p>
                        </div>
                        <p className={cn(
                          "text-2xl font-black tracking-tight",
                          p.type === 'REFUND' ? 'text-red-600' : 'text-gray-900'
                        )}>
                          {p.type === 'REFUND' ? '-' : ''}${formatCurrency(p.amount)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center bg-gray-50/50 rounded-3xl border-2 border-gray-50 border-dashed">
                    <Receipt size={32} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No transactions found</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-1.5 bg-gray-100 rounded-[2rem]">
               <div className="bg-white p-6 rounded-[1.75rem] shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-900 text-white p-3 rounded-2xl">
                      <ClipboardList size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Compliance Status</p>
                      <p className="text-sm font-black text-gray-900">Validated for Audit</p>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Unified Action Footer */}
      <div className="flex justify-end w-full pt-8 mt-10 border-t-2 border-gray-50">
        <Button 
          onClick={onClose} 
          className="h-14 px-10 rounded-2xl font-black bg-black text-white hover:scale-[1.02] active:scale-95 transition-all text-base shadow-xl"
        >
          Close View Record
        </Button>
      </div>
    </BaseModal>
  );
}
