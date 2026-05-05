import { useState, useEffect } from 'react';
import { AppModal } from '@/components/ui/app-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Clock, Calculator, User, AlertCircle, Timer, Zap, History, DollarSign, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Reservation } from '@/types';
import { cn } from '@/lib/utils';

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  onConfirm: (id: string, action: string, data?: any) => Promise<void>;
}

export function SettlementModal({ isOpen, onClose, reservation, onConfirm }: SettlementModalProps) {
  const [loading, setLoading] = useState(false);
  const [actualDays, setActualDays] = useState(0);
  const [actualHours, setActualHours] = useState(0);
  const [incidentType, setIncidentType] = useState('NONE');
  const [incidentNotes, setIncidentNotes] = useState('');

  useEffect(() => {
    if (reservation && isOpen) {
      const actualStart = new Date(reservation.actualStart || reservation.startTime);
      const now = new Date();
      const diffMs = now.getTime() - actualStart.getTime();
      const diffHrsTotal = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));

      setActualDays(Math.floor(diffHrsTotal / 24));
      setActualHours(diffHrsTotal % 24);
      setIncidentType('NONE');
      setIncidentNotes('');
    }
  }, [reservation, isOpen]);

  if (!reservation) return null;

  const rate = reservation.ratePerHour || 50;
  const estDuration = Math.ceil((new Date(reservation.endTime || '').getTime() - new Date(reservation.startTime).getTime()) / 3600000);
  const realDuration = (actualDays * 24) + actualHours;
  const diffDuration = realDuration - estDuration;

  // Real Cost Calculation
  const realCost = (realDuration * rate) + (reservation.extrasTotal || 0);
  const amountPaid = reservation.payments
    ?.filter(p => p.status === 'PAID')
    .reduce((acc, p) => acc + (p.type === 'REFUND' ? -p.amount : p.amount), 0) || 0;
  const balance = realCost - amountPaid;

  const handleComplete = async () => {
    setLoading(true);
    try {
      const actualStart = new Date(reservation.actualStart || reservation.startTime);
      const actualEnd = new Date(actualStart.getTime() + (realDuration * 60 * 60 * 1000));

      await onConfirm(reservation.id, 'complete', {
        balance,
        priceActual: realCost,
        actualEnd: actualEnd.toISOString(),
        incidentType: incidentType !== 'NONE' ? incidentType : null,
        incidentNotes: incidentType !== 'NONE' ? incidentNotes : null,
      });
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete ride.');
    } finally {
      setLoading(false);
    }
  };

  const clientName = reservation.guestName || reservation.clientName || reservation.user?.name || 'Unknown';

  const modalTitle = (
    <div className="flex items-center gap-4">
      <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-100">
        <CheckCircle2 size={24} />
      </div>
      <div>
        <h2 className="text-2xl font-black tracking-tight text-gray-900">Ride Settlement</h2>
        <p className="text-sm text-gray-500 font-medium tracking-normal uppercase tracking-widest text-[10px]">Review & Finalize Financials</p>
      </div>
    </div>
  );

  const modalFooter = (
    <div className="flex flex-col sm:flex-row gap-4 w-full">
      <Button variant="outline" onClick={onClose} className="h-14 sm:h-16 rounded-2xl flex-1 border-2 font-bold text-base">
        Cancel
      </Button>
      <Button 
        onClick={handleComplete} 
        disabled={loading || realDuration < 0}
        className={cn(
          "h-14 sm:h-16 rounded-2xl flex-[2] font-black transition-all flex items-center justify-center gap-2 text-base",
          "bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-[1.01] active:scale-95 shadow-xl shadow-emerald-100"
        )}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
        ) : (
          <ShieldCheck size={20} />
        )}
        Confirm & Close Ride
      </Button>
    </div>
  );

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="xl"
      footer={modalFooter}
    >
      <div className="space-y-10 max-w-5xl mx-auto">
        {/* Top Stats: Duration Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Estimated', value: `${estDuration}h`, icon: Clock, color: 'text-gray-400' },
            { label: 'Actual Usage', value: `${realDuration}h`, icon: Timer, color: 'text-emerald-600' },
            { 
              label: 'Difference', 
              value: diffDuration > 0 ? `+${diffDuration}h` : `${diffDuration}h`, 
              icon: History, 
              color: diffDuration > 0 ? 'text-orange-500' : 'text-blue-500' 
            },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border-2 border-gray-100 flex items-center gap-4 shadow-sm group hover:border-black transition-all">
              <div className={cn("p-3 rounded-xl bg-gray-50 transition-colors group-hover:bg-black group-hover:text-white", stat.color)}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-xl font-black text-gray-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left Column: Financial Card */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 ml-2">
              <DollarSign size={20} className="text-emerald-600" />
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Financial Summary</h3>
            </div>

            <div className="bg-black text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Calculator size={140} />
              </div>
              
              <div className="grid grid-cols-2 gap-y-8 relative">
                <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Total Actual Cost</p>
                  <p className="text-3xl font-black">${realCost.toFixed(2)}</p>
                  <p className="text-[10px] text-white/30 font-medium mt-1">Reflects {realDuration}h usage</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Amount Already Paid</p>
                  <p className="text-3xl font-black text-emerald-400">${amountPaid.toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-white/10 relative">
                <div className={cn(
                  "flex justify-between items-center p-6 rounded-3xl",
                  balance > 0 ? "bg-orange-500/10 border border-orange-500/20" : "bg-emerald-500/10 border border-emerald-500/20"
                )}>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Final Balance</p>
                    <p className="text-4xl font-black">
                      ${Math.abs(balance).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-xs font-black uppercase px-3 py-1 rounded-full",
                      balance > 0 ? "bg-orange-500 text-white" : "bg-emerald-500 text-white"
                    )}>
                      {balance > 0 ? "Pending Payment" : balance < 0 ? "Refund Due" : "Settled"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Adjust Duration */}
            <div className="bg-gray-50 p-8 rounded-[2.5rem] border-2 border-gray-100 space-y-6">
              <div className="flex items-center gap-3">
                <Timer size={18} className="text-blue-500" />
                <h4 className="text-sm font-black text-gray-900 uppercase">Override billable time</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative group">
                  <label className="absolute left-5 top-3 text-[9px] font-black text-gray-400 uppercase tracking-widest group-focus-within:text-black transition-colors">Days</label>
                  <Input 
                    type="number" min="0" 
                    className="h-20 pt-8 rounded-2xl bg-white border-2 border-transparent focus:border-black font-black text-2xl transition-all shadow-sm"
                    value={actualDays} onChange={e => setActualDays(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="relative group">
                  <label className="absolute left-5 top-3 text-[9px] font-black text-gray-400 uppercase tracking-widest group-focus-within:text-black transition-colors">Hours</label>
                  <Input 
                    type="number" min="0" max="23"
                    className="h-20 pt-8 rounded-2xl bg-white border-2 border-transparent focus:border-black font-black text-2xl transition-all shadow-sm"
                    value={actualHours} onChange={e => setActualHours(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Incidents & Validation */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 ml-2">
              <History size={20} className="text-blue-600" />
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Incidents & Notes</h3>
            </div>

            <div className="space-y-6 bg-white p-8 rounded-[2.5rem] border-2 border-gray-100 shadow-sm">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reporting Category</label>
                <Select value={incidentType} onValueChange={(val) => setIncidentType(val || 'NONE')}>
                  <SelectTrigger className="h-16 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-black text-sm font-bold">
                    <SelectValue placeholder="No incidents recorded" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-2">
                    <SelectItem value="NONE" className="font-bold">None (Standard Return)</SelectItem>
                    <SelectItem value="MECHANICAL" className="font-bold">Mechanical Failure (Bike Issue)</SelectItem>
                    <SelectItem value="TECHNICAL" className="font-bold">Technical Error (App/System)</SelectItem>
                    <SelectItem value="OTHER" className="font-bold">Other Reason</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Justification / Detail</label>
                <textarea
                  placeholder={incidentType === 'NONE' ? "Optional notes about the return..." : "Please describe the incident in detail to justify balance adjustments or refunds..."}
                  className={cn(
                    "w-full h-40 p-6 rounded-[2rem] border-2 outline-none transition-all text-sm font-medium resize-none",
                    incidentType !== 'NONE' ? "bg-blue-50/50 border-blue-200 focus:border-blue-500" : "bg-gray-50 border-gray-100 focus:border-black"
                  )}
                  value={incidentNotes}
                  onChange={e => setIncidentNotes(e.target.value)}
                />
              </div>
            </div>

            {balance < 0 && incidentType === 'NONE' && (
              <div className="bg-amber-50 border-2 border-amber-100 p-6 rounded-[2rem] flex gap-5 items-start animate-in slide-in-from-bottom-4">
                <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl shadow-sm">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <p className="text-sm font-black text-amber-900 uppercase tracking-widest mb-1">Business Policy Warning</p>
                  <p className="text-xs text-amber-800 font-bold leading-relaxed">
                    Early returns without a reported incident do not trigger automatic refunds. 
                    <br /><br />
                    To issue a refund, please select an <span className="underline">Incident Category</span> and provide justification.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-[2rem] border-2 border-gray-100 border-dashed">
              <div className="bg-black text-white w-12 h-12 rounded-xl flex items-center justify-center font-black shadow-lg">
                {clientName.charAt(0)}
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Acknowledged by Client</p>
                <p className="font-bold text-gray-900">{clientName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppModal>
  );
}
