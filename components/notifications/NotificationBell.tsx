'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, CheckCheck, ExternalLink, Inbox } from 'lucide-react';
import { NotificationItem } from './NotificationItem';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, isLoading } = useNotifications();

  // Cerrar al hacer click fuera del dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const latestNotifications = notifications.slice(0, 5);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Botón de la Campana con Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-full hover:bg-accent/80 transition-colors text-foreground/80 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        aria-label="Abrir centro de notificaciones"
      >
        <Bell className="h-5 w-5" />

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border bg-card/95 p-4 shadow-xl backdrop-blur-md z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header del Popover */}
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Notificaciones</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                  {unreadCount} sin leer
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                title="Marcar todas como leídas"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Marcar leídas</span>
              </button>
            )}
          </div>

          {/* Lista rápida de Notificaciones */}
          <div className="mt-3 max-h-80 overflow-y-auto space-y-2.5 pr-1">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
                Cargando notificaciones...
              </div>
            ) : latestNotifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <Inbox className="h-8 w-8 text-muted-foreground/40" />
                <span>No tienes notificaciones por el momento</span>
              </div>
            ) : (
              latestNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))
            )}
          </div>

          {/* Footer del Popover */}
          <div className="mt-3 pt-3 border-t border-border/50 text-center">
            <Link
              href="/dashboard?s=centro-notificaciones"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <span>Ver todas las notificaciones</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
