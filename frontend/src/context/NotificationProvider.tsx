'use client';

import React, { useEffect, useCallback } from 'react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * NotificationProvider
 * Wraps the application to provide notification state and initialization
 * Fetches notifications on mount and can poll for new ones
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  const fetchUnreadCount = useNotificationStore((state) => state.fetchUnreadCount);

  // Initialize notifications on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications(20, 0, false);
      fetchUnreadCount();
    }
  }, [isAuthenticated, fetchNotifications, fetchUnreadCount]);

  // Optional: Poll for new notifications every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const pollInterval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(pollInterval);
  }, [isAuthenticated, fetchUnreadCount]);

  return <>{children}</>;
}

export function useNotifications() {
  return useNotificationStore();
}
