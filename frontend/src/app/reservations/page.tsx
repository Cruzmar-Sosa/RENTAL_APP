'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import { Calendar, Bike as BikeIcon, User as UserIcon, CheckCircle, XCircle, Clock, Play, Ban, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { AccessDenied } from '@/components/ui/access-denied';
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { CheckInModal } from '@/components/modals/CheckInModal';
import { SettlementModal } from '@/components/modals/SettlementModal';
import { ReservationDetailModal } from '@/components/modals/ReservationDetailModal';
import { toast } from 'sonner';
import { DataTablePro, DataTableColumn, DataTableFilter } from '@/components/ui/data-table-pro';
import { useDataTable } from '@/hooks/useDataTable';
import { formatNIDate } from '@/lib/dateUtils';

export default function ReservationsAdminPage() {
  const { canRead, canView, isLoaded, canUpdate } = usePermissions();
  const queryClient = useQueryClient();
  
  // Selection States
  const [selectedResId, setSelectedResId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [activeReservation, setActiveReservation] = useState<any>(null);

  const { data: reservations, isLoading, refetch } = useQuery({
    queryKey: ['reservations', canRead('RESERVATIONS')],
    queryFn: async () => {
      return (await api.get('/reservations')).data;
    },
    enabled: isLoaded
  });

  // Real-time Expiration Listener (Guard 4)
  useEffect(() => {
    if (!isLoaded) return;

    const wsUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    const socket = io(`${wsUrl}/tracking`, {
      path: '/socket.io',
      transports: ['websocket'],
    });

    socket.on('reservation_expired', (data: { bikeId: string, reservationId: string }) => {
      console.log('🔔 Reservation Expired Real-time:', data);
      toast.info(`Reservation #${data.reservationId.slice(0,8)} expired.`);
      refetch();
    });

    return () => {
      socket.disconnect();
    };
  }, [isLoaded, refetch]);

  const actionMutation = useMutation({
    mutationFn: async ({ id, type, data }: {id: string, type: 'start' | 'complete' | 'cancel', data?: any}) => {
      return api.patch(`/reservations/${id}/${type}`, data);
    },
    onSuccess: (_, v) => { 
      queryClient.invalidateQueries({ queryKey: ['reservations'] }); 
      toast.success(`Reservation ${v.type}ed successfully`); 
      setCancelConfirmOpen(false);
    },
    onError: (err: any) => { toast.error(err.response?.data?.message || 'Action failed'); }
  });

  const handleOpenDetail = (id: string) => {
    setSelectedResId(id);
    setDetailModalOpen(true);
  };

  const handleOpenCheckIn = (res: any) => {
    setActiveReservation(res);
    setCheckInModalOpen(true);
  };

  const handleOpenSettlement = (res: any) => {
    setActiveReservation(res);
    setSettlementModalOpen(true);
  };

  const statusMap: Record<string, { color: string; icon: any }> = {
    PENDING: { color: 'bg-gray-100 text-gray-500 border-gray-200', icon: Clock },
    CONFIRMED: { color: 'bg-blue-100 text-blue-600 border-blue-200', icon: CheckCircle },
    ACTIVE: { color: 'bg-emerald-100 text-emerald-600 border-emerald-300', icon: Play },
    COMPLETED: { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: CheckCircle },
    CANCELLED: { color: 'bg-red-50 text-red-600 border-red-200', icon: Ban },
    NO_SHOW: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: XCircle },
  };
  const getStatus = (s: string) => statusMap[s] || { color: 'bg-gray-50 text-gray-400 border-gray-100', icon: Clock };

  const table = useDataTable({ 
    data: reservations || [], 
    searchableKeys: ['id', 'user.email', 'user.name', 'bikeId', 'clientName', 'guestName'], 
    defaultPageSize: 10, 
    storageKey: 'reservations' 
  });

  const columns: DataTableColumn<any>[] = [
    { 
      header: 'Reservation', 
      accessorKey: 'id', 
      cell: (r) => { 
        const SI = getStatus(r.status as string).icon; 
        return (
          <div className="flex items-center gap-3">
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border", getStatus(r.status as string).color)}>
              <SI size={18} />
            </div>
            <div>
              <span className="font-bold text-gray-900 block truncate max-w-[80px]">#{(r.id as string).slice(0, 8)}</span>
              <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border inline-block mt-0.5", getStatus(r.status as string).color)}>
                {r.status as string}
              </span>
            </div>
          </div>
        ); 
      } 
    },
    { 
      header: 'Client', 
      accessorKey: 'user.name', 
      cell: (r) => (
        <div className="flex flex-col">
          <span className="font-bold text-gray-900 truncate max-w-[120px]">
            {(r.guestName || r.clientName || (r.user as any)?.name || 'Unknown')}
          </span>
          <span className="text-[10px] text-gray-500 truncate max-w-[120px]">
            {(r.user as any)?.email || 'Walk-in'}
          </span>
        </div>
      ) 
    },
    { 
      header: 'Bicycle', 
      accessorKey: 'bike.code', 
      cell: (r) => (
        <div className="flex items-center gap-2 text-sm font-medium">
          <BikeIcon size={16} className="text-gray-400" />
          #{ (r.bike as any)?.code || (r.bikeId as string).slice(0, 4) }
        </div>
      ) 
    },
    { 
      header: 'Start Time', 
      accessorKey: 'startTime', 
      cell: (r) => (
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <Calendar size={14} className="text-gray-400" />
          {formatNIDate((r.actualStart || r.startTime) as string)}
        </div>
      ) 
    },
    { 
      header: 'Financial', 
      accessorKey: 'priceActual', 
      cell: (r) => (
        <div className="flex flex-col">
           <span className="text-sm font-black text-gray-900">
            ${(r.priceActual || r.priceEstimated || 0).toFixed(2)}
           </span>
           <span className="text-[10px] font-bold text-gray-400 uppercase">
             {r.status === 'COMPLETED' ? 'Final' : 'Est.'}
           </span>
        </div>
      ) 
    },
    { 
      header: 'Actions', 
      accessorKey: '_actions', 
      align: 'right', 
      exportable: false, 
      cell: (r) => { 
        return (
          <div className="flex items-center justify-end gap-2">
            <button 
              onClick={() => handleOpenDetail(r.id)} 
              className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition"
              title="View Details"
            >
              <Eye size={18} />
            </button>
            
            {canUpdate('RESERVATIONS') && (
              <>
                {r.status === 'CONFIRMED' && (
                  <button 
                    onClick={() => handleOpenCheckIn(r)} 
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                  >
                    Start Ride
                  </button>
                )}
                {r.status === 'ACTIVE' && (
                  <button 
                    onClick={() => handleOpenSettlement(r)} 
                    className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition"
                  >
                    Settlement
                  </button>
                )}
                {(r.status === 'CONFIRMED' || r.status === 'PENDING') && (
                  <button 
                    onClick={() => { setSelectedResId(r.id); setCancelConfirmOpen(true); }} 
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                    title="Cancel"
                  >
                    <Ban size={18} />
                  </button>
                )}
              </>
            )}
          </div>
        ); 
      } 
    },
  ];

  const filters: DataTableFilter[] = [{ key: 'status', label: 'Status', options: [{ label: 'Pending', value: 'PENDING' }, { label: 'Confirmed', value: 'CONFIRMED' }, { label: 'Active', value: 'ACTIVE' }, { label: 'Completed', value: 'COMPLETED' }, { label: 'Cancelled', value: 'CANCELLED' }, { label: 'No Show', value: 'NO_SHOW' }] }];

  if (!isLoaded) return <LoadingScreen message="Loading Reservations..." />;
  if (!canView('RESERVATIONS')) return <AccessDenied />;

  const totalS = reservations?.length || 0;
  const activeR = reservations?.filter((r: any) => r.status === 'ACTIVE').length || 0;
  const reservedR = reservations?.filter((r: any) => r.status === 'CONFIRMED').length || 0;
  const completedR = reservations?.filter((r: any) => r.status === 'COMPLETED').length || 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-black text-white p-6 rounded-[2rem] shadow-xl shadow-black/10 border border-white/10 transition-transform hover:scale-[1.02]">
          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Global Sessions</p>
          <h3 className="text-5xl font-black mt-2 leading-none">{totalS}</h3>
        </div>
        <div className="bg-white border-2 border-gray-100 p-6 rounded-[2rem] transition-transform hover:scale-[1.02]">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Active Fleet</p>
          <h3 className="text-5xl font-black mt-2 text-emerald-500 leading-none">{activeR}</h3>
        </div>
        <div className="bg-white border-2 border-gray-100 p-6 rounded-[2rem] transition-transform hover:scale-[1.02]">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Confirmed</p>
          <h3 className="text-5xl font-black mt-2 text-blue-500 leading-none">{reservedR}</h3>
        </div>
        <div className="bg-white border-2 border-gray-100 p-6 rounded-[2rem] transition-transform hover:scale-[1.02]">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Finalized</p>
          <h3 className="text-5xl font-black mt-2 text-gray-900 leading-none">{completedR}</h3>
        </div>
      </div>

      <DataTablePro 
        title={canUpdate('RESERVATIONS') ? "Fleet Reservations" : "My Reservations"} 
        subtitle={canUpdate('RESERVATIONS') ? "Manage end-to-end rental lifecycle: creation, check-in, and settlement." : "View and manage your personal reservations."} 
        data={reservations || []} 
        columns={columns} 
        filters={filters} 
        exportEnabled 
        exportTitle={canUpdate('RESERVATIONS') ? "Fleet Reservations" : "My Reservations"} 
        exportFileName="reservations" 
        searchTerm={table.searchTerm} 
        onSearchChange={table.setSearchTerm} 
        searchPlaceholder="Search by ID, client, bike..." 
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
        emptyIcon={<Calendar size={40} />} 
        emptyTitle="No reservations found" 
        emptyMessage="Start by creating a new reservation from the dashboard." 
      />

      {/* MODALS */}
      <ReservationDetailModal 
        isOpen={detailModalOpen} 
        onClose={() => setDetailModalOpen(false)} 
        reservationId={selectedResId} 
      />

      <CheckInModal 
        isOpen={checkInModalOpen} 
        onClose={() => setCheckInModalOpen(false)} 
        reservation={activeReservation} 
        onConfirm={async (id, data) => {
          await actionMutation.mutateAsync({ id, type: 'start', data });
        }}
      />

      <SettlementModal 
        isOpen={settlementModalOpen} 
        onClose={() => setSettlementModalOpen(false)} 
        reservation={activeReservation} 
        onConfirm={async (id, action, data) => {
          await actionMutation.mutateAsync({ id, type: 'complete', data });
        }}
      />

      <ConfirmModal 
        isOpen={cancelConfirmOpen} 
        onClose={() => setCancelConfirmOpen(false)} 
        onConfirm={() => selectedResId && actionMutation.mutate({ id: selectedResId, type: 'cancel' })} 
        title="Cancel Reservation" 
        message="Are you sure you want to cancel this reservation? This will make the bike available for other users." 
        confirmText="Yes, Cancel" 
        isLoading={actionMutation.isPending} 
      />
    </div>
  );
}
