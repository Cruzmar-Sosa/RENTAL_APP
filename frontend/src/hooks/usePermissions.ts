'use client';

import { useAuthStore } from '@/store/useAuthStore';

export function usePermissions() {
  const { user, permissions, isLoaded } = useAuthStore();

  // 🔑 ADMIN BYPASS: Admin users always have full access
  const isAdmin = user?.role === 'ADMIN';

  const canView = (module: string) => {
    if (isAdmin) return true;
    return !!permissions?.[module]?.PAGE;
  };

  const canRead = (module: string) => {
    if (isAdmin) return true;
    return !!permissions?.[module]?.READ;
  };

  const canCreate = (module: string) => {
    if (isAdmin) return true;
    return !!permissions?.[module]?.CREATE;
  };

  const canUpdate = (module: string) => {
    if (isAdmin) return true;
    return !!permissions?.[module]?.UPDATE;
  };

  const canDelete = (module: string) => {
    if (isAdmin) return true;
    return !!permissions?.[module]?.DELETE;
  };

  return {
    canView,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    isLoaded,
    isAdmin,
    user
  };
}
