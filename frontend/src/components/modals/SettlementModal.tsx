import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, DollarSign, Calculator } from 'lucide-react';
import { toast } from 'sonner';

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: any;
  onConfirm: (id: string, action: string) => Promise<void>;
}

export function SettlementModal({ isOpen, onClose, reservation, onConfirm }: SettlementModalProps) {
  const [loading, setLoading] = useState(false);

  if (!reservation) return null;

  // Mock calculations - these would ideally come from backend on a 'previewComplete' endpoint
  // But for now, we estimate here based on dates.
  const actualStart = new Date(reservation.actualStart || reservation.startTime);
  const actualEnd = new Date(); // now
  const hoursUsedRaw = (actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60);
  const hoursUsed = Math.max(1, Math.ceil(hoursUsedRaw)); // minimum 1 hour

  const PRICE_PER_HOUR = 50;
  const realTotal = hoursUsed * PRICE_PER_HOUR;
  
  // Calculate what they already paid
  // Assuming reservation.payment exists and contains amount if PAID
  const amountPaid = (reservation.payment?.status === 'PAID') ? reservation.payment.amount : 0;
  const balance = realTotal - amountPaid;

  const handleComplete = async () => {
    setLoading(true);
    try {
      await onConfirm(reservation.id, 'complete');
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
          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div className="bg-white p-3 rounded-xl shadow-sm">
              <Clock size={24} className="text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Time Used</p>
              <p className="text-xl font-black text-gray-900">{hoursUsedRaw.toFixed(1)} hours</p>
              <p className="text-xs text-gray-400">Billed as {hoursUsed} hour(s)</p>
            </div>
          </div>

          <div className="space-y-3">
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

          <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-xs font-medium border border-blue-100">
            Completing this ride will end the tracking, mark the bike as available, and create a pending payment for the amount due (if any).
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="h-12 rounded-xl w-1/3">Cancel</Button>
            <Button onClick={handleComplete} disabled={loading} className="h-12 rounded-xl font-bold bg-black text-white hover:bg-gray-800 w-2/3 flex items-center justify-center gap-2">
              <CheckCircle2 size={18} /> Confirm & Finish
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
