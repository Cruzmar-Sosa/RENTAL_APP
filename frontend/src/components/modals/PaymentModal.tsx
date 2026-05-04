import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, CheckCircle2, User, Bike, FileText, AlertCircle, Receipt, DollarSign, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Payment } from '@/types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
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

  const getPaymentBadge = (type: string) => {
    switch (type) {
      case 'UPFRONT': return { bg: 'bg-blue-100 text-blue-700', label: 'Upfront Full' };
      case 'DEPOSIT': return { bg: 'bg-purple-100 text-purple-700', label: 'Security Deposit' };
      case 'POST_RIDE': return { bg: 'bg-orange-100 text-orange-700', label: 'Post-Ride Adjustment' };
      case 'BALANCE': return { bg: 'bg-red-100 text-red-700', label: 'Pending Balance' };
      case 'REFUND': return { bg: 'bg-emerald-100 text-emerald-700', label: 'Customer Refund' };
      default: return { bg: 'bg-gray-100 text-gray-700', label: type };
    }
  };

  const badge = getPaymentBadge(payment.type);
  const isRefund = payment.type === 'REFUND';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white rounded-[2rem] p-0 border-0 shadow-2xl overflow-hidden">
        {/* Header Branding */}
        <div className={`p-8 text-white ${isRefund ? 'bg-emerald-600' : 'bg-black'}`}>
          <div className="flex justify-between items-start mb-4">
            <div className="bg-white/20 p-3 rounded-2xl">
              <CreditCard size={28} />
            </div>
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isRefund ? 'bg-emerald-500' : 'bg-gray-800'}`}>
              Invoice #{payment.id.slice(0, 8)}
            </div>
          </div>
          <h2 className="text-3xl font-black mb-1">Payment Review</h2>
          <p className="text-white/60 text-sm font-medium">Verify transaction details before processing.</p>
        </div>

        <div className="p-8 space-y-6">
          {/* User & Res Snapshot */}
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100"><User size={20} className="text-gray-400"/></div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-gray-400 uppercase">Customer</p>
                <p className="font-bold text-gray-900 truncate">{(payment as any).user?.name || (payment as any).user?.email || 'Guest'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100"><Receipt size={20} className="text-gray-400"/></div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-gray-400 uppercase">Reservation Reference</p>
                <p className="font-bold text-gray-900">ID: {payment.reservationId.slice(0, 12)}...</p>
              </div>
            </div>
          </div>

          {/* Financial Card */}
          <div className="bg-white border-2 border-gray-100 rounded-[2rem] overflow-hidden shadow-sm">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Wallet size={16} className="text-gray-400" />
                  <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Transaction Type</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${badge.bg}`}>
                  {badge.label}
                </span>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-sm font-bold text-gray-400">
                  <span>Gross Amount</span>
                  <span>${payment.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-400">
                  <span>Fees / Tax</span>
                  <span>$0.00</span>
                </div>
              </div>

              <div className={`mt-4 pt-4 border-t-2 border-dashed border-gray-100 flex justify-between items-center ${isRefund ? 'text-emerald-600' : 'text-gray-900'}`}>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400">{isRefund ? 'Amount to Refund' : 'Amount to Charge'}</p>
                  <p className="text-4xl font-black">${payment.amount.toFixed(2)}</p>
                </div>
                <DollarSign size={32} className="text-gray-100" />
              </div>
            </div>
          </div>

          {/* Alert / Info */}
          <div className={`p-4 rounded-2xl border flex gap-3 ${isRefund ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
            <AlertCircle size={20} className={`shrink-0 ${isRefund ? 'text-emerald-500' : 'text-blue-500'}`} />
            <p className="text-xs font-medium leading-relaxed">
              {payment.type === 'BALANCE' 
                ? 'This payment covers the extra time used beyond the original estimation.'
                : payment.type === 'DEPOSIT'
                  ? 'Initial security deposit to confirm the reservation. Remaining balance will be calculated later.'
                  : isRefund 
                    ? 'Processing this will return the specified amount to the customers balance/card.'
                    : 'Standard upfront payment to activate the bike reservation.'
              }
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-2">
            <Button variant="outline" onClick={onClose} className="h-14 rounded-2xl flex-1 border-2 font-bold">Cancel</Button>
            <Button 
              onClick={handlePay} 
              disabled={loading}
              className={`h-14 rounded-2xl flex-[2] font-black text-white hover:scale-[1.02] transition-all flex items-center justify-center gap-2 ${isRefund ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-black hover:bg-gray-800'}`}
            >
              {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <CheckCircle2 size={20} />}
              {isRefund ? 'Process Refund' : 'Confirm Payment'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
