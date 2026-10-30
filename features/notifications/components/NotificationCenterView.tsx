"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Bell,
  CheckCheck,
  Search,
  Trash2,
  ExternalLink,
  Calculator,
  Landmark,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  Inbox
} from "lucide-react";
import type { UserNotification } from "@/types/notification";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteUserNotification,
  seedTestNotification
} from "../actions/userNotifications.action";
import { useRouter } from "next/navigation";

const CATEGORIES = ["Todas", "Contable", "SAT", "Sistema", "Renovacion", "Alertas"];

function getCategoryIcon(category: string) {
  switch (category?.toLowerCase()) {
    case "contable":
    case "pre-reportes":
      return <Calculator className="size-5 text-indigo-600 dark:text-indigo-400" />;
    case "sat":
      return <Landmark className="size-5 text-amber-600 dark:text-amber-400" />;
    case "renovacion":
    case "suscripcion":
      return <CreditCard className="size-5 text-emerald-600 dark:text-emerald-400" />;
    case "alertas":
      return <AlertTriangle className="size-5 text-rose-600 dark:text-rose-400" />;
    default:
      return <ShieldCheck className="size-5 text-blue-600 dark:text-blue-400" />;
  }
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMin < 1) return "Hace un momento";
    if (diffMin < 60) return `Hace ${diffMin} minutos`;
    if (diffHrs < 24) return `Hace ${diffHrs} horas`;
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return dateString;
  }
}

