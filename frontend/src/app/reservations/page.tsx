'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  Calendar, 
  Clock, 
  Bike as BikeIcon, 
  User as UserIcon,
  CheckCircle,
  XCircle,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { AccessDenied } from '@/components/ui/access-denied';

export default function ReservationsAdminPage() {
  const { canRead, canView, isLoaded } = usePermissions();

  const { data: reservations, isLoading } = useQuery({
    queryKey: ['admin-reservations-detailed', canRead('RESERVATIONS')],
    queryFn: async () => {
      const endpoint = canRead('RESERVATIONS') ? '/reservations' : '/reservations/my';
      const res = await api.get(endpoint);
      return res.data;
    },
    enabled: isLoaded
  });

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
          reservations?.map((r: any) => (
            <div key={r.id} className="bg-white border rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-6 w-full md:w-auto">
                <div className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
                  r.status === 'ACTIVE' ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                )}>
                  {r.status === 'ACTIVE' ? <Clock size={24} /> : <CheckCircle size={24} />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">#{r.id.slice(0, 8)}</span>
                    <span className={cn(
                      "text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider",
                      r.status === 'ACTIVE' ? "bg-green-50 text-green-600 border-green-100" : "bg-gray-50 text-gray-400 border-gray-100"
                    )}>
                      {r.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <UserIcon size={14} />
                    <span className="truncate">{r.user?.email}</span>
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
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Started At</span>
                  <div className="flex items-center gap-2 font-medium">
                    <Calendar size={16} className="text-gray-400" />
                    {new Date(r.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 transition ml-auto">
                  <MoreHorizontal size={20} />
                </button>
              </div>
            </div>
          ))
        )}

        {!isLoading && reservations?.length === 0 && (
          <div className="bg-gray-50 rounded-3xl p-12 text-center text-gray-400">
            No system reservations record found.
          </div>
        )}
      </div>
    </div>
  );
}
