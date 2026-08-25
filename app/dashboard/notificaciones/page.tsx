'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationCategory, UserNotification } from '@/types/notification';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { Bell, Search, CheckCheck, RefreshCw, PlusCircle, Inbox, Filter, Shield, FileText, Building2, CreditCard, AlertTriangle } from 'lucide-react';

const CATEGORIES: { id: NotificationCategory; label: string; icon: React.ElementType }[] = [
  { id: 'Todas', label: 'Todas', icon: Bell },
  { id: 'Contable', label: 'Contable', icon: FileText },
  { id: 'SAT', label: 'SAT', icon: Building2 },
  { id: 'Sistema', label: 'Sistema', icon: Shield },
  { id: 'Renovacion', label: 'Renovación', icon: CreditCard },
  { id: 'Alertas', label: 'Alertas', icon: AlertTriangle },
];

export default function NotificationCenterPage() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/dashboard/notificaciones') {
      router.replace('/dashboard?s=centro-notificaciones');
    }
  }, [pathname, router]);

  const {
    notifications,
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
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  } = useNotifications();

  const [selectedDetail, setSelectedDetail] = useState<UserNotification | null>(null);

  const categoryUnreadCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      Todas: 0,
      Contable: 0,
      SAT: 0,
      Sistema: 0,
      Renovacion: 0,
      Alertas: 0,
    };

    notifications.forEach(n => {
      if (!n.isRead) {
        counts.Todas += 1;
        const catKey = (n.category || 'Sistema').trim();
        const matchKey = Object.keys(counts).find(k => k.toLowerCase() === catKey.toLowerCase());
        if (matchKey && matchKey !== 'Todas') {
          counts[matchKey] = (counts[matchKey] || 0) + 1;
        } else {
          counts.Sistema = (counts.Sistema || 0) + 1;
        }
      }
    });

    return counts;
  }, [notifications]);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto px-4 py-2 space-y-4 overflow-hidden">
      {/* Toolbar de Acciones Globales & Estado (Fijo) */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-muted-foreground">Estado de la bandeja:</span>
          {unreadCount > 0 ? (
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
              {unreadCount} sin leer
            </span>
          ) : (
            <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Al día (0 pendientes)
            </span>
          )}
        </div>

        {/* Acciones Globales */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border bg-card hover:bg-accent text-foreground transition-colors shadow-sm"
            >
              <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Marcar todas leídas</span>
            </button>
          )}

          <button
            onClick={refresh}
            className="p-1.5 rounded-xl border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Recargar notificaciones"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda (Fija) */}
      <div className="shrink-0 flex flex-col gap-4 bg-card/60 p-4 rounded-2xl border shadow-sm backdrop-blur-sm">
        {/* Fila 1: Pestañas de Categoría con Ancho Completo */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none w-full border-b border-border/40">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            const count = categoryUnreadCounts[cat.id] || 0;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
                    : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{cat.label}</span>
                {count > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white shadow-sm ml-0.5">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Fila 2: 'Solo sin leer' y Buscador por Palabra Clave */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
          <button
            onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-xl border transition-all ${
              filterUnreadOnly
                ? 'bg-blue-500/10 text-blue-500 border-blue-500/30 font-bold shadow-sm'
                : 'bg-background/80 text-muted-foreground border-border/70 hover:text-foreground hover:bg-accent/40'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Solo sin leer</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-blue-500 text-white">
                {unreadCount}
              </span>
            )}
          </button>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar notificaciones por palabra clave..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-background/90 border border-border/80 focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Alerta de Error si ocurre */}
      {error && (
        <div className="shrink-0 p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs">
          ⚠️ {error}
        </div>
      )}

      {/* Feed de Notificaciones (Único elemento con Scrollbar que llena el espacio restante) */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 space-y-3 scrollbar-thin pb-2">
        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" />
            <p className="text-xs text-muted-foreground">Cargando notificaciones del servidor...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center bg-card/30 rounded-2xl border border-dashed p-8">
            <Inbox className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-foreground mb-1">No se encontraron notificaciones</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No tienes notificaciones en esta categoría o que coincidan con tu búsqueda.
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
              onSelectDetail={(item) => setSelectedDetail(item)}
            />
          ))
        )}
      </div>

      {/* Modal de Detalle Completo */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-lg rounded-2xl border shadow-2xl p-6 space-y-4 relative">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {selectedDetail.category}
                </span>
                <h3 className="text-base font-bold text-foreground mt-2">{selectedDetail.title}</h3>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
              {selectedDetail.summary}
            </p>

            <div className="pt-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setSelectedDetail(null)}
                className="px-4 py-2 text-xs font-medium rounded-xl border bg-card hover:bg-accent text-foreground"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
