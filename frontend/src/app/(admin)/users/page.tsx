'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Users, 
  UserPlus, 
  Edit2, 
  Trash2, 
  ShieldCheck,
  User as UserIcon
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

export default function UsersManagementPage() {
  const { canCreate, canUpdate, canDelete, canRead, isLoaded } = usePermissions();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', role: 'USER' });

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data;
    },
    enabled: isLoaded
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User deleted successfully');
      setConfirmDelete(null);
    },
    onError: () => {
      toast.error('Failed to delete user');
      setConfirmDelete(null);
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingUser) return api.patch(`/users/${editingUser.id}`, data);
      return api.post('/users', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(`User ${editingUser ? 'updated' : 'created'} successfully`);
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save user');
    }
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', phone: '', role: 'USER' });
  };

  const openEdit = (user: any) => {
    setEditingUser(user);
    setFormData({ name: user.name || '', email: user.email, password: '', phone: user.phone || '', role: user.role });
    setIsModalOpen(true);
  };

  // ─── DataTablePro Integration ───

  const table = useDataTable({
    data: users || [],
    searchableKeys: ['email', 'name', 'phone', 'code'],
    defaultPageSize: 10,
    storageKey: 'users',
  });

  const columns: DataTableColumn<any>[] = [
    {
      header: 'User',
      accessorKey: 'name',
      cell: (user) => (
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            user.role === 'ADMIN' ? "bg-black text-white" : "bg-gray-100 text-gray-600"
          )}>
            {user.role === 'ADMIN' ? <ShieldCheck size={18} /> : <UserIcon size={18} />}
          </div>
          <div>
            <span className="font-bold text-gray-900 block">{(user.name as string) || 'No Name'}</span>
            <span className="text-xs text-gray-500">{user.email as string}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Phone',
      accessorKey: 'phone',
      cell: (user) => (
        <span className="text-sm text-gray-600">{(user.phone as string) || '—'}</span>
      ),
    },
    {
      header: 'Role',
      accessorKey: 'role',
      cell: (user) => (
        <span className={cn(
          "text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full border",
          user.role === 'ADMIN' 
            ? "bg-black/5 text-black border-black/10" 
            : "bg-gray-100 text-gray-500 border-gray-200"
        )}>
          {user.role as string}
        </span>
      ),
    },
    {
      header: 'Joined',
      accessorKey: 'createdAt',
      cell: (user) => (
        <span className="text-xs text-gray-400 font-medium">
          {new Date(user.createdAt as string).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      align: 'right',
      exportable: false,
      cell: (user) => (
        <div className="flex items-center justify-end gap-1">
          {canUpdate('USERS') && (
            <button 
              onClick={() => openEdit(user)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-black transition"
            >
              <Edit2 size={16} />
            </button>
          )}
          {canDelete('USERS') && (
            <button 
              onClick={() => setConfirmDelete(user.id as string)}
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
      key: 'role',
      label: 'Role',
      options: [
        { label: 'Admin', value: 'ADMIN' },
        { label: 'User', value: 'USER' },
      ],
    },
  ];

  if (!isLoaded) return <LoadingScreen message="Loading Users..." />;
  if (!canRead('USERS')) return <AccessDenied />;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <DataTablePro
        title="User Management"
        subtitle="Manage platform users, roles, and access controls."
        data={users || []}
        columns={columns}
        filters={filters}
        exportEnabled
        exportTitle="User Management"
        exportFileName="users"
        searchTerm={table.searchTerm}
        onSearchChange={table.setSearchTerm}
        searchPlaceholder="Search by name, email or phone..."
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
        emptyIcon={<Users size={40} />}
        emptyTitle="No users found"
        emptyMessage="Try adjusting your search or add a new user manually."
        headerActions={
          canCreate('USERS') ? (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-black text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-gray-800 transition shadow-lg shadow-black/5"
            >
              <UserPlus size={20} />
              Add New User
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
            <h2 className="text-2xl font-black text-gray-900">{editingUser ? 'Edit User' : 'Add New User'}</h2>
            <p className="text-gray-500 text-sm font-medium">Manage profile and access levels.</p>
          </div>

        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData); }} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-gray-400">Full Name</label>
            <input 
              className="w-full bg-gray-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-black/5" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-gray-400">Email</label>
            <input 
              type="email"
              className="w-full bg-gray-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-black/5" 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-gray-400">Password {editingUser && '(Leave blank to keep current)'}</label>
            <input 
              type="password"
              className="w-full bg-gray-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-black/5" 
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              required={!editingUser}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-gray-400">Phone (Optional)</label>
            <input 
              type="tel"
              placeholder="+52 477 000 0000"
              className="w-full bg-gray-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-black/5" 
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-gray-400">Role</label>
            <select 
              className="w-full bg-gray-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-black/5 appearance-none" 
              value={formData.role}
              onChange={e => setFormData({...formData, role: e.target.value})}
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <button 
            type="submit"
            disabled={saveMutation.isPending}
            className="w-full bg-black text-white p-4 rounded-2xl font-bold mt-4 hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save User'}
          </button>
        </form>
        </div>
      </BaseModal>

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete)}
        title="Delete User"
        message="Are you sure you want to permanently remove this user? This action cannot be undone."
        confirmText="Delete User"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
