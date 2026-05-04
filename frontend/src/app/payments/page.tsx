'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import { CreditCard, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
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
      const endpoint = canRead('PAYMENTS') ? '/payments' : '/payments/my';
      return (await api.get(endpoint)).data;
    },
    enabled: isLoaded
  });

  const payMutation = useMutation({
    mutationFn: async (id: string) => api.patch(`/payments/${id}/pay`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payments'] }); toast.success('Simulated payment successful!'); },
    onError: (err: any) => { toast.error(err.response?.data?.message || 'Payment failed'); }
  });

  const table = useDataTable({ data: payments || [], searchableKeys: ['id', 'reservationId', 'userId'], defaultPageSize: 10, storageKey: 'payments' });

  const totalSpent = payments?.filter((p: any) => p.status === 'PAID').reduce((acc: number, p: any) => acc + p.amount, 0)?.toFixed(2) || '0.00';

  const columns: DataTableColumn<any>[] = [
    {
      header: 'Reference',
      accessorKey: 'id',
      cell: (p) => {
        const isPaid = p.status === 'PAID';
        return (
          <div className="flex items-center gap-4">
            <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border-2 transition-colors", isPaid ? "bg-green-50 text-green-600 border-green-100 shadow-sm" : "bg-amber-50 text-amber-600 border-amber-100 shadow-sm")}>
              {isPaid ? <CheckCircle size={22} /> : <AlertCircle size={22} />}
            </div>
            <div>
              <span className="font-bold text-gray-900">Ref: #{(p.id as string).slice(0,8)}</span>
              <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border ml-2", isPaid ? "bg-green-50 text-green-600 border-green-100" : "bg-amber-50 text-amber-600 border-amber-100")}>{p.status as string}</span>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: (p) => (<span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">{p.type as string}</span>),
    },
    {
      header: 'Date',
      accessorKey: 'createdAt',
      cell: (p) => (<div className="flex items-center gap-1 text-xs text-gray-500 font-medium"><Calendar size={12}/>{new Date(p.createdAt as string).toLocaleDateString()}</div>),
    },
    {
      header: 'Reservation',
      accessorKey: 'reservationId',
      cell: (p) => (<span className="text-xs font-medium px-2 py-0.5 bg-gray-50 rounded text-gray-400">#RES-{(p.reservationId as string).slice(0,8)}</span>),
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      align: 'right',
      cell: (p) => (<p className="text-lg font-black">${p.amount as number} <span className="text-xs text-gray-400 font-medium ml-0.5">USD</span></p>),
    },
    {
      header: '',
      accessorKey: '_actions',
      align: 'right',
      exportable: false,
      cell: (p) => {
        if (p.status === 'PENDING' && canUpdate('PAYMENTS')) {
          return (<button onClick={() => { setSelectedPayment(p); setModalOpen(true); }} className="bg-black text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 hover:scale-[1.03] active:scale-[0.97] transition shadow-lg shadow-black/20 text-sm"><CreditCard size={16} />Pay Now</button>);
        }
        if (p.status === 'PAID') {
          return (<div className="bg-gray-100/50 text-gray-400 px-4 py-2 rounded-xl font-bold border border-transparent text-sm">Receipt Set</div>);
        }
        return null;
      },
    },
  ];

  const filters: DataTableFilter[] = [
    { key: 'status', label: 'Payment Status', options: [{ label: 'Pending', value: 'PENDING' }, { label: 'Paid', value: 'PAID' }, { label: 'Failed', value: 'FAILED' }, { label: 'Refunded', value: 'REFUNDED' }] },
    { key: 'type', label: 'Type', options: [{ label: 'Upfront', value: 'UPFRONT' }, { label: 'Deposit', value: 'DEPOSIT' }, { label: 'Post-Ride', value: 'POST_RIDE' }] },
  ];

  if (!isLoaded) return <LoadingScreen message="Loading Payments..." />;
  if (!canView('PAYMENTS') && !canView('RESERVATIONS')) return <AccessDenied />;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <DataTablePro
        title="Payments & Billing"
        subtitle="Review your rental history and complete pending transactions."
        data={payments || []}
        columns={columns}
        filters={filters}
        exportEnabled
        exportTitle="Payments & Billing"
        exportFileName="payments"
        searchTerm={table.searchTerm}
        onSearchChange={table.setSearchTerm}
        searchPlaceholder="Search by reference or reservation..."
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
        emptyTitle="No transactions found"
        emptyMessage="When you complete rentals, your payment history will appear here."
        headerActions={
          <div className="flex items-center gap-4 bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100">
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Total Spent</p>
              <p className="text-xl font-black text-gray-900 mt-1">${totalSpent} <span className="text-xs text-gray-400 ml-1">USD</span></p>
            </div>
          </div>
        }
      />

      <PaymentModal isOpen={modalOpen} onClose={() => setModalOpen(false)} payment={selectedPayment} onConfirm={async (id) => { await payMutation.mutateAsync(id); }} />
    </div>
  );
}
