import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, CheckCircle2, User, Bike, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: any;
  onConfirm: (id: string) => Promise<void>;
}

export function PaymentModal({ isOpen, onClose, payment, onConfirm }: PaymentModalProps) {
  const [loading, setLoading] = useState(false);

  if (!payment) return null;

  const handlePay = async () => {
    setLoading(true);
    try {
      await onConfirm(payment.id);
      onClose();
    } catch (error) {
      toast.error('Payment confirmation failed.');
    } finally {
      setLoading(false);
    }
  };

  const isPostRide = payment.type === 'POST_RIDE';
  const isDeposit = payment.type === 'DEPOSIT';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white rounded-3xl p-6 border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-center flex items-center justify-center gap-2">
            <CreditCard size={24} /> Payment Review
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl shadow-sm"><User size={18} className="text-gray-400"/></div>
            <div>
              <p className="text-xs font-bold text-gray-400">User & Document</p>
              <p className="text-sm font-bold text-gray-800">{payment.user?.name || payment.user?.email}</p>
              <p className="text-xs text-gray-500">{payment.user?.documentType || 'ID'}: {payment.user?.documentNumber || 'N/A'}</p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl shadow-sm"><Bike size={18} className="text-gray-400"/></div>
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-400">Reservation Info</p>
              <p className="text-sm font-bold text-gray-800">
                Res: #{payment.reservationId.slice(0,8)} 
                {payment.reservation?.bike && ` • Bike #${payment.reservation.bike.code}`}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                Status: {payment.reservation?.status || 'Unknown'}
              </p>
            </div>
          </div>

          <div className="space-y-3 bg-white border p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
               <FileText size={16} className="text-gray-400" />
               <span className="text-sm font-bold text-gray-600 uppercase tracking-widest">Invoice Details</span>
            </div>
            
            <div className="flex justify-between text-sm font-medium text-gray-600">
              <span>Payment Type:</span>
              <span className="font-bold">{payment.type}</span>
            </div>
            <div className="flex justify-between text-sm font-medium text-gray-600">
              <span>Currency:</span>
              <span className="font-bold">{payment.currency}</span>
            </div>
            
            <div className={`border-t pt-4 flex justify-between items-center text-gray-900`}>
              <span className="font-bold uppercase text-sm">
                Amount to Pay
              </span>
              <span className="text-3xl font-black">
                ${payment.amount.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="bg-blue-50 text-blue-800 p-3 rounded-xl text-xs font-medium border border-blue-100 flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-blue-500" />
            <p>
              {isPostRide 
                ? 'This is a settlement payment for a ride that exceeded the estimated time.'
                : isDeposit 
                  ? 'This is a partial deposit. The remainder will be settled upon completion.'
                  : 'This payment will confirm the reservation and allow the user to start the ride.'
              }
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="h-12 rounded-xl w-1/3">Cancel</Button>
            <Button onClick={handlePay} disabled={loading} className="h-12 rounded-xl font-bold bg-black text-white hover:bg-gray-800 w-2/3 flex items-center justify-center gap-2">
              <CheckCircle2 size={18} /> Process Payment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
