'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Settings, Edit2, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { usePermissions } from '@/hooks/usePermissions';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { AccessDenied } from '@/components/ui/access-denied';

const ALL_MODULES = ['USERS', 'BIKES', 'STATIONS', 'RESERVATIONS', 'SETTINGS'];

export default function SettingsManagementPage() {
  const { canRead, isLoaded } = usePermissions();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  // Matrix map: Module -> Action -> Allowed boolean
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});

  const { data: users } = useQuery({
    queryKey: ['admin-users-settings'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data;
    },
    enabled: isLoaded
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      // First update role if needed
      await api.patch(`/users/${editingUser.id}`, { role: editingUser.role });
      // Map matrix to flat array of { module, action, allowed: true }
      // The backend handles wiping olds and creating explicit overrides
      const payload: any[] = [];
      Object.entries(data).forEach(([module, actions]: [string, any]) => {
        if (actions.PAGE) payload.push({ module, action: 'PAGE', allowed: true });
        if (actions.CREATE && actions.PAGE) payload.push({ module, action: 'CREATE', allowed: true });
        if (actions.READ && actions.PAGE) payload.push({ module, action: 'READ', allowed: true });
        if (actions.UPDATE && actions.PAGE) payload.push({ module, action: 'UPDATE', allowed: true });
        if (actions.DELETE && actions.PAGE) payload.push({ module, action: 'DELETE', allowed: true });
      });

      return api.patch(`/users/${editingUser.id}/permissions`, { permissions: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-settings'] });
      toast.success('Permissions updated successfully!');
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update permissions');
    }
  });

  const openEdit = (user: any) => {
    setEditingUser(user);
    // Initialize matrix from user overrides
    const newMatrix: Record<string, Record<string, boolean>> = {};
    ALL_MODULES.forEach(module => {
      newMatrix[module] = { PAGE: false, CREATE: false, READ: false, UPDATE: false, DELETE: false };
    });

    user.permissions?.forEach((up: any) => {
      if (up.allowed && newMatrix[up.permission.module]) {
        newMatrix[up.permission.module][up.permission.action] = true;
      }
    });

    setMatrix(newMatrix);
    setIsModalOpen(true);
  };

  const toggleAction = (module: string, action: string, value: boolean) => {
    setMatrix(prev => {
      const next = { ...prev, [module]: { ...prev[module], [action]: value } };
      // If PAGE toggled OFF, uncheck children explicitly
      if (action === 'PAGE' && !value) {
        next[module].CREATE = false;
        next[module].READ = false;
        next[module].UPDATE = false;
        next[module].DELETE = false;
      }
      return next;
    });
  };

  if (!isLoaded) return <LoadingScreen message="Loading Permissions matrix..." />;
  if (!canRead('SETTINGS')) return <AccessDenied />;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black">System Settings</h1>
          <p className="text-gray-500 mt-1">Manage platform roles and granular access permissions.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-medium uppercase text-[10px] tracking-wider border-b">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">System Role</th>
              <th className="px-6 py-4">Custom Permissions</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users?.map((user: any) => (
              <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
                      {user.role === 'ADMIN' ? <ShieldCheck size={18} /> : <UserIcon size={18} />}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{user.name || 'Unnamed'}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold",
                    user.role === 'ADMIN' ? "bg-black text-white" : "bg-gray-100 text-gray-600"
                  )}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-5 text-gray-500">
                  {user.permissions?.length > 0 ? (
                    <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg">
                      {user.permissions.length} overrides active
                    </span>
                  ) : (
                    <span className="text-xs italic">Default access only</span>
                  )}
                </td>
                <td className="px-6 py-5 text-right flex justify-end">
                  <button 
                    onClick={() => openEdit(user)}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-black transition flex items-center gap-2 text-xs font-medium"
                  >
                    <Settings size={16} /> Manage Access
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Manage User Access"
      >
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-xl space-y-2 border">
            <h3 className="font-bold">{editingUser?.name || editingUser?.email}</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Global Role</span>
              <select 
                title="Global Role"
                className="bg-white border rounded-lg px-3 py-1.5 text-sm font-medium outline-none"
                value={editingUser?.role || 'USER'}
                onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            {editingUser?.role === 'ADMIN' && (
              <p className="text-xs text-gray-400 mt-2">
                ADMINs usually have full access by default. Overrides here will apply if roles change.
              </p>
            )}
          </div>

          <div>
            <h4 className="font-bold text-sm mb-3">Granular Permissions Matrix</h4>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
              {ALL_MODULES.map(module => (
                <div key={module} className="border rounded-xl p-4 bg-white shadow-sm space-y-3">
                  {/* Parent PAGE Checkbox */}
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                    <input 
                      type="checkbox"
                      className="w-5 h-5 rounded cursor-pointer accent-black"
                      checked={matrix[module]?.PAGE || false}
                      onChange={(e) => toggleAction(module, 'PAGE', e.target.checked)}
                    />
                    <div className="font-black text-xs uppercase tracking-widest bg-gray-100 px-3 py-1 rounded">
                      [ PAGE ] {module}
                    </div>
                  </div>
                  
                  {/* Children CRUD Checkboxes */}
                  {matrix[module]?.PAGE && (
                    <div className="flex gap-4 pl-8 pt-1">
                      {['CREATE', 'READ', 'UPDATE', 'DELETE'].map(action => (
                        <label key={action} className="flex flex-col flex-1 items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-100 transition">
                          <span className="text-[10px] uppercase font-bold text-gray-500">{action}</span>
                          <input 
                            title={`${action} ${module}`}
                            type="checkbox" 
                            className="w-4 h-4 rounded text-black cursor-pointer accent-black"
                            checked={matrix[module]?.[action] || false}
                            onChange={(e) => toggleAction(module, action, e.target.checked)}
                          />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => saveMutation.mutate(matrix)}
            disabled={saveMutation.isPending}
            className="w-full bg-black text-white p-4 rounded-2xl font-bold hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50 shadow-xl shadow-black/10"
          >
            {saveMutation.isPending ? 'Applying Changes...' : 'Save Permissions'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
