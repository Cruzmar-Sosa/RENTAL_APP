'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Bike as BikeIcon, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  MapPin,
  CheckCircle2,
  AlertCircle,
  Wrench
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { usePermissions } from '@/hooks/usePermissions';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { AccessDenied } from '@/components/ui/access-denied';

export default function BikesManagementPage() {
  const { canCreate, canUpdate, canDelete, canRead, isLoaded } = usePermissions();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: bikes, isLoading } = useQuery({
    queryKey: ['admin-bikes'],
    queryFn: async () => {
      const res = await api.get('/bikes');
      return res.data;
    },
    enabled: isLoaded
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/bikes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bikes'] });
      toast.success('Bike removed from fleet');
      setConfirmDelete(null);
    },
    onError: () => {
      toast.error('Failed to delete bike');
      setConfirmDelete(null);
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-700 border-green-200';
      case 'RESERVED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'MAINTENANCE': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return <CheckCircle2 size={14} />;
      case 'RESERVED': return <AlertCircle size={14} />;
      case 'MAINTENANCE': return <Wrench size={14} />;
      default: return null;
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBike, setEditingBike] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({ id: '', status: 'AVAILABLE', stationId: '' });

  const { data: stations } = useQuery({
    queryKey: ['admin-stations-small'],
    queryFn: async () => {
      const res = await api.get('/stations');
      return res.data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingBike) return api.patch(`/bikes/${editingBike.id}`, data);
      return api.post('/bikes', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bikes'] });
      toast.success(`Bike ${editingBike ? 'updated' : 'added'} to fleet`);
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to sync bike');
    }
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBike(null);
    setFormData({ id: '', status: 'AVAILABLE', stationId: '' });
  };

  const openEdit = (bike: any) => {
    setEditingBike(bike);
    setFormData({ id: bike.id, status: bike.status, stationId: bike.stationId || '' });
    setIsModalOpen(true);
  };

  const filteredBikes = bikes?.filter((bike: any) => 
    String(bike.code).includes(searchTerm) ||
    bike.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bike.station?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isLoaded) return <LoadingScreen message="Loading Fleet..." />;
  if (!canRead('BIKES')) return <AccessDenied />;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black">Fleet Management</h1>
          <p className="text-gray-500 mt-1">Manage bicycles, status, and station assignments.</p>
        </div>
        {canCreate('BIKES') && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-black text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-gray-800 transition shadow-lg shadow-black/5"
          >
            <Plus size={20} />
            Add New Bike
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by ID or Station..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition"
          />
        </div>
        <div className="h-8 w-px bg-gray-100" />
        <div className="flex items-center gap-2 px-2">
          <span className="text-sm font-medium text-gray-500">Fleet Size:</span>
          <span className="text-sm font-bold bg-black text-white px-2.5 py-1 rounded-lg">{bikes?.length || 0}</span>
        </div>
      </div>

      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Bike ID</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Current Station</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Last Sync</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="px-6 py-8"><div className="h-4 bg-gray-100 rounded w-full" /></td>
                </tr>
              ))
            ) : (
              filteredBikes?.map((bike: any) => (
                <tr key={bike.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg text-gray-500 group-hover:bg-black group-hover:text-white transition-colors">
                        <BikeIcon size={18} />
                      </div>
                      <span className="font-mono text-sm font-bold text-gray-700">#{bike.code || bike.id.slice(0, 13)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-tight border",
                      getStatusColor(bike.status)
                    )}>
                      {getStatusIcon(bike.status)}
                      {bike.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                      <MapPin size={14} className="text-gray-400" />
                      {bike.station?.name || 'In Transit / Maintenance'}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs text-gray-400 font-medium">
                      {new Date(bike.updatedAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right flex items-center justify-end gap-2">
                    {canUpdate('BIKES') && (
                      <button 
                        onClick={() => openEdit(bike)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-black transition"
                      >
                        <Edit3 size={16} />
                      </button>
                    )}
                    {canDelete('BIKES') && (
                      <button 
                        onClick={() => setConfirmDelete(bike.id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {!isLoading && filteredBikes?.length === 0 && (
          <div className="p-20 text-center space-y-4">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
              <BikeIcon className="text-gray-300" size={40} />
            </div>
            <div>
              <h3 className="text-xl font-bold">No bikes found</h3>
              <p className="text-gray-500 max-w-xs mx-auto mt-2">No hardware matches your current filters.</p>
            </div>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={editingBike ? 'Update Unit' : 'Add New Unit'}
      >
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData); }} className="space-y-4">
          {!editingBike && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-400">Hardware ID</label>
              <input 
                className="w-full bg-gray-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-black/5 font-mono" 
                placeholder="unit-xxxx-xxxx"
                value={formData.id}
                onChange={e => setFormData({...formData, id: e.target.value})}
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-gray-400">Deploy Status</label>
            <select 
              className="w-full bg-gray-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-black/5 appearance-none" 
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value})}
            >
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
              <option value="RESERVED">RESERVED</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-gray-400">Assigned Station</label>
            <select 
              className="w-full bg-gray-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-black/5 appearance-none" 
              value={formData.stationId}
              onChange={e => setFormData({...formData, stationId: e.target.value})}
              required
            >
              <option value="">Select Station...</option>
              {stations?.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <button 
            type="submit"
            disabled={saveMutation.isPending}
            className="w-full bg-black text-white p-4 rounded-2xl font-bold mt-4 hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Syncing...' : 'Save Unit Config'}
          </button>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete)}
        title="Remove Bicycle"
        message="Are you sure you want to permanently remove this bicycle from the fleet?"
        confirmText="Remove Bike"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
