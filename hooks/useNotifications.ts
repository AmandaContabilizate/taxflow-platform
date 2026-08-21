'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserNotification, NotificationCategory } from '@/types/notification';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  seedTestNotification,
} from '@/lib/api/notifications';

export function useNotifications(initialCategory: NotificationCategory = 'Todas') {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterUnreadOnly, setFilterUnreadOnly] = useState<boolean>(false);

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchNotifications(1, 50, filterUnreadOnly ? false : undefined, activeCategory);
      setNotifications(data.items);
      setUnreadCount(data.unreadCount);
      setTotalCount(data.totalCount);
    } catch (err: any) {
      console.error('Error al cargar notificaciones:', err);
      setError(err.message || 'Error al conectar con el centro de notificaciones');
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, filterUnreadOnly]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    // Optimistic UI Update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead, readAt: isRead ? new Date().toISOString() : null } : n))
    );
    setUnreadCount((prev) => Math.max(0, isRead ? prev - 1 : prev + 1));

    try {
      const res = await markNotificationAsRead(id, isRead);
      setUnreadCount(res.unreadCount);
    } catch (err) {
      console.error('Error al actualizar estado de lectura:', err);
      // Revert in case of error
      loadNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    const previous = [...notifications];
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
    setUnreadCount(0);

    try {
      const res = await markAllNotificationsAsRead();
      setUnreadCount(res.unreadCount);
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
      const res = await deleteNotification(id);
      setUnreadCount(res.unreadCount);
    } catch (err) {
      console.error('Error al eliminar notificación:', err);
      loadNotifications();
    }
  };

  const handleSeedTestNotification = async () => {
    try {
      setIsLoading(true);
      await seedTestNotification();
      await loadNotifications();
    } catch (err) {
      console.error('Error al generar notificación simulada:', err);
    } finally {
      setIsLoading(false);
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
    seedTestNotification: handleSeedTestNotification,
    refresh: loadNotifications,
  };
}
