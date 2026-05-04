'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { 
  MapPin, 
  Plus, 
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
import { DataTablePro, DataTableColumn } from '@/components/ui/data-table-pro';
import { useDataTable } from '@/hooks/useDataTable';

export default function StationsManagementPage() {
  const { canCreate, canUpdate, canDelete, canRead, isLoaded } = usePermissions();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', address: '', latitude: '', longitude: '', capacity: 10 });

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
    setFormData({ name: '', address: '', latitude: '', longitude: '', capacity: 10 });
  };

  const openEdit = (station: any) => {
    setEditingStation(station);
    setFormData({ 
      name: station.name, 
      address: station.address || '', 
      latitude: station.latitude.toString(), 
      longitude: station.longitude.toString(),
      capacity: station.capacity || 10
    });
    setIsModalOpen(true);
  };

  // ─── DataTablePro Integration ───

  const table = useDataTable({
    data: stations || [],
    searchableKeys: ['code', 'name', 'address'],
    defaultPageSize: 10,
    storageKey: 'stations',
  });

  const columns: DataTableColumn<any>[] = [
    {
      header: 'Station Code',
      accessorKey: 'code',
      cell: (station) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg text-gray-500 group-hover:bg-black group-hover:text-white transition-colors">
            <MapPin size={18} />
          </div>
          <span className="font-mono text-sm font-bold text-gray-700">Hub #{station.code as number}</span>
        </div>
      ),
    },
    {
      header: 'Details',
      accessorKey: 'name',
      cell: (station) => (
        <div>
          <h3 className="font-bold text-gray-900">{station.name as string}</h3>
          <p className="text-xs text-gray-400 mt-1 line-clamp-1">{(station.address as string) || 'No address provided'}</p>
        </div>
      ),
    },
    {
      header: 'Occupation',
      accessorKey: 'capacity',
      align: 'center',
      cell: (station) => {
        const bikeCount = (station.bikes as any[])?.length || 0;
        const capacity = (station.capacity as number) || 10;
        return (
          <div className="flex flex-col items-center gap-2">
            <span className={cn(
              "text-xs font-black px-2.5 py-1 rounded-full border flex items-center gap-1.5",
              bikeCount >= capacity
                ? "bg-red-50 text-red-700 border-red-100" 
                : "bg-blue-50 text-blue-700 border-blue-100"
            )}>
              <BikeIcon size={12} /> {bikeCount} / {capacity}
            </span>
            <div className="w-20 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${Math.min((bikeCount / capacity) * 100, 100)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      align: 'right',
      exportable: false,
      cell: (station) => (
        <div className="flex items-center justify-end gap-2">
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
        </div>
      ),
    },
  ];

  if (!isLoaded) return <LoadingScreen message="Loading Stations..." />;
  if (!canRead('STATIONS')) return <AccessDenied />;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <DataTablePro
        title="Stations Management"
        subtitle="Configure global deployment zones and bike docks."
        data={stations || []}
        columns={columns}
        exportEnabled
        exportTitle="Stations Management"
        exportFileName="stations"
        searchTerm={table.searchTerm}
        onSearchChange={table.setSearchTerm}
        searchPlaceholder="Search by code, name or address..."
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
        emptyIcon={<MapPin size={40} />}
        emptyTitle="No stations found"
        emptyMessage="Deploy your first station to get started."
        headerActions={
          canCreate('STATIONS') ? (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-black text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-gray-800 transition shadow-lg shadow-black/5"
            >
              <Plus size={20} />
              Add New Station
            </button>
          ) : undefined
        }
      />

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
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-gray-400">Station Capacity</label>
            <input 
              type="number" min="1"
              className="w-full bg-gray-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-black/5 font-medium" 
              placeholder="e.g. 10"
              value={formData.capacity}
              onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})}
              required
            />
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
