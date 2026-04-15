'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  Calendar, 
  Clock, 
  Bike as BikeIcon, 
  User as UserIcon,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Play,
  Ban
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { AccessDenied } from '@/components/ui/access-denied';
import { useState } from 'react';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { toast } from 'sonner';

export default function ReservationsAdminPage() {
  const { canRead, canView, isLoaded, canUpdate } = usePermissions();
  const queryClient = useQueryClient();

  const [confirmAction, setConfirmAction] = useState<{id: string, type: 'START' | 'COMPLETE' | 'CANCEL'} | null>(null);

  const { data: reservations, isLoading } = useQuery({
    queryKey: ['admin-reservations-detailed', canRead('RESERVATIONS')],
    queryFn: async () => {
      const endpoint = canRead('RESERVATIONS') ? '/reservations' : '/reservations/my';
      const res = await api.get(endpoint);
      return res.data;
    },
    enabled: isLoaded
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, type }: {id: string, type: 'START' | 'COMPLETE' | 'CANCEL'}) => {
      if (type === 'START') return api.patch(`/reservations/${id}/start`);
      if (type === 'COMPLETE') return api.patch(`/reservations/${id}/complete`);
      if (type === 'CANCEL') return api.patch(`/reservations/${id}/cancel`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reservations-detailed'] });
      toast.success(`Reservation ${variables.type.toLowerCase()}ed successfully`);
      setConfirmAction(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to perform action');
      setConfirmAction(null);
    }
  });

  const getStatusDetails = (status: string) => {
    switch(status) {
       case 'PENDING': return { color: 'bg-gray-100 text-gray-500 border-gray-200', icon: Clock };
       case 'CONFIRMED': return { color: 'bg-blue-100 text-blue-600 border-blue-200', icon: CheckCircle };
       case 'ACTIVE': return { color: 'bg-green-100 text-green-600 border-green-300 animate-pulse', icon: Play };
       case 'COMPLETED': return { color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle };
       case 'CANCELLED': return { color: 'bg-red-50 text-red-600 border-red-200', icon: Ban };
       case 'NO_SHOW': return { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: XCircle };
       default: return { color: 'bg-gray-50 text-gray-400 border-gray-100', icon: Clock };
    }
  };

  if (!isLoaded) return <LoadingScreen message="Loading Reservations..." />;
  if (!canView('RESERVATIONS')) return <AccessDenied />;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Reservations</h1>
          <p className="text-gray-500 mt-1">Monitor all active and historical rental sessions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-black text-white p-6 rounded-3xl shadow-xl shadow-black/10">
          <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Total Sessions</p>
          <h3 className="text-4xl font-bold mt-2">{reservations?.length || 0}</h3>
        </div>
        <div className="bg-white border p-6 rounded-3xl">
          <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Active Rentals</p>
          <h3 className="text-4xl font-bold mt-2 text-green-500">
            {reservations?.filter((r: any) => r.status === 'ACTIVE').length || 0}
          </h3>
        </div>
        <div className="bg-white border p-6 rounded-3xl">
          <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Reserved</p>
          <h3 className="text-4xl font-bold mt-2 text-blue-500">
            {reservations?.filter((r: any) => r.status === 'CONFIRMED').length || 0}
          </h3>
        </div>
        <div className="bg-white border p-6 rounded-3xl">
          <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Completed</p>
          <h3 className="text-4xl font-bold mt-2">
            {reservations?.filter((r: any) => r.status === 'COMPLETED').length || 0}
          </h3>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse border" />
          ))
        ) : (
          reservations?.map((r: any) => {
            const StatusIcon = getStatusDetails(r.status).icon;
            return (
              <div key={r.id} className="bg-white border rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-6 w-full md:w-auto">
                  <div className={cn(
                    "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border",
                    getStatusDetails(r.status).color
                  )}>
                    <StatusIcon size={24} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">#{r.id.slice(0, 8)}</span>
                      <span className={cn(
                        "text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border",
                        getStatusDetails(r.status).color
                      )}>
                        {r.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <UserIcon size={14} />
                      <span className="truncate">{r.user?.email || 'You'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-12 w-full md:w-auto overflow-x-auto text-sm">
                  <div className="flex flex-col gap-1 shrink-0">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Bicycle</span>
                    <div className="flex items-center gap-2 font-medium">
                      <BikeIcon size={16} className="text-gray-400" />
                      #{r.bike?.code || r.bikeId.slice(0, 8)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Time</span>
                    <div className="flex items-center gap-2 font-medium">
                      <Calendar size={16} className="text-gray-400" />
                      {new Date(r.actualStart || r.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </div>
                </div>

                {canUpdate('RESERVATIONS') && (
                  <div className="flex items-center gap-2 shrink-0">
                    {r.status === 'CONFIRMED' && (
                      <button 
                        onClick={() => setConfirmAction({id: r.id, type: 'START'})}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition"
                      >
                        Start Ride
                      </button>
                    )}
                    {r.status === 'ACTIVE' && (
                      <button 
                        onClick={() => setConfirmAction({id: r.id, type: 'COMPLETE'})}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition"
                      >
                        Complete
                      </button>
                    )}
                    {(r.status === 'CONFIRMED' || r.status === 'PENDING') && (
                      <button 
                        onClick={() => setConfirmAction({id: r.id, type: 'CANCEL'})}
                        className="bg-gray-100 text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-50 hover:border-red-200 border transition ml-auto"
                      >
                        Cancel
                      </button>
                    )}
                    {r.status === 'COMPLETED' && r.priceActual && (
                       <span className="font-bold text-gray-700 text-lg border-b-2 border-gray-900">${r.priceActual} USD</span>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}

        {!isLoading && reservations?.length === 0 && (
          <div className="bg-gray-50 rounded-3xl p-12 text-center text-gray-400">
            No system reservations record found.
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && actionMutation.mutate(confirmAction)}
        title={`${confirmAction?.type === 'START' ? 'Start Ride' : confirmAction?.type === 'COMPLETE' ? 'Complete Ride' : 'Cancel Reservation'}`}
        message={`Are you sure you want to ${confirmAction?.type.toLowerCase()} this reservation?`}
        confirmText={confirmAction?.type === 'START' ? 'Yes, start it' : confirmAction?.type === 'COMPLETE' ? 'Yes, complete' : 'Yes, cancel'}
        isLoading={actionMutation.isPending}
      />
    </div>
  );
}
