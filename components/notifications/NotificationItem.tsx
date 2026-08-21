'use client';

import React from 'react';
import Link from 'next/link';
import { UserNotification } from '@/types/notification';
import { FileText, Building2, AlertTriangle, ShieldCheck, CreditCard, Bell, Check, Trash2, ExternalLink } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificationItemProps {
  notification: UserNotification;
  onMarkAsRead: (id: string, isRead: boolean) => void;
  onDelete: (id: string) => void;
  onSelectDetail?: (notification: UserNotification) => void;
}

export function NotificationItem({ notification, onMarkAsRead, onDelete, onSelectDetail }: NotificationItemProps) {
  const getCategoryConfig = (category: string, code: string) => {
    switch (category.toLowerCase()) {
      case 'pre-reportes':
        return {
          icon: FileText,
          bgColor: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
          badgeText: 'Pre-Reporte',
        };
      case 'sat':
        if (code.includes('CIEC') || code.includes('ALERT')) {
          return {
            icon: AlertTriangle,
            bgColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
            badgeText: 'SAT Alerta',
          };
        }
        return {
          icon: Building2,
          bgColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
          badgeText: 'Declaración SAT',
        };
      case 'renovacion':
        return {
          icon: CreditCard,
          bgColor: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
          badgeText: 'Suscripción',
        };
      case 'sistema':
      default:
        return {
          icon: ShieldCheck,
          bgColor: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
          badgeText: 'Sistema',
        };
    }
  };

  const config = getCategoryConfig(notification.category, notification.notificationCode);
  const IconComponent = config.icon;

  const formattedTime = (() => {
    try {
      return formatDistanceToNow(parseISO(notification.createdAt), { addSuffix: true, locale: es });
    } catch {
      return 'Reciente';
    }
  })();

  const handleCardClick = (e: React.MouseEvent) => {
    // Si la notificación no está leída, marcarla automáticamente al dar clic
    if (!notification.isRead) {
      onMarkAsRead(notification.id, true);
    }

    if (onSelectDetail) {
      onSelectDetail(notification);
    }
  };

  return (
    <div
      className={`group relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 ${
        notification.isRead
          ? 'bg-background/40 hover:bg-accent/40 border-border/40 opacity-80 hover:opacity-100'
          : 'bg-card/90 hover:bg-card border-primary/20 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Indicador de No Leída (Punto Azul) */}
      {!notification.isRead && (
        <span
          className="absolute top-4 left-2.5 h-2 w-2 rounded-full bg-blue-500 ring-4 ring-blue-500/20 animate-pulse"
          title="Sin leer"
        />
      )}

      {/* Ícono de Categoría */}
      <div className={`flex-shrink-0 p-3 rounded-lg border ${config.bgColor}`}>
        <IconComponent className="h-5 w-5" />
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 min-w-0 pr-12 cursor-pointer" onClick={handleCardClick}>
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${config.bgColor}`}>
            {config.badgeText}
          </span>
          <span className="text-xs text-muted-foreground">{formattedTime}</span>
        </div>

        <h4 className={`text-sm font-semibold mb-1 line-clamp-1 ${!notification.isRead ? 'text-foreground font-bold' : 'text-foreground/90'}`}>
          {notification.title}
        </h4>

        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">
          {notification.summary}
        </p>

        {notification.detailUrl && (
          <Link
            href={
              notification.detailUrl.startsWith('/dashboard/') && !notification.detailUrl.includes('?s=')
                ? `/dashboard?s=${notification.detailUrl.split('/')[2] || 'home'}`
                : notification.detailUrl
            }
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <span>Ver detalle completo</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* Botones de Acción Interactivos (al Hover / Touch) */}
      <div className="absolute top-4 right-3 flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMarkAsRead(notification.id, !notification.isRead);
          }}
          className={`p-1.5 rounded-lg border transition-colors ${
            notification.isRead
              ? 'hover:bg-accent text-muted-foreground hover:text-foreground border-transparent'
              : 'hover:bg-blue-500/10 text-blue-500 border-blue-500/30'
          }`}
          title={notification.isRead ? 'Marcar como no leída' : 'Marcar como leída'}
        >
          <Check className={`h-4 w-4 ${notification.isRead ? 'opacity-40' : 'opacity-100'}`} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent transition-colors"
          title="Eliminar notificación"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
