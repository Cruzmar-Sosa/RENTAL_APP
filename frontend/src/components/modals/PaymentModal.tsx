import { useState } from 'react';
import { AppModal } from '@/components/ui/app-modal';
import { Button } from '@/components/ui/button';
import { CreditCard, CheckCircle2, User, Bike, FileText, AlertCircle, Receipt, DollarSign, Wallet, ShieldCheck, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Payment } from '@/types';
import { cn } from '@/lib/utils';

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

  const modalTitle = (
    <div className="flex items-center gap-4">
      <div className={cn(
        "p-3 rounded-2xl shadow-lg",
        isRefund ? "bg-emerald-600 text-white" : "bg-black text-white"
      )}>
        <CreditCard size={24} />
      </div>
      <div>
        <h2 className="text-2xl font-black tracking-tight text-gray-900">Payment Review</h2>
        <p className="text-sm text-gray-500 font-medium tracking-normal">Verification before processing ledger update</p>
      </div>
    </div>
  );

  const modalFooter = (
    <div className="flex flex-col sm:flex-row gap-4 w-full">
      <Button variant="outline" onClick={onClose} className="h-14 sm:h-16 rounded-2xl flex-1 border-2 font-bold text-base">
        Cancel
      </Button>
      <Button 
        onClick={handlePay} 
        disabled={loading || payment.reservation?.status === 'CANCELLED'}
        className={cn(
          "h-14 sm:h-16 rounded-2xl flex-2 font-black transition-all flex items-center justify-center gap-2 text-base shadow-xl",
          payment.reservation?.status === 'CANCELLED' 
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : isRefund 
              ? "bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-[1.01] active:scale-95 shadow-emerald-100" 
              : "bg-black text-white hover:bg-gray-800 hover:scale-[1.01] active:scale-95 shadow-gray-200"
        )}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
        ) : (
          <ShieldCheck size={20} />
        )}
        {isRefund ? 'Process Refund' : 'Confirm Payment'}
      </Button>
    </div>
  );

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="md"
      footer={modalFooter}
    >
      <div className="space-y-8">
        {/* Cancelled Warning */}
        {payment.reservation?.status === 'CANCELLED' && (
          <div className="bg-red-50 border-2 border-red-100 p-6 rounded-[2rem] flex gap-5 items-start animate-in zoom-in-95">
            <div className="p-3 bg-red-100 text-red-600 rounded-2xl shadow-sm">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-red-900 uppercase tracking-widest mb-1">Reservation Cancelled</p>
              <p className="text-xs text-red-800 font-bold leading-relaxed">
                This payment is linked to a cancelled reservation and cannot be processed. The payment status should be updated to FAILED automatically by the system.
              </p>
            </div>
          </div>
        )}

        {/* Invoice ID Badge */}
        <div className="flex justify-center">
          <div className="px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-2xl flex items-center gap-3">
            <Receipt size={16} className="text-gray-400" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Master Invoice</span>
            <span className="text-xs font-black text-gray-900">#{payment.id.slice(0, 12).toUpperCase()}</span>
          </div>
        </div>

        {/* Identity Section */}
        <div className="bg-gray-50 p-6 rounded-[2rem] border-2 border-gray-100 space-y-4">
          <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-200 text-gray-400">
              <User size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Billing Customer</p>
              <p className="text-lg font-black text-gray-900">{(payment as any).user?.name || (payment as any).user?.email || 'Walk-in Guest'}</p>
            </div>
          </div>
          
          <div className="h-px bg-gray-200/50" />
          
          <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-200 text-gray-400">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Linked Reservation</p>
              <p className="text-sm font-bold text-gray-900 leading-tight">Ref: {payment.reservationId.slice(0, 16)}...</p>
            </div>
          </div>
        </div>

        {/* Financial Core Card */}
        <div className={cn(
          "p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group",
          isRefund ? "bg-emerald-600 text-white" : "bg-black text-white"
        )}>
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign size={120} />
          </div>
          
          <div className="relative z-10 space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Total Transaction</p>
                <p className="text-5xl font-black">${payment.amount.toFixed(2)}</p>
              </div>
              <div className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest",
                isRefund ? "bg-white/20" : "bg-emerald-500"
              )}>
                {badge.label}
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-white/10">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-white/50">Base Payment</span>
                <span className="font-black">${payment.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-white/50">Processing Fee</span>
                <span className="font-black">$0.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Policy Notice */}
        <div className={cn(
          "p-6 rounded-[2rem] border-2 flex gap-5 items-start",
          isRefund ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-blue-50 border-blue-100 text-blue-800"
        )}>
          <div className={cn(
            "p-3 rounded-2xl shadow-sm",
            isRefund ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
          )}>
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1">Transaction Note</p>
            <p className="text-xs font-bold leading-relaxed">
              {payment.type === 'BALANCE' 
                ? 'Extra time coverage beyond the original estimation.'
                : payment.type === 'DEPOSIT'
                  ? 'Security deposit for fleet protection. Held until safe return.'
                  : isRefund 
                    ? 'Processing this will return the specified amount to the customers original payment method.'
                    : 'Standard activation charge for the bicycle reservation.'
              }
            </p>
          </div>
        </div>
      </div>
    </AppModal>
  );
}
