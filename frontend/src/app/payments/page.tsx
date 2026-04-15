'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import { CreditCard, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { AccessDenied } from '@/components/ui/access-denied';
import { toast } from 'sonner';

export default function PaymentsPage() {
  const { canRead, canView, isLoaded, canUpdate } = usePermissions();
  const queryClient = useQueryClient();

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments', canRead('PAYMENTS')],
    queryFn: async () => {
      const endpoint = canRead('PAYMENTS') ? '/payments' : '/payments/my';
      const res = await api.get(endpoint);
      return res.data;
    },
    enabled: isLoaded
  });

  const payMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.patch(`/payments/${id}/pay`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Simulated payment successful!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Payment failed');
    }
  });

  if (!isLoaded) return <LoadingScreen message="Loading Payments..." />;
  if (!canView('PAYMENTS') && !canView('RESERVATIONS')) return <AccessDenied />;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments & Billing</h1>
          <p className="text-gray-500 mt-1">Review your rental history and complete pending transactions.</p>
        </div>
        <div className="flex items-center gap-4 bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100">
           <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Total Spent</p>
              <p className="text-xl font-black text-gray-900 mt-1">
                ${payments?.filter((p: any) => p.status === 'PAID').reduce((acc: number, p: any) => acc + p.amount, 0).toFixed(2)} 
                <span className="text-xs text-gray-400 ml-1">USD</span>
              </p>
           </div>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
             <div key={i} className="h-24 bg-gray-100 rounded-[2rem] animate-pulse border" />
          ))
        ) : payments?.map((payment: any) => (
          <div key={payment.id} className="bg-white border rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-xl hover:shadow-black/5 transition-all duration-300">
            <div className="flex items-center gap-6 w-full md:w-auto">
              <div className={cn(
                "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-colors",
                payment.status === 'PAID' 
                  ? "bg-green-50 text-green-600 border-green-100 shadow-sm" 
                  : "bg-amber-50 text-amber-600 border-amber-100 shadow-sm animate-pulse"
              )}>
                 {payment.status === 'PAID' ? <CheckCircle size={28} /> : <AlertCircle size={28} />}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                  Ref: #{payment.id.slice(0,8)}
                  <span className={cn(
                    "text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border",
                    payment.status === 'PAID' ? "bg-green-50 text-green-600 border-green-100" : "bg-amber-50 text-amber-600 border-amber-100"
                  )}>
                    {payment.status}
                  </span>
                </h3>
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                   <p className="flex items-center gap-1 font-medium"><Calendar size={12}/> {new Date(payment.createdAt).toLocaleDateString()}</p>
                   <p className="flex items-center gap-1 font-medium px-2 py-0.5 bg-gray-50 rounded text-gray-400">#RES-{payment.reservationId.slice(0,8)}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0">
               <div className="text-right">
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount Due</p>
                 <p className="text-2xl font-black">${payment.amount} <span className="text-xs text-gray-400 font-medium ml-0.5">USD</span></p>
               </div>
               
               {payment.status === 'PENDING' && canUpdate('PAYMENTS') && (
                 <button 
                   onClick={() => payMutation.mutate(payment.id)}
                   disabled={payMutation.isPending}
                   className="bg-black text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-[1.05] active:scale-[0.95] transition shadow-lg shadow-black/20 disabled:opacity-50"
                 >
                   <CreditCard size={18} />
                   {payMutation.isPending ? 'Processing...' : 'Pay Now'}
                 </button>
               )}

               {payment.status === 'PAID' && (
                 <div className="bg-gray-100/50 text-gray-400 px-6 py-3 rounded-2xl font-bold border border-transparent">
                   Receipt Set
                 </div>
               )}
            </div>
          </div>
        ))}

        {!isLoading && (!payments || payments.length === 0) && (
           <div className="bg-gray-50 rounded-[3rem] p-24 text-center space-y-4 border-2 border-dashed border-gray-100">
             <div className="mx-auto w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center text-gray-300">
                <CreditCard size={40} />
             </div>
             <div>
               <p className="text-xl font-bold text-gray-900">No transactions found</p>
               <p className="text-gray-400 max-w-xs mx-auto mt-2">When you complete rentals, your payment history will appear here.</p>
             </div>
           </div>
        )}
      </div>
    </div>
  );
}
