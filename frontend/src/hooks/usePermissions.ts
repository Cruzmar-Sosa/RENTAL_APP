'use client';

import { useAuthStore } from '@/store/useAuthStore';

export function usePermissions() {
  const { user, permissions, isLoaded } = useAuthStore();

  const canView = (module: string) => {
    return !!permissions?.[module]?.PAGE;
  };

  const canRead = (module: string) => {
    return !!permissions?.[module]?.READ;
  };

  const canCreate = (module: string) => {
    return !!permissions?.[module]?.CREATE;
  };

  const canUpdate = (module: string) => {
    return !!permissions?.[module]?.UPDATE;
  };

  const canDelete = (module: string) => {
    return !!permissions?.[module]?.DELETE;
  };

  return {
    canView,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    isLoaded,
    user
  };
}
