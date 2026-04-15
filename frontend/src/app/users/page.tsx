'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit2, 
  Trash2, 
  ShieldCheck,
  User as UserIcon
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { usePermissions } from '@/hooks/usePermissions';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { AccessDenied } from '@/components/ui/access-denied';

export default function UsersManagementPage() {
  const { canCreate, canUpdate, canDelete, canRead, isLoaded } = usePermissions();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredUsers = users?.filter((user: any) => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isLoaded) return <LoadingScreen message="Loading Users..." />;
  if (!canRead('USERS')) return <AccessDenied />;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-gray-500 mt-1">Manage platform users, roles, and access controls.</p>
        </div>
        {canCreate('USERS') && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-black text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-gray-800 transition shadow-lg shadow-black/5"
          >
            <UserPlus size={20} />
            Add New User
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition"
          />
        </div>
        <div className="h-8 w-px bg-gray-100" />
        <div className="flex items-center gap-2 px-2">
          <span className="text-sm font-medium text-gray-500">Total:</span>
          <span className="text-sm font-bold bg-gray-100 px-2.5 py-1 rounded-lg">{users?.length || 0}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse border" />
          ))
        ) : (
          filteredUsers?.map((user: any) => (
            <div key={user.id} className={cn(
              "group relative bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300",
              user.role === 'ADMIN' && "border-black/10 bg-black/1"
            )}>
              <div className="flex items-start justify-between">
                <div className={cn(
                  "p-3 rounded-xl",
                  user.role === 'ADMIN' ? "bg-black text-white" : "bg-gray-100 text-gray-600"
                )}>
                  {user.role === 'ADMIN' ? <ShieldCheck size={24} /> : <UserIcon size={24} />}
                </div>
                <div className="flex gap-1">
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
                      onClick={() => setConfirmDelete(user.id)}
                      className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <h3 className="font-bold text-lg leading-tight truncate">{user.name || 'No Name'}</h3>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
                {user.phone && <p className="text-xs text-gray-400 mt-0.5 truncate">📞 {user.phone}</p>}
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-50">
                <span className={cn(
                  "text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md",
                  user.role === 'ADMIN' ? "bg-black/5 text-black" : "bg-gray-100 text-gray-400"
                )}>
                  {user.role}
                </span>
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {!isLoading && filteredUsers?.length === 0 && (
        <div className="bg-white border rounded-3xl p-20 text-center space-y-4">
          <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
            <Users className="text-gray-300" size={40} />
          </div>
          <div>
            <h3 className="text-xl font-bold">No users found</h3>
            <p className="text-gray-500 max-w-xs mx-auto mt-2">Try adjusting your search or add a new user manually.</p>
          </div>
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={editingUser ? 'Edit User' : 'Add New User'}
      >
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
      </Modal>

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
