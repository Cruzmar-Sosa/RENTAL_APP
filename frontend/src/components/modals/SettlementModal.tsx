import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Clock, Calculator, User, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: any;
  onConfirm: (id: string, action: string, data?: any) => Promise<void>;
}

export function SettlementModal({ isOpen, onClose, reservation, onConfirm }: SettlementModalProps) {
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);

  useEffect(() => {
    if (reservation && isOpen) {
      const actualStart = new Date(reservation.actualStart || reservation.startTime);
      const now = new Date();
      const diffHrs = Math.max(0, (now.getTime() - actualStart.getTime()) / (1000 * 60 * 60));
      const totalHrsCeil = Math.max(1, Math.ceil(diffHrs)); // minimum 1 hr

      setDays(Math.floor(totalHrsCeil / 24));
      setHours(totalHrsCeil % 24);
    }
  }, [reservation, isOpen]);

  if (!reservation) return null;

  const PRICE_PER_HOUR = 50;
  const PRICE_PER_DAY = PRICE_PER_HOUR * 24;
  
  const totalHours = (days * 24) + hours;
  const realTotal = (days * PRICE_PER_DAY) + (hours * PRICE_PER_HOUR);

  // Consider all payments array if it exists, or fallback
  const amountPaid = reservation.payments?.reduce((acc: number, p: any) => acc + (p.status === 'PAID' ? p.amount : 0), 0) || 0;
  const balance = realTotal - amountPaid;

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Calculate a pseudo actualEnd based on the manual duration
      const actualStart = new Date(reservation.actualStart || reservation.startTime);
      const actualEnd = new Date(actualStart.getTime() + (totalHours * 60 * 60 * 1000));

      await onConfirm(reservation.id, 'complete', {
        balance,
        priceActual: realTotal,
        actualEnd: actualEnd.toISOString()
      });
      onClose();
    } catch (error) {
      toast.error('Failed to complete ride.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white rounded-3xl p-6 border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-center flex items-center justify-center gap-2">
            <Calculator size={24} /> Ride Settlement
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl shadow-sm"><User size={18} className="text-gray-400"/></div>
            <div>
              <p className="text-xs font-bold text-gray-400">User & Document</p>
              <p className="text-sm font-bold text-gray-800">{reservation.user?.name || reservation.user?.email}</p>
              <p className="text-xs text-gray-500">{reservation.user?.documentType || 'ID'}: {reservation.user?.documentNumber || 'N/A'}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Clock size={14}/> Billed Duration (Editable)</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-600">Days</label>
                <Input type="number" min="0" value={days} onChange={(e) => setDays(Number(e.target.value))} className="h-12 rounded-xl font-bold text-lg"/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600">Hours</label>
                <Input type="number" min="0" max="23" value={hours} onChange={(e) => setHours(Number(e.target.value))} className="h-12 rounded-xl font-bold text-lg"/>
              </div>
            </div>
          </div>

          <div className="space-y-3 bg-white border p-4 rounded-2xl shadow-sm">
            <div className="flex justify-between text-sm font-medium text-gray-600">
              <span>Billed Time:</span>
              <span>{totalHours} hour(s)</span>
            </div>
            <div className="flex justify-between text-sm font-medium text-gray-600">
              <span>Real Cost:</span>
              <span>${realTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium text-gray-600">
              <span>Amount Paid:</span>
              <span className="text-green-600">-${amountPaid.toFixed(2)}</span>
            </div>
            
            <div className={`border-t pt-4 flex justify-between items-center ${balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
              <span className="font-bold uppercase text-sm">
                {balance > 0 ? 'Amount Due' : balance < 0 ? 'Refund Due' : 'Fully Settled'}
              </span>
              <span className="text-2xl font-black">
                ${Math.abs(balance).toFixed(2)}
              </span>
            </div>
          </div>

          {balance > 0 && (
            <div className="bg-red-50 text-red-800 p-3 rounded-xl text-xs font-bold border border-red-100 flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p>Completing this ride will generate a POST-RIDE debt of ${balance.toFixed(2)} for this user.</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="h-12 rounded-xl w-1/3">Cancel</Button>
            <Button onClick={handleComplete} disabled={loading || totalHours < 1} className="h-12 rounded-xl font-bold bg-black text-white hover:bg-gray-800 w-2/3 flex items-center justify-center gap-2">
              <CheckCircle2 size={18} /> Confirm & Finish
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
