"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, CheckCheck, ExternalLink, Sparkles } from "lucide-react";
import type { UserNotification } from "@/types/notification";
import {
  getUnreadNotificationsCount,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from "../actions/userNotifications.action";
import { useRouter } from "next/navigation";

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMin < 1) return "Justo ahora";
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHrs < 24) return `Hace ${diffHrs} h`;
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  } catch {
    return dateString;
  }
}

interface NotificationBellProps {
  onNavigateToCenter?: () => void;
}

export const NotificationBell = ({ onNavigateToCenter }: NotificationBellProps) => {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchNotificationData = useCallback(async () => {
    setIsLoading(true);
    const [countRes, listRes] = await Promise.all([
      getUnreadNotificationsCount(),
      getUserNotifications(1, 5)
    ]);

    if (countRes.success) {
      setUnreadCount(countRes.value.unreadCount);
    }
    if (listRes.success) {
      setNotifications(listRes.value.items);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchNotificationData();
    const interval = setInterval(fetchNotificationData, 45000);
    return () => clearInterval(interval);
  }, [fetchNotificationData]);

  const handleItemClick = async (item: UserNotification) => {
    if (!item.isRead) {
      setNotifications(prev =>
        prev.map(n => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      await markNotificationAsRead(item.id, true);
    }

    setIsOpen(false);
    if (item.detailUrl) {
      router.push(item.detailUrl);
    }
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await markAllNotificationsAsRead();
  };

  const handleViewAll = () => {
    setIsOpen(false);
    if (onNavigateToCenter) {
      onNavigateToCenter();
    } else {
      router.push("/notifications");
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-circle btn-ghost btn-sm relative text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
        aria-label="Abrir centro de notificaciones"
        title="Notificaciones"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-md animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-80 sm:w-96 rounded-xl bg-white p-4 shadow-2xl ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Notificaciones
                </h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    {unreadCount} nuevas
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  title="Marcar todas como leídas"
                >
                  <CheckCheck className="size-3.5" />
                  Marcar leídas
                </button>
              )}
            </div>

            <div className="my-2 max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
              {isLoading && notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-400">
                  Cargando notificaciones...
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-400">
                  <Sparkles className="mb-2 size-6 text-zinc-300 dark:text-zinc-600" />
                  <p className="text-xs font-medium">No tienes notificaciones pendientes</p>
                </div>
              ) : (
                notifications.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`group flex cursor-pointer items-start gap-3 p-2.5 transition-colors rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/60 ${
                      !item.isRead ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                    }`}
                  >
                    <div className="mt-1 shrink-0">
                      {!item.isRead ? (
                        <span className="inline-block size-2 rounded-full bg-blue-600 ring-4 ring-blue-100 dark:ring-blue-900/50" />
                      ) : (
                        <span className="inline-block size-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs font-medium truncate ${!item.isRead ? "text-zinc-900 font-semibold dark:text-white" : "text-zinc-700 dark:text-zinc-300"}`}>
                          {item.title}
                        </p>
                        <span className="shrink-0 text-[10px] text-zinc-400">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-500 line-clamp-2 dark:text-zinc-400">
                        {item.summary}
                      </p>
                    </div>
                    {item.detailUrl && (
                      <ExternalLink className="size-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-zinc-100 pt-2 text-center dark:border-zinc-800">
              <button
                onClick={handleViewAll}
                className="w-full py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Ver todas las notificaciones →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
