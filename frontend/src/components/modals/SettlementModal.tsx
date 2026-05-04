import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Clock, Calculator, User, AlertCircle, Timer, Zap, History } from 'lucide-react';
import { toast } from 'sonner';
import { Reservation } from '@/types';

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

  const realCost = (realDuration * rate) + (reservation.extrasTotal || 0);
  const amountPaid = reservation.payments?.reduce((acc, p) => acc + (p.status === 'PAID' ? p.amount : 0), 0) || 0;
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
    } catch (error) {
      toast.error('Failed to complete ride.');
    } finally {
      setLoading(false);
    }
  };

  const clientName = reservation.guestName || reservation.clientName || reservation.user?.name || 'Unknown';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-white rounded-[2rem] p-0 border-0 shadow-2xl overflow-hidden">
        {/* Header Section */}
        <div className="bg-emerald-600 p-8 text-white">
          <div className="flex justify-between items-center mb-6">
            <DialogTitle className="text-2xl font-black flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <CheckCircle2 size={24} />
              </div>
              Ride Settlement
            </DialogTitle>
            <div className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              Review & Finish
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 bg-black/20 p-4 rounded-2xl">
            <div className="text-center">
              <p className="text-[10px] font-black text-white/50 uppercase">Estimated</p>
              <p className="text-lg font-black">{estDuration}h</p>
            </div>
            <div className="text-center border-x border-white/10">
              <p className="text-[10px] font-black text-white/50 uppercase">Real Used</p>
              <p className="text-lg font-black">{realDuration}h</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-white/50 uppercase">Difference</p>
              <p className={`text-lg font-black ${diffDuration > 0 ? 'text-orange-300' : 'text-emerald-300'}`}>
                {diffDuration > 0 ? `+${diffDuration}h` : `${diffDuration}h`}
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* User Info Snapshot */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="bg-black text-white w-10 h-10 rounded-xl flex items-center justify-center font-black">
              {clientName.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Client</p>
              <p className="font-bold text-gray-900">{clientName}</p>
            </div>
          </div>

          {/* Time Editing */}
          <div className="space-y-3">
            <p className="text-xs font-black text-gray-500 uppercase ml-1 flex items-center gap-2">
              <Timer size={14} className="text-emerald-600" /> Billed Duration (Adjustable)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="absolute left-4 top-2 text-[8px] font-black text-gray-400 uppercase">Days</label>
                <Input 
                  type="number" min="0" 
                  className="h-14 pt-6 rounded-2xl bg-gray-50 font-bold text-lg"
                  value={actualDays} onChange={e => setActualDays(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="relative">
                <label className="absolute left-4 top-2 text-[8px] font-black text-gray-400 uppercase">Hours</label>
                <Input 
                  type="number" min="0" max="23"
                  className="h-14 pt-6 rounded-2xl bg-gray-50 font-bold text-lg"
                  value={actualHours} onChange={e => setActualHours(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="bg-white border-2 border-gray-100 rounded-[2rem] overflow-hidden shadow-sm">
            <div className="p-5 space-y-3">
              <div className="flex justify-between text-sm font-bold text-gray-500">
                <span>Calculated Cost ({realDuration}h)</span>
                <span className="text-gray-900">${realCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-500">
                <span>Already Paid</span>
                <span className="text-emerald-600">-${amountPaid.toFixed(2)}</span>
              </div>
            </div>
            <div className={`p-5 flex justify-between items-center ${balance > 0 ? 'bg-orange-50 border-t-2 border-orange-100' : 'bg-emerald-50 border-t-2 border-emerald-100'}`}>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400">Final Balance</p>
                <p className={`text-2xl font-black ${balance > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                  {balance > 0 ? `Pay: $${balance.toFixed(2)}` : balance < 0 ? `Refund: $${Math.abs(balance).toFixed(2)}` : 'Settle: $0.00'}
                </p>
              </div>
              <Zap size={24} className={balance > 0 ? 'text-orange-300' : 'text-emerald-300'} />
            </div>
          </div>

          {/* Incident Section */}
          <div className="space-y-3">
            <p className="text-xs font-black text-gray-500 uppercase ml-1 flex items-center gap-2">
              <History size={14} className="text-blue-500" /> Report Incident (Optional)
            </p>
            <Select value={incidentType} onValueChange={(val) => setIncidentType(val || 'NONE')}>
              <SelectTrigger className="h-14 rounded-2xl bg-gray-50 border-gray-100">
                <SelectValue placeholder="No incident" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">No Incident (Regular Return)</SelectItem>
                <SelectItem value="MECHANICAL">Mechanical Failure (Bike issue)</SelectItem>
                <SelectItem value="TECHNICAL">Technical Error (App/System issue)</SelectItem>
                <SelectItem value="OTHER">Other / Misc</SelectItem>
              </SelectContent>
            </Select>
            {incidentType !== 'NONE' && (
              <textarea
                placeholder="Explain the incident details for refund justification..."
                className="w-full h-20 p-4 rounded-2xl bg-blue-50/30 border-2 border-blue-100 focus:border-blue-400 outline-none transition-all text-xs"
                value={incidentNotes}
                onChange={e => setIncidentNotes(e.target.value)}
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-2">
            <Button variant="outline" onClick={onClose} className="h-14 rounded-2xl flex-1 border-2 font-bold">Cancel</Button>
            <Button 
              onClick={handleComplete} 
              disabled={loading || realDuration < 0}
              className="h-14 rounded-2xl flex-[2] font-black bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <CheckCircle2 size={20} />}
              Confirm & Finish Ride
            </Button>
          </div>

          {balance < 0 && incidentType === 'NONE' && (
            <div className="flex gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100 items-start">
              <AlertCircle size={14} className="text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-blue-800 font-bold leading-tight">
                Note: Early returns without an incident report are not automatically refunded per business policy. 
                If you want to issue a refund, select an incident type.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
