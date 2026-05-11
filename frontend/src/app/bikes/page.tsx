'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Bike as BikeIcon, 
  Plus, 
  Edit3, 
  Trash2, 
  MapPin,
  CheckCircle2,
  AlertCircle,
  Wrench
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { BaseModal } from '@/components/ui/BaseModal';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { usePermissions } from '@/hooks/usePermissions';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { AccessDenied } from '@/components/ui/access-denied';
import { DataTablePro, DataTableColumn, DataTableFilter } from '@/components/ui/data-table-pro';
import { useDataTable } from '@/hooks/useDataTable';
import { BikeImageUpload } from '@/components/bikes/BikeImageUpload';
import { getBikeImageUrl } from '@/lib/storageUtils';

export default function BikesManagementPage() {
  const { canCreate, canUpdate, canDelete, canRead, isLoaded } = usePermissions();
  const queryClient = useQueryClient();

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
      case 'IN_USE': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'MAINTENANCE': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return <CheckCircle2 size={14} />;
      case 'IN_USE': return <AlertCircle size={14} />;
      case 'MAINTENANCE': return <Wrench size={14} />;
      default: return null;
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBike, setEditingBike] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({ id: '', status: 'AVAILABLE', stationId: '', model: 'eTours Pro', batteryLevel: 100 });

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
    setFormData({ id: '', status: 'AVAILABLE', stationId: '', model: 'eTours Pro', batteryLevel: 100 });
  };

  const openEdit = (bike: any) => {
    setEditingBike(bike);
    setFormData({ 
      id: bike.id, 
      status: bike.status, 
      stationId: bike.stationId || '',
      model: bike.model || 'eTours Pro',
      batteryLevel: bike.batteryLevel || 100
    });
    setIsModalOpen(true);
  };

  // ─── DataTablePro Integration ───

  const table = useDataTable({
    data: bikes || [],
    searchableKeys: ['code', 'id', 'station.name', 'model'],
    defaultPageSize: 10,
    storageKey: 'bikes',
  });

  const columns: DataTableColumn<any>[] = [
    {
      header: 'Bike ID / Model',
      accessorKey: 'code',
      cell: (bike) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center bg-gray-50 group-hover:border-black transition-colors shrink-0">
            {getBikeImageUrl(bike) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getBikeImageUrl(bike)!} alt={bike.model} className="w-full h-full object-cover" />
            ) : (
              <BikeIcon size={18} className="text-gray-400 group-hover:text-black transition-colors" />
            )}
          </div>
          <div>
            <span className="font-mono text-sm font-bold text-gray-700 block">#{bike.code || (bike.id as string).slice(0, 8)}</span>
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">{(bike.model as string) || 'eTours Pro'}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Status / Battery',
      accessorKey: 'status',
      cell: (bike) => (
        <div className="flex flex-col gap-1.5">
          <span className={cn(
            "inline-flex w-fit items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-tight border",
            getStatusColor(bike.status as string)
          )}>
            {getStatusIcon(bike.status as string)}
            {bike.status as string}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="flex-1 h-1 w-16 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-500",
                  (bike.batteryLevel as number) > 50 ? "bg-green-500" : (bike.batteryLevel as number) > 20 ? "bg-amber-500" : "bg-red-500"
                )}
                style={{ width: `${bike.batteryLevel}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-gray-400">{bike.batteryLevel as number}%</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Current Station',
      accessorKey: 'station.name',
      cell: (bike) => (
        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
          <MapPin size={14} className="text-gray-400" />
          {(bike.station as any)?.name || 'In Transit / Maintenance'}
        </div>
      ),
    },
    {
      header: 'Last Sync',
      accessorKey: 'updatedAt',
      cell: (bike) => (
        <span className="text-xs text-gray-400 font-medium">
          {new Date(bike.updatedAt as string).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      align: 'right',
      exportable: false,
      cell: (bike) => (
        <div className="flex items-center justify-end gap-2">
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
              onClick={() => setConfirmDelete(bike.id as string)}
              className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  const filters: DataTableFilter[] = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Available', value: 'AVAILABLE' },
        { label: 'In Use', value: 'IN_USE' },
        { label: 'Maintenance', value: 'MAINTENANCE' },
        { label: 'Reserved', value: 'RESERVED' },
      ],
    },
  ];

  if (!isLoaded) return <LoadingScreen message={`Loading Fleet ...`} />;
  if (!canRead('BIKES')) return <AccessDenied />;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <DataTablePro
        title="Fleet Management"
        subtitle="Manage bicycles, status, and station assignments."
        data={bikes || []}
        columns={columns}
        filters={filters}
        exportEnabled
        exportTitle="Fleet Management — Bikes"
        exportFileName="bikes_fleet"
        searchTerm={table.searchTerm}
        onSearchChange={table.setSearchTerm}
        searchPlaceholder="Search by ID, model or station..."
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
        emptyIcon={<BikeIcon size={40} />}
        emptyTitle="No bikes found"
        emptyMessage="No hardware matches your current filters."
        headerActions={
          canCreate('BIKES') ? (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-black text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-gray-800 transition shadow-lg shadow-black/5"
            >
              <Plus size={20} />
              Add New Bike
            </button>
          ) : undefined
        }
      />

      <BaseModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        showFooter={false}
      >
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900">{editingBike ? 'Update Unit' : 'Add New Unit'}</h2>
            <p className="text-gray-500 text-sm font-medium">Configure hardware and station assignment.</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData); }} className="space-y-4">
          {editingBike && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-400">Unit Media</label>
              <BikeImageUpload
                bikeId={editingBike.id}
                currentImageKey={editingBike.imageKey}
                onUploadSuccess={(newKey, newUrl) => {
                  setEditingBike({ ...editingBike, imageKey: newKey, imageUrl: newUrl });
                  queryClient.invalidateQueries({ queryKey: ['admin-bikes'] });
                }}
              />
            </div>
          )}
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
              <option value="IN_USE">IN_USE</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-400">Model</label>
              <input 
                className="w-full bg-gray-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-black/5" 
                value={formData.model}
                onChange={e => setFormData({...formData, model: e.target.value})}
                placeholder="eTours Pro"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-400">Battery (%)</label>
              <input 
                type="number" min="0" max="100"
                className="w-full bg-gray-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-black/5" 
                value={formData.batteryLevel}
                onChange={e => setFormData({...formData, batteryLevel: parseInt(e.target.value)})}
              />
            </div>
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
        </div>
      </BaseModal>

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
