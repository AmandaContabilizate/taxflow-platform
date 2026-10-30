'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserNotification, NotificationCategory } from '@/types/notification';
import { getNotificationsAction } from '@/features/notifications/actions/getNotifications.action';
import { markNotificationAsReadAction } from '@/features/notifications/actions/markNotificationAsRead.action';
import { markAllNotificationsAsReadAction } from '@/features/notifications/actions/markAllNotificationsAsRead.action';
import { deleteNotificationAction } from '@/features/notifications/actions/deleteNotification.action';

export function useNotifications(initialCategory: NotificationCategory = 'Todas') {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterUnreadOnly, setFilterUnreadOnly] = useState<boolean>(false);

  const loadNotifications = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setIsLoading(true);
      setError(null);
      const res = await getNotificationsAction(1, 50, filterUnreadOnly ? false : undefined, activeCategory);
      if (res.success) {
        setNotifications(res.value.items);
        setUnreadCount(res.value.unreadCount);
        setTotalCount(res.value.totalCount);
      } else {
        setError(res.error.message);
      }
    } catch (err: any) {
      console.error('Error al cargar notificaciones:', err);
      setError(err.message || 'Error al conectar con el centro de notificaciones');
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [activeCategory, filterUnreadOnly]);

  useEffect(() => {
    loadNotifications(false);
    const interval = setInterval(() => {
      loadNotifications(true);
    }, 30000);

    const handleSync = () => loadNotifications(true);
    window.addEventListener('notifications-updated', handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications-updated', handleSync);
    };
  }, [loadNotifications]);

  const notifySync = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('notifications-updated'));
    }
  };

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    // Optimistic UI Update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead, readAt: isRead ? new Date().toISOString() : null } : n))
    );
    setUnreadCount((prev) => Math.max(0, isRead ? prev - 1 : prev + 1));

    try {
      const res = await markNotificationAsReadAction(id, isRead);
      if (res.success) {
        setUnreadCount(res.value.unreadCount);
        notifySync();
      } else {
        loadNotifications();
      }
    } catch (err) {
      console.error('Error al actualizar estado de lectura:', err);
      loadNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    const previous = [...notifications];
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
    setUnreadCount(0);

    try {
      const res = await markAllNotificationsAsReadAction();
      if (res.success) {
        setUnreadCount(res.value.unreadCount);
        notifySync();
      } else {
        setNotifications(previous);
      }
    } catch (err) {
      console.error('Error al marcar todas como leídas:', err);
      setNotifications(previous);
    }
  };

  const handleDelete = async (id: string) => {
    const target = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (target && !target.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      const res = await deleteNotificationAction(id);
      if (res.success) {
        setUnreadCount(res.value.unreadCount);
        notifySync();
      } else {
        loadNotifications();
      }
    } catch (err) {
      console.error('Error al eliminar notificación:', err);
      loadNotifications();
    }
  };

  // Client-side search filtering
  const filteredNotifications = notifications.filter((item) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesUnread = !filterUnreadOnly || !item.isRead;
    return matchesSearch && matchesUnread;
  });

  return {
    notifications: filteredNotifications,
    rawCount: notifications.length,
    unreadCount,
    totalCount,
    isLoading,
    error,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    filterUnreadOnly,
    setFilterUnreadOnly,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDelete,
    refresh: () => loadNotifications(false),
  };
}
