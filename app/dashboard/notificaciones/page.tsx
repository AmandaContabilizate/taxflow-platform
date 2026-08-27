'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationCategory, UserNotification } from '@/types/notification';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { Bell, Search, CheckCheck, RefreshCw, PlusCircle, Inbox, Filter, Shield, FileText, Building2, CreditCard, AlertTriangle, ExternalLink } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const CATEGORIES: { id: NotificationCategory; label: string; icon: React.ElementType }[] = [
  { id: 'Todas', label: 'Todas', icon: Bell },
  { id: 'Contable', label: 'Contable', icon: FileText },
  { id: 'SAT', label: 'SAT', icon: Building2 },
  { id: 'Sistema', label: 'Sistema', icon: Shield },
  { id: 'Renovacion', label: 'Renovación', icon: CreditCard },
  { id: 'Alertas', label: 'Alertas', icon: AlertTriangle },
];

function getDetailImageUrl(item: UserNotification): string | null {
  if (item.imageUrl?.trim()) return item.imageUrl.trim();
  if (item.payloadJson?.trim()) {
    try {
      const parsed = JSON.parse(item.payloadJson);
      return parsed?.imageUrl || parsed?.ImageUrl || null;
    } catch {
      return null;
    }
  }
  return null;
}

function getModalCategoryConfig(category: string) {
  const catLower = (category || '').toLowerCase();
  switch (catLower) {
    case 'pre-reportes':
    case 'contable':
      return { icon: FileText, badgeBg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
    case 'sat':
      return { icon: Building2, badgeBg: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    case 'renovacion':
    case 'renovación':
      return { icon: CreditCard, badgeBg: 'bg-purple-500/10 text-purple-500 border-purple-500/20' };
    case 'alertas':
      return { icon: AlertTriangle, badgeBg: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
    case 'sistema':
    default:
      return { icon: Shield, badgeBg: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
  }
}

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-3xl rounded-3xl border shadow-2xl p-7 space-y-5 relative max-h-[92vh] overflow-y-auto">
            {(() => {
              const modalConfig = getModalCategoryConfig(selectedDetail.category);
              const IconComponent = modalConfig.icon;
              const detailImageUrl = getDetailImageUrl(selectedDetail);

              return (
                <>
                  <div className="flex items-start justify-between border-b pb-4">
                    <div className="flex items-start gap-3.5">
                      <div className={`p-3 rounded-2xl border ${modalConfig.badgeBg} flex-shrink-0 mt-0.5`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${modalConfig.badgeBg}`}>
                            {selectedDetail.category}
                          </span>
                          {selectedDetail.createdAt && (
                            <span className="text-xs font-medium text-muted-foreground">
                              {formatDistanceToNow(parseISO(selectedDetail.createdAt), { addSuffix: true, locale: es })}
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-1.5">{selectedDetail.title}</h3>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedDetail(null)}
                      className="text-muted-foreground hover:text-foreground text-base font-bold p-1.5 rounded-xl hover:bg-accent transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="text-base text-foreground/90 leading-relaxed whitespace-pre-line">
                    {selectedDetail.summary}
                  </p>

                  {detailImageUrl && (
                    <div className="my-4 overflow-hidden rounded-2xl border border-border/50 bg-black/10 dark:bg-black/40 p-3 flex justify-center max-h-[420px]">
                      <img
                        src={detailImageUrl}
                        alt=""
                        className="max-h-[390px] w-auto object-contain rounded-xl"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div className="pt-4 border-t flex items-center justify-between gap-3">
                    {selectedDetail.detailUrl ? (
                      <a
                        href={
                          selectedDetail.detailUrl.trim() === '/dashboard' || selectedDetail.detailUrl.trim() === '/dashboard/'
                            ? '/dashboard?s=home'
                            : selectedDetail.detailUrl.startsWith('/dashboard/') && !selectedDetail.detailUrl.includes('?s=')
                            ? `/dashboard?s=${selectedDetail.detailUrl.split('/')[2] || 'home'}`
                            : selectedDetail.detailUrl
                        }
                        onClick={() => setSelectedDetail(null)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-sm"
                      >
                        <span>Ir a Detalle</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : <div />}

                    <button
                      onClick={() => setSelectedDetail(null)}
                      className="px-5 py-2.5 text-xs font-semibold rounded-xl border bg-card hover:bg-accent text-foreground transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