export const NotificationCenterView = () => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [onlyUnread, setOnlyUnread] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const pageSize = 30;

  const fetchNotifications = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    const res = await getUserNotifications(page, pageSize, onlyUnread ? false : undefined, selectedCategory);
    if (res.success) {
      setNotifications(res.value.items);
      setUnreadCount(res.value.unreadCount);
      setTotalCount(res.value.totalCount);
    }
    setIsLoading(false);
    setIsRefreshing(false);
  }, [page, pageSize, onlyUnread, selectedCategory]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsReadToggle = async (item: UserNotification, e: React.MouseEvent) => {
    e.stopPropagation();
    const newIsRead = !item.isRead;
    setNotifications(prev =>
      prev.map(n => (n.id === item.id ? { ...n, isRead: newIsRead } : n))
    );
    setUnreadCount(prev => (newIsRead ? Math.max(0, prev - 1) : prev + 1));
    await markNotificationAsRead(item.id, newIsRead);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = notifications.find(n => n.id === id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (target && !target.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setTotalCount(prev => Math.max(0, prev - 1));
    await deleteUserNotification(id);
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await markAllNotificationsAsRead();
  };

  const handleSeedTest = async () => {
    setIsRefreshing(true);
    const res = await seedTestNotification({
      category: selectedCategory !== "Todas" ? selectedCategory : "Contable",
      title: "📊 Pre-Reporte Contable Generado (Prueba Taxflow)",
      summary: "Estimado cliente, su estimación mensual ha sido calculada en el entorno de pruebas.",
      detailUrl: "/dashboard"
    });
    if (res.success) {
      fetchNotifications(true);
    }
    setIsRefreshing(false);
  };

  const handleCardClick = async (item: UserNotification) => {
    if (!item.isRead) {
      setNotifications(prev =>
        prev.map(n => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      await markNotificationAsRead(item.id, true);
    }

    if (item.detailUrl) {
      router.push(item.detailUrl);
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter(item => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [notifications, searchQuery]);

  const categoryUnreadCounts = useMemo(() => {
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
        const match = CATEGORIES.find(c => c.toLowerCase() === catKey.toLowerCase());
        if (match && match !== 'Todas') {
          counts[match] = (counts[match] || 0) + 1;
        } else {
          counts.Sistema = (counts.Sistema || 0) + 1;
        }
      }
    });

    return counts;
  }, [notifications]);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] overflow-hidden bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <div className="shrink-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Bell className="size-6 text-blue-600 dark:text-blue-400" />
                Centro de Notificaciones
              </h1>
              {unreadCount > 0 && (
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                  {unreadCount} sin leer
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Histórico unificado de avisos fiscales, pre-reportes, SAT y alertas de sistema.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchNotifications(true)}
              disabled={isRefreshing}
              className="btn btn-sm btn-ghost btn-square text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              title="Actualizar bandeja"
            >
              <RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="btn btn-sm btn-primary gap-1.5 text-xs font-medium"
              >
                <CheckCheck className="size-4" />
                Marcar todas leídas
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
          {CATEGORIES.map(cat => {
            const count = categoryUnreadCounts[cat] || 0;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                <span>{cat === 'Renovacion' ? 'Renovación' : cat}</span>
                {count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white shadow-xs">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={onlyUnread}
              onChange={e => setOnlyUnread(e.target.checked)}
              className="checkbox checkbox-xs checkbox-primary rounded"
            />
            <span>Solo sin leer ({unreadCount})</span>
          </label>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por palabra clave..."
              className="input input-xs h-9 w-full pl-9 pr-4 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
            <RefreshCw className="size-8 animate-spin text-blue-600 mb-3" />
            <p className="text-xs font-medium">Cargando notificaciones del servidor...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-400">
            <Inbox className="size-12 text-zinc-300 dark:text-zinc-700 mb-3" />
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No hay notificaciones disponibles</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              {onlyUnread || searchQuery
                ? "No se encontraron notificaciones con los filtros aplicados."
                : "Tu bandeja está al día. Las notificaciones operativas y fiscales se mostrarán aquí en tiempo real."}
            </p>
          </div>
        ) : (
          filteredNotifications.map(item => (
            <div
              key={item.id}
              onClick={() => handleCardClick(item)}
              className={`group flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                !item.isRead
                  ? "bg-white dark:bg-zinc-900 border-blue-200 dark:border-blue-900/60 shadow-sm hover:border-blue-400"
                  : "bg-zinc-50/60 dark:bg-zinc-900/40 border-zinc-200/80 dark:border-zinc-800/80 opacity-85 hover:opacity-100 hover:bg-white dark:hover:bg-zinc-900"
              }`}
            >
              <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 shrink-0">
                {getCategoryIcon(item.category)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {!item.isRead && (
                      <span className="inline-block size-2 rounded-full bg-blue-600 ring-4 ring-blue-100 dark:ring-blue-900/60" />
                    )}
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
                      {item.category}
                    </span>
                    <h3 className={`text-sm font-semibold truncate ${!item.isRead ? "text-zinc-900 dark:text-white" : "text-zinc-700 dark:text-zinc-300"}`}>
                      {item.title}
                    </h3>
                  </div>

                  <span className="text-xs text-zinc-400 shrink-0">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </div>

                <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {item.summary}
                </p>

                {(() => {
                  let imgUrl = item.imageUrl?.trim() || null;
                  if (!imgUrl && item.payloadJson?.trim()) {
                    try {
                      const parsed = JSON.parse(item.payloadJson);
                      imgUrl = parsed?.imageUrl || parsed?.ImageUrl || null;
                    } catch {
                      imgUrl = null;
                    }
                  }
                  if (!imgUrl) return null;
                  return (
                    <div className="mt-2.5 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-black/10 dark:bg-black/40 p-1 flex justify-start max-w-sm">
                      <img
                        src={imgUrl}
                        alt=""
                        className="max-h-36 w-auto object-contain rounded-lg"
                        onError={e => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  );
                })()}

                {item.detailUrl && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:underline">
                    <span>Ir a Detalle</span>
                    <ExternalLink className="size-3.5" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={e => handleMarkAsReadToggle(item, e)}
                  className="btn btn-ghost btn-square btn-xs text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400"
                  title={item.isRead ? "Marcar como no leída" : "Marcar como leída"}
                >
                  <CheckCheck className={`size-4 ${item.isRead ? "text-zinc-400" : "text-blue-600"}`} />
                </button>
                <button
                  onClick={e => handleDelete(item.id, e)}
                  className="btn btn-ghost btn-square btn-xs text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                  title="Eliminar notificación"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="shrink-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 px-6 py-3 flex items-center justify-between text-xs text-zinc-500">
        <span>Mostrando {filteredNotifications.length} de {totalCount} notificaciones</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-xs btn-outline"
          >
            Anterior
          </button>
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">Página {page}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={filteredNotifications.length < pageSize}
            className="btn btn-xs btn-outline"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
};
