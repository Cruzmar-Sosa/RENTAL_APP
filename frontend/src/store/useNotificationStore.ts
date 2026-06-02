import { create } from 'zustand';
import { api } from '@/lib/api';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchNotifications: (limit?: number, offset?: number, unreadOnly?: boolean) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  markRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearOldNotifications: (days?: number) => Promise<void>;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async (limit = 20, offset = 0, unreadOnly = false) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/notifications', {
        params: { limit, offset, unreadOnly },
      });
      set({
        notifications: response.data.notifications,
        unreadCount: response.data.notifications.filter((n: Notification) => !n.read).length,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch notifications',
        isLoading: false,
      });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread/count');
      set({ unreadCount: response.data.unreadCount });
    } catch (error) {
      // Silently fail, don't set error
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.read ? state.unreadCount : state.unreadCount + 1,
    }));
  },

  markRead: async (notificationId: string) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to mark notification as read',
      });
    }
  },

  markAllRead: async () => {
    try {
      await api.post('/notifications/mark-all-read');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to mark all as read',
      });
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      set((state) => {
        const notification = state.notifications.find((n) => n.id === notificationId);
        return {
          notifications: state.notifications.filter((n) => n.id !== notificationId),
          unreadCount: notification && !notification.read ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        };
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to delete notification',
      });
    }
  },

  clearOldNotifications: async (days = 30) => {
    try {
      await api.delete('/notifications/clear/old', {
        params: { days },
      });
      // Refresh notifications list after clearing
      await get().fetchNotifications();
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to clear notifications',
      });
    }
  },

  clearAll: () => {
    set({
      notifications: [],
      unreadCount: 0,
      error: null,
    });
  },
}));
