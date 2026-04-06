'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { 
  MapPin, 
  Map,
  Plus, 
  Search, 
  Edit3, 
  Trash2,
  Bike as BikeIcon
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { usePermissions } from '@/hooks/usePermissions';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { AccessDenied } from '@/components/ui/access-denied';

export default function StationsManagementPage() {
  const { canCreate, canUpdate, canDelete, canRead, isLoaded } = usePermissions();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', address: '', latitude: '', longitude: '' });

  const { data: stations, isLoading } = useQuery({
    queryKey: ['admin-stations'],
    queryFn: async () => {
      const res = await api.get('/stations');
      return res.data;
    },
    enabled: isLoaded
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      // Convert lat/long to numbers
      const payload = { ...data, latitude: parseFloat(data.latitude), longitude: parseFloat(data.longitude) };
      if (editingStation) return api.patch(`/stations/${editingStation.id}`, payload);
      return api.post('/stations', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stations'] });
      toast.success(`Station ${editingStation ? 'updated' : 'created'} successfully`);
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to sync station');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/stations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stations'] });
      toast.success('Station deactivated securely');
      setConfirmDelete(null);
    },
    onError: () => {
      toast.error('Cannot remove station. Check if bikes are currently assigned to it.');
      setConfirmDelete(null);
    }
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStation(null);
    setFormData({ name: '', address: '', latitude: '', longitude: '' });
  };

  const openEdit = (station: any) => {
    setEditingStation(station);
    setFormData({ 
      name: station.name, 
      address: station.address || '', 
      latitude: station.latitude.toString(), 
      longitude: station.longitude.toString() 
    });
    setIsModalOpen(true);
  };

  const filteredStations = stations?.filter((s: any) => 
    String(s.code).includes(searchTerm) ||
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isLoaded) return <LoadingScreen message="Loading Stations..." />;
  if (!canRead('STATIONS')) return <AccessDenied />;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black">Stations Management</h1>
          <p className="text-gray-500 mt-1">Configure global deployment zones and bike docks.</p>
        </div>
        {canCreate('STATIONS') && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-black text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-gray-800 transition shadow-lg shadow-black/5"
          >
            <Plus size={20} />
            Add New Station
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by code, name or address..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition"
          />
        </div>
      </div>

      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Station Code</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned Fleet</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={4} className="px-6 py-8"><div className="h-4 bg-gray-100 rounded w-full" /></td>
                </tr>
              ))
            ) : (
              filteredStations?.map((station: any) => (
                <tr key={station.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg text-gray-500 group-hover:bg-black group-hover:text-white transition-colors">
                        <MapPin size={18} />
                      </div>
                      <span className="font-mono text-sm font-bold text-gray-700">Hub #{station.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div>
                      <h3 className="font-bold text-gray-900">{station.name}</h3>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{station.address || 'No address provided'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                       <span className="bg-blue-50 text-blue-700 text-xs font-black px-2.5 py-1 rounded-full border border-blue-100 flex items-center gap-1.5">
                         <BikeIcon size={12} /> {station.bikes?.length || 0}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right flex items-center justify-end gap-2">
                    {canUpdate('STATIONS') && (
                      <button 
                        onClick={() => openEdit(station)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-black transition"
                      >
                        <Edit3 size={16} />
                      </button>
                    )}
                    {canDelete('STATIONS') && (
                      <button 
                        onClick={() => setConfirmDelete(station)}
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
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={editingStation ? 'Update Station' : 'Deploy New Station'}
      >
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData); }} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-gray-400">Station Name</label>
            <input 
              className="w-full bg-gray-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-black/5 font-medium" 
              placeholder="e.g. Central Plaza Hub"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-gray-400">Street Address</label>
            <input 
              className="w-full bg-gray-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-black/5" 
              placeholder="123 Main St, Zone A"
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-400">Latitude</label>
              <input 
                type="number" step="any"
                className="w-full bg-gray-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-black/5 font-mono text-sm" 
                placeholder="21.123"
                value={formData.latitude}
                onChange={e => setFormData({...formData, latitude: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-400">Longitude</label>
              <input 
                type="number" step="any"
                className="w-full bg-gray-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-black/5 font-mono text-sm" 
                placeholder="-101.456"
                value={formData.longitude}
                onChange={e => setFormData({...formData, longitude: e.target.value})}
                required
              />
            </div>
          </div>
          <button 
            type="submit"
            disabled={saveMutation.isPending}
            className="w-full bg-black text-white p-4 rounded-2xl font-bold mt-4 hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Syncing Base...' : 'Save Configuration'}
          </button>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
        title="Remove Station"
        message={`Are you sure you want to permanently remove ${confirmDelete?.name}? This action will fail if there are bikes assigned to it.`}
        confirmText="Remove Station"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
