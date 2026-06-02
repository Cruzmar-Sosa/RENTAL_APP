'use client';

import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { useNotifications } from '@/context/NotificationProvider';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning' | 'loading';

interface ToastOptions {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

/**
 * useToast Hook
 * Simplified interface for showing toast notifications
 */
export function useToast() {
  return {
    success: (message: string, options?: ToastOptions) => {
      toast.success(options?.title || 'Success', {
        description: options?.description || message,
        duration: options?.duration || 4000,
        action: options?.action,
      });
    },
    error: (message: string, options?: ToastOptions) => {
      toast.error(options?.title || 'Error', {
        description: options?.description || message,
        duration: options?.duration || 5000,
        action: options?.action,
      });
    },
    warning: (message: string, options?: ToastOptions) => {
      toast.warning(options?.title || 'Warning', {
        description: options?.description || message,
        duration: options?.duration || 4000,
        action: options?.action,
      });
    },
    info: (message: string, options?: ToastOptions) => {
      toast.info(options?.title || 'Info', {
        description: options?.description || message,
        duration: options?.duration || 4000,
        action: options?.action,
      });
    },
    loading: (message: string, options?: ToastOptions) => {
      return toast.loading(options?.title || 'Loading...', {
        description: options?.description || message,
      });
    },
  };
}

/**
 * NotificationToastProvider
 * Hooks into notification store and shows toast for new notifications
 * This component should be placed high in the component tree after NotificationProvider
 */
export function NotificationToastProvider() {
  const { notifications } = useNotifications();
  const toast$ = useToast();

  // Watch for new unread notifications and show toast
  useEffect(() => {
    // Get the most recent unread notification
    const unreadNotifications = notifications.filter((n) => !n.read);
    if (unreadNotifications.length === 0) return;

    const mostRecent = unreadNotifications[0];

    // Map notification types to toast variants and messages
    const toastConfig: Record<string, { variant: ToastVariant; icon?: string }> = {
      BOOKING_CONFIRMED: {
        variant: 'success',
        icon: '✅',
      },
      PAYMENT_SETTLED: {
        variant: 'success',
        icon: '💰',
      },
      CHECK_IN_READY: {
        variant: 'info',
        icon: '📍',
      },
      CHECK_IN_SUCCESSFUL: {
        variant: 'success',
        icon: '🔓',
      },
      RIDE_STARTED: {
        variant: 'info',
        icon: '🚴',
      },
      RIDE_COMPLETED: {
        variant: 'success',
        icon: '🏁',
      },
      DAMAGE_REPORT: {
        variant: 'warning',
        icon: '⚠️',
      },
      REFUND_ISSUED: {
        variant: 'success',
        icon: '💵',
      },
      PAYMENT_DECLINED: {
        variant: 'error',
        icon: '❌',
      },
      SYSTEM_ALERT: {
        variant: 'warning',
        icon: '🔔',
      },
    };

    const config = toastConfig[mostRecent.type] || { variant: 'info' as const };

    // Show the appropriate toast
    const messagePrefix = config.icon ? `${config.icon} ` : '';
    const message = `${messagePrefix}${mostRecent.message}`;

    switch (config.variant) {
      case 'success':
        toast$.success(message, { title: mostRecent.title });
        break;
      case 'error':
        toast$.error(message, { title: mostRecent.title });
        break;
      case 'warning':
        toast$.warning(message, { title: mostRecent.title });
        break;
      case 'info':
      default:
        toast$.info(message, { title: mostRecent.title });
        break;
    }
  }, [notifications, toast$]);

  return null; // This component is just a side-effect handler
}
