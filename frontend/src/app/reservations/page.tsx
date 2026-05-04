'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import { Calendar, Bike as BikeIcon, User as UserIcon, CheckCircle, XCircle, Clock, Play, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { AccessDenied } from '@/components/ui/access-denied';
import { useState } from 'react';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { toast } from 'sonner';
import { DataTablePro, DataTableColumn, DataTableFilter } from '@/components/ui/data-table-pro';
import { useDataTable } from '@/hooks/useDataTable';

export default function ReservationsAdminPage() {
  const { canRead, canView, isLoaded, canUpdate } = usePermissions();
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<{id: string, type: 'START' | 'COMPLETE' | 'CANCEL'} | null>(null);

  const { data: reservations, isLoading } = useQuery({
    queryKey: ['admin-reservations-detailed', canRead('RESERVATIONS')],
    queryFn: async () => {
      const endpoint = canRead('RESERVATIONS') ? '/reservations' : '/reservations/my';
      return (await api.get(endpoint)).data;
    },
    enabled: isLoaded
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, type }: {id: string, type: 'START' | 'COMPLETE' | 'CANCEL'}) => {
      if (type === 'START') return api.patch(`/reservations/${id}/start`);
      if (type === 'COMPLETE') return api.patch(`/reservations/${id}/complete`);
      if (type === 'CANCEL') return api.patch(`/reservations/${id}/cancel`);
    },
    onSuccess: (_, v) => { queryClient.invalidateQueries({ queryKey: ['admin-reservations-detailed'] }); toast.success(`Reservation ${v.type.toLowerCase()}ed successfully`); setConfirmAction(null); },
    onError: (err: any) => { toast.error(err.response?.data?.message || 'Failed'); setConfirmAction(null); }
  });

  const statusMap: Record<string, { color: string; icon: any }> = {
    PENDING: { color: 'bg-gray-100 text-gray-500 border-gray-200', icon: Clock },
    CONFIRMED: { color: 'bg-blue-100 text-blue-600 border-blue-200', icon: CheckCircle },
    ACTIVE: { color: 'bg-green-100 text-green-600 border-green-300', icon: Play },
    COMPLETED: { color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
    CANCELLED: { color: 'bg-red-50 text-red-600 border-red-200', icon: Ban },
    NO_SHOW: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: XCircle },
  };
  const getStatus = (s: string) => statusMap[s] || { color: 'bg-gray-50 text-gray-400 border-gray-100', icon: Clock };

  const table = useDataTable({ data: reservations || [], searchableKeys: ['id', 'user.email', 'user.name', 'bikeId'], defaultPageSize: 10, storageKey: 'reservations' });

  const columns: DataTableColumn<any>[] = [
    { header: 'Reservation', accessorKey: 'id', cell: (r) => { const SI = getStatus(r.status as string).icon; return (<div className="flex items-center gap-3"><div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border", getStatus(r.status as string).color)}><SI size={18} /></div><div><span className="font-bold text-gray-900 block">#{(r.id as string).slice(0, 8)}</span><span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border inline-block mt-0.5", getStatus(r.status as string).color)}>{r.status as string}</span></div></div>); } },
    { header: 'User', accessorKey: 'user.email', cell: (r) => (<div className="flex items-center gap-2 text-sm text-gray-600"><UserIcon size={14} className="text-gray-400 shrink-0" /><span className="truncate">{(r.user as any)?.email || 'You'}</span></div>) },
    { header: 'Bicycle', accessorKey: 'bikeId', cell: (r) => (<div className="flex items-center gap-2 text-sm font-medium"><BikeIcon size={16} className="text-gray-400" />#{(r.bike as any)?.code || (r.bikeId as string).slice(0, 8)}</div>) },
    { header: 'Time', accessorKey: 'startTime', cell: (r) => (<div className="flex items-center gap-2 text-sm font-medium text-gray-600"><Calendar size={14} className="text-gray-400" />{new Date((r.actualStart || r.startTime) as string).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>) },
    { header: 'Amount', accessorKey: 'priceActual', cell: (r) => (<span className="text-sm font-medium text-gray-600">{(r.priceActual as number) ? `$${r.priceActual} USD` : '—'}</span>) },
    { header: 'Actions', accessorKey: '_actions', align: 'right', exportable: false, cell: (r) => { if (!canUpdate('RESERVATIONS')) return null; return (<div className="flex items-center justify-end gap-2">{r.status === 'CONFIRMED' && (<button onClick={() => setConfirmAction({id: r.id as string, type: 'START'})} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition">Start Ride</button>)}{r.status === 'ACTIVE' && (<button onClick={() => setConfirmAction({id: r.id as string, type: 'COMPLETE'})} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 transition">Complete</button>)}{(r.status === 'CONFIRMED' || r.status === 'PENDING') && (<button onClick={() => setConfirmAction({id: r.id as string, type: 'CANCEL'})} className="bg-gray-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-50 border transition">Cancel</button>)}</div>); } },
  ];

  const filters: DataTableFilter[] = [{ key: 'status', label: 'Status', options: [{ label: 'Pending', value: 'PENDING' }, { label: 'Confirmed', value: 'CONFIRMED' }, { label: 'Active', value: 'ACTIVE' }, { label: 'Completed', value: 'COMPLETED' }, { label: 'Cancelled', value: 'CANCELLED' }, { label: 'No Show', value: 'NO_SHOW' }] }];

  if (!isLoaded) return <LoadingScreen message="Loading Reservations..." />;
  if (!canView('RESERVATIONS')) return <AccessDenied />;

  const totalS = reservations?.length || 0;
  const activeR = reservations?.filter((r: any) => r.status === 'ACTIVE').length || 0;
  const reservedR = reservations?.filter((r: any) => r.status === 'CONFIRMED').length || 0;
  const completedR = reservations?.filter((r: any) => r.status === 'COMPLETED').length || 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-black text-white p-6 rounded-3xl shadow-xl shadow-black/10"><p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Total Sessions</p><h3 className="text-4xl font-bold mt-2">{totalS}</h3></div>
        <div className="bg-white border p-6 rounded-3xl"><p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Active Rentals</p><h3 className="text-4xl font-bold mt-2 text-green-500">{activeR}</h3></div>
        <div className="bg-white border p-6 rounded-3xl"><p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Reserved</p><h3 className="text-4xl font-bold mt-2 text-blue-500">{reservedR}</h3></div>
        <div className="bg-white border p-6 rounded-3xl"><p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Completed</p><h3 className="text-4xl font-bold mt-2">{completedR}</h3></div>
      </div>

      <DataTablePro title="System Reservations" subtitle="Monitor all active and historical rental sessions." data={reservations || []} columns={columns} filters={filters} exportEnabled exportTitle="System Reservations" exportFileName="reservations" searchTerm={table.searchTerm} onSearchChange={table.setSearchTerm} searchPlaceholder="Search by ID, user email or bike..." activeFilters={table.activeFilters} onFilterChange={table.setFilter} currentPage={table.currentPage} totalPages={table.totalPages} pageSize={table.pageSize} onPageChange={table.setCurrentPage} onPageSizeChange={table.setPageSize} startRecord={table.startRecord} endRecord={table.endRecord} filteredCount={table.filteredCount} totalRecords={table.totalRecords} paginatedData={table.paginatedData} filteredData={table.filteredData} isLoading={isLoading} emptyIcon={<Calendar size={40} />} emptyTitle="No reservations found" emptyMessage="No system reservations record found." />

      <ConfirmModal isOpen={!!confirmAction} onClose={() => setConfirmAction(null)} onConfirm={() => confirmAction && actionMutation.mutate(confirmAction)} title={`${confirmAction?.type === 'START' ? 'Start Ride' : confirmAction?.type === 'COMPLETE' ? 'Complete Ride' : 'Cancel Reservation'}`} message={`Are you sure you want to ${confirmAction?.type.toLowerCase()} this reservation?`} confirmText={confirmAction?.type === 'START' ? 'Yes, start it' : confirmAction?.type === 'COMPLETE' ? 'Yes, complete' : 'Yes, cancel'} isLoading={actionMutation.isPending} />
    </div>
  );
}
