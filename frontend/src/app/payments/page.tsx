'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import { CreditCard, Calendar, CheckCircle, AlertCircle, Receipt, DollarSign, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { AccessDenied } from '@/components/ui/access-denied';
import { toast } from 'sonner';
import { useState } from 'react';
import { PaymentModal } from '@/components/modals/PaymentModal';
import { DataTablePro, DataTableColumn, DataTableFilter } from '@/components/ui/data-table-pro';
import { useDataTable } from '@/hooks/useDataTable';

export default function PaymentsPage() {
  const { canRead, canView, isLoaded, canUpdate } = usePermissions();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments', canRead('PAYMENTS')],
    queryFn: async () => {
      return (await api.get('/payments')).data;
    },
    enabled: isLoaded
  });

  const payMutation = useMutation({
    mutationFn: async (id: string) => api.patch(`/payments/${id}/pay`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payments'] }); toast.success('Payment processed successfully!'); },
    onError: (err: any) => { toast.error(err.response?.data?.message || 'Payment failed'); }
  });

  const table = useDataTable({ data: payments || [], searchableKeys: ['id', 'reservationId', 'userId', 'user.email', 'user.name'], defaultPageSize: 10, storageKey: 'payments' });

  const totalSpent = payments?.filter((p: any) => p.status === 'PAID').reduce((acc: number, p: any) => acc + p.amount, 0)?.toFixed(2) || '0.00';
  const pendingCount = payments?.filter((p: any) => p.status === 'PENDING').length || 0;

  const columns: DataTableColumn<any>[] = [
    {
      header: 'Transaction',
      accessorKey: 'id',
      cell: (p) => {
        const isPaid = p.status === 'PAID';
        const isRefund = p.type === 'REFUND';
        return (
          <div className="flex items-center gap-4">
            <div className={cn(
              "h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all", 
              isPaid ? "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm" : 
              isRefund ? "bg-blue-50 text-blue-600 border-blue-100 shadow-sm" :
              "bg-orange-50 text-orange-600 border-orange-100 shadow-sm"
            )}>
              {isPaid ? <CheckCircle size={22} /> : isRefund ? <Receipt size={22} /> : <CreditCard size={22} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">#{(p.id as string).slice(0, 8).toUpperCase()}</span>
                <span className={cn(
                  "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border", 
                  isPaid ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                  isRefund ? "bg-blue-50 text-blue-600 border-blue-100" :
                  "bg-orange-50 text-orange-600 border-orange-100"
                )}>
                  {p.status as string}
                </span>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{(p.user as any)?.email || (p.user as any)?.name || 'Account System'}</span>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Category',
      accessorKey: 'type',
      cell: (p) => (
        <span className="text-[10px] font-black text-gray-500 bg-gray-100 px-3 py-1 rounded-lg uppercase tracking-wider">
          {p.type as string}
        </span>
      ),
    },
    {
      header: 'Timestamp',
      accessorKey: 'createdAt',
      cell: (p) => (
        <div className="flex flex-col text-xs text-gray-500 font-medium leading-tight">
          <span className="flex items-center gap-1 font-bold text-gray-900"><Calendar size={12} className="text-gray-400"/>{new Date(p.createdAt as string).toLocaleDateString()}</span>
          <span className="ml-4">{new Date(p.createdAt as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      ),
    },
    {
      header: 'Reference',
      accessorKey: 'reservationId',
      cell: (p) => (
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Reservation</span>
          <span className="text-xs font-bold text-gray-900">#RES-{(p.reservationId as string).slice(0, 8).toUpperCase()}</span>
        </div>
      ),
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      align: 'right',
      cell: (p) => (
        <div className="text-right leading-none">
          <p className={cn("text-xl font-black", p.type === 'REFUND' ? 'text-blue-600' : 'text-gray-900')}>
            {p.type === 'REFUND' ? '-' : ''}${p.amount.toFixed(2)}
          </p>
          <span className="text-[10px] font-bold text-gray-400 uppercase">USD</span>
        </div>
      ),
    },
    {
      header: 'Actions',
      accessorKey: '_actions',
      align: 'right',
      exportable: false,
      cell: (p) => {
        if (p.status === 'PENDING' && canUpdate('PAYMENTS')) {
          return (
            <button 
              onClick={() => { setSelectedPayment(p); setModalOpen(true); }} 
              className="bg-black text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:scale-[1.05] active:scale-[0.95] transition-all shadow-lg shadow-black/10"
            >
              <DollarSign size={14} /> Process
            </button>
          );
        }
        if (p.status === 'PAID') {
          return (
            <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[9px] border border-emerald-100 flex items-center gap-1.5">
              <CheckCircle size={14} /> Finalized
            </div>
          );
        }
        return (
          <div className="bg-gray-100 text-gray-400 px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[9px] border border-gray-100">
            Internal
          </div>
        );
      },
    },
  ];

  const filters: DataTableFilter[] = [
    { key: 'status', label: 'Payment Status', options: [{ label: 'Pending', value: 'PENDING' }, { label: 'Paid', value: 'PAID' }, { label: 'Failed', value: 'FAILED' }, { label: 'Refunded', value: 'REFUNDED' }] },
    { key: 'type', label: 'Type', options: [{ label: 'Upfront', value: 'UPFRONT' }, { label: 'Deposit', value: 'DEPOSIT' }, { label: 'Post-Ride', value: 'POST_RIDE' }, { label: 'Balance', value: 'BALANCE' }, { label: 'Refund', value: 'REFUND' }] },
  ];

  if (!isLoaded) return <LoadingScreen message="Loading Ledger..." />;
  if (!canView('PAYMENTS') && !canView('RESERVATIONS')) return <AccessDenied />;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black text-white p-8 rounded-[2rem] shadow-2xl shadow-black/10 flex flex-col justify-between border border-white/10 transition-transform hover:scale-[1.02]">
          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Total Transaction Value</p>
          <div className="flex items-end gap-2 mt-4">
            <h3 className="text-5xl font-black leading-none">${totalSpent}</h3>
            <span className="text-white/40 font-bold mb-1">USD</span>
          </div>
        </div>
        <div className="bg-white border-2 border-gray-100 p-8 rounded-[2rem] flex flex-col justify-between transition-transform hover:scale-[1.02]">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Pending Invoices</p>
          <div className="flex items-center justify-between mt-4">
            <h3 className="text-5xl font-black text-orange-500 leading-none">{pendingCount}</h3>
            <Wallet size={32} className="text-orange-100" />
          </div>
        </div>
        <div className="bg-white border-2 border-gray-100 p-8 rounded-[2rem] flex flex-col justify-between transition-transform hover:scale-[1.02]">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">System Efficiency</p>
          <div className="flex items-center justify-between mt-4">
            <h3 className="text-5xl font-black text-gray-900 leading-none">98%</h3>
            <CheckCircle size={32} className="text-emerald-100" />
          </div>
        </div>
      </div>

      <DataTablePro
        title={canUpdate('PAYMENTS') ? "Financial Ledger" : "My Payments"}
        subtitle={canUpdate('PAYMENTS') ? "Detailed audit log of all transactions, including rentals, deposits, and refunds." : "View your transaction history."}
        data={payments || []}
        columns={columns}
        filters={filters}
        exportEnabled
        exportTitle={canUpdate('PAYMENTS') ? "Financial Ledger" : "My Payments"}
        exportFileName="payments"
        searchTerm={table.searchTerm}
        onSearchChange={table.setSearchTerm}
        searchPlaceholder="Search by ID, reservation or email..."
        activeFilters={table.activeFilters}
        onFilterChange={table.setFilter}
        currentPage={table.currentPage}
        totalPages={table.totalPages}
        pageSize={table.pageSize}
        onPageChange={table.setCurrentPage}
        onPageSizeChange={table.setPageSize}
        startRecord={table.startRecord}
        endRecord={table.endRecord}
        filteredCount={table.filteredCount}
        totalRecords={table.totalRecords}
        paginatedData={table.paginatedData}
        filteredData={table.filteredData}
        isLoading={isLoading}
        emptyIcon={<CreditCard size={40} />}
        emptyTitle="No financial records"
        emptyMessage="Completed rentals and system transactions will appear here."
      />

      <PaymentModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        payment={selectedPayment} 
        onConfirm={async (id) => { await payMutation.mutateAsync(id); }} 
      />
    </div>
  );
}
