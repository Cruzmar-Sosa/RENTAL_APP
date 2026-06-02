'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/context/NotificationProvider';
import { X, Trash2, CheckCheck } from 'lucide-react';

interface NotificationHubProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * NotificationHub Component
 * Modal/Sidebar showing notification history with grouping by date
 */
export function NotificationHub({ isOpen, onClose }: NotificationHubProps) {
  const { notifications, markRead, markAllRead, deleteNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);

  // Group notifications by date (Today, Yesterday, Older)
  const groupedNotifications = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const groups: { [key: string]: typeof notifications } = {
      Today: [],
      Yesterday: [],
      Older: [],
    };

    notifications.forEach((notification) => {
      const notifDate = new Date(notification.createdAt);
      const notifDay = new Date(notifDate.getFullYear(), notifDate.getMonth(), notifDate.getDate());

      if (notifDay.getTime() === today.getTime()) {
        groups.Today.push(notification);
      } else if (notifDay.getTime() === yesterday.getTime()) {
        groups.Yesterday.push(notification);
      } else {
        groups.Older.push(notification);
      }
    });

    return groups;
  }, [notifications]);

  const handleMarkAllRead = async () => {
    setIsLoading(true);
    try {
      await markAllRead();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteNotification(id);
    } finally {
      setIsLoading(false);
    }
  };

  const grouped = groupedNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 right-4 w-96 max-h-96 bg-white rounded-lg shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform bg-red-500 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <div className="text-4xl mb-2">🔔</div>
                  <p className="text-gray-500 text-sm">No notifications yet</p>
                </div>
              ) : (
                Object.entries(grouped).map(([groupName, notifs]) =>
                  notifs.length > 0 ? (
                    <div key={groupName} className="border-b border-gray-100">
                      {/* Group Header */}
                      <div className="px-4 py-2 bg-gray-50 sticky top-0">
                        <p className="text-xs font-semibold text-gray-600 uppercase">{groupName}</p>
                      </div>

                      {/* Notifications in group */}
                      {notifs.map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className="flex-shrink-0 mt-1">
                              {notification.type === 'BOOKING_CONFIRMED' && <span>✅</span>}
                              {notification.type === 'PAYMENT_SETTLED' && <span>💰</span>}
                              {notification.type === 'CHECK_IN_READY' && <span>📍</span>}
                              {notification.type === 'CHECK_IN_SUCCESSFUL' && <span>🔓</span>}
                              {notification.type === 'RIDE_STARTED' && <span>🚴</span>}
                              {notification.type === 'RIDE_COMPLETED' && <span>🏁</span>}
                              {notification.type === 'DAMAGE_REPORT' && <span>⚠️</span>}
                              {notification.type === 'REFUND_ISSUED' && <span>💵</span>}
                              {notification.type === 'PAYMENT_DECLINED' && <span>❌</span>}
                              {notification.type === 'SYSTEM_ALERT' && <span>🔔</span>}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-gray-900 truncate">
                                {notification.title}
                              </h3>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!notification.read && (
                                <button
                                  onClick={() => markRead(notification.id)}
                                  className="p-1.5 hover:bg-gray-200 rounded transition"
                                  title="Mark as read"
                                  disabled={isLoading}
                                >
                                  <CheckCheck className="w-4 h-4 text-gray-500" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteNotification(notification.id)}
                                className="p-1.5 hover:bg-gray-200 rounded transition"
                                title="Delete"
                                disabled={isLoading}
                              >
                                <Trash2 className="w-4 h-4 text-gray-500" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : null,
                )
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-gray-200 p-3 flex gap-2">
                <button
                  onClick={handleMarkAllRead}
                  disabled={unreadCount === 0 || isLoading}
                  className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-50"
                >
                  Mark all as read
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
