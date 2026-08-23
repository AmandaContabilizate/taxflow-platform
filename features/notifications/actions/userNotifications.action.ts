"use server";

import { API_ROUTES } from "@/lib/api/apiRoutes";
import type {
  UserNotification,
  UserNotificationsPagedResponse,
  UserNotificationUnreadCountResponse,
  SeedTestNotificationDto
} from "@/types/notification";
import { fetchGet, fetchPost, fetchPatch, fetchDelete } from "@/lib/api/fetchClient";

export type Result<T, E> =
  | { success: true; value: T }
  | { success: false; error: E };

export interface ActionError {
  statusCode: number;
  message: string;
  generalErrors: string[];
}

/**
 * Obtiene el listado paginado de notificaciones del usuario autenticado.
 */
export async function getUserNotifications(
  page: number = 1,
  pageSize: number = 20,
  isRead?: boolean,
  category?: string
): Promise<Result<UserNotificationsPagedResponse, ActionError>> {
  try {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("pageSize", pageSize.toString());
    if (isRead !== undefined && isRead !== null) {
      params.set("isRead", isRead.toString());
    }
    if (category && category.trim() !== "" && category !== "Todas") {
      params.set("category", category);
    }

    const endpoint = `${API_ROUTES.USER_NOTIFICATIONS.ROOT}?${params.toString()}`;
    const data = await fetchGet<UserNotificationsPagedResponse>(endpoint, "user_notifications");

    return {
      success: true,
      value: data,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        statusCode: 500,
        message: error instanceof Error ? error.message : "Error al obtener el listado de notificaciones",
        generalErrors: [error instanceof Error ? error.message : "Error desconocido"],
      },
    };
  }
}

/**
 * Obtiene únicamente el conteo de notificaciones no leídas (badge).
 */
export async function getUnreadNotificationsCount(): Promise<
  Result<UserNotificationUnreadCountResponse, ActionError>
> {
  try {
    const data = await fetchGet<UserNotificationUnreadCountResponse>(
      API_ROUTES.USER_NOTIFICATIONS.UNREAD_COUNT,
      "user_notifications"
    );

    return {
      success: true,
      value: data,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        statusCode: 500,
        message: error instanceof Error ? error.message : "Error al obtener conteo no leído",
        generalErrors: [error instanceof Error ? error.message : "Error desconocido"],
      },
    };
  }
}

/**
 * Marca una notificación individual como leída / no leída.
 */
export async function markNotificationAsRead(
  id: string,
  isRead: boolean = true
): Promise<Result<{ success: boolean; isRead: boolean; unreadCount: number }, ActionError>> {
  try {
    const endpoint = API_ROUTES.USER_NOTIFICATIONS.READ(id);
    const data = await fetchPatch<{ success: boolean; isRead: boolean; unreadCount: number }>(
      endpoint,
      { isRead },
      "user_notifications"
    );

    return {
      success: true,
      value: data,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        statusCode: 500,
        message: error instanceof Error ? error.message : "Error al actualizar estado de lectura",
        generalErrors: [error instanceof Error ? error.message : "Error desconocido"],
      },
    };
  }
}

/**
 * Marca todas las notificaciones del cliente como leídas.
 */
export async function markAllNotificationsAsRead(): Promise<
  Result<{ success: boolean; updatedCount: number; unreadCount: number }, ActionError>
> {
  try {
    const data = await fetchPost<{ success: boolean; updatedCount: number; unreadCount: number }>(
      API_ROUTES.USER_NOTIFICATIONS.MARK_ALL_READ,
      {},
      "user_notifications"
    );

    return {
      success: true,
      value: data,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        statusCode: 500,
        message: error instanceof Error ? error.message : "Error al marcar todas las notificaciones como leídas",
        generalErrors: [error instanceof Error ? error.message : "Error desconocido"],
      },
    };
  }
}

/**
 * Elimina lógicamente una notificación por su ID.
 */
export async function deleteUserNotification(
  id: string
): Promise<Result<{ success: boolean; unreadCount: number }, ActionError>> {
  try {
    const endpoint = API_ROUTES.USER_NOTIFICATIONS.DELETE(id);
    const data = await fetchDelete<{ success: boolean; unreadCount: number }>(
      endpoint,
      "user_notifications"
    );

    return {
      success: true,
      value: data,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        statusCode: 500,
        message: error instanceof Error ? error.message : "Error al eliminar la notificación",
        generalErrors: [error instanceof Error ? error.message : "Error desconocido"],
      },
    };
  }
}

/**
 * Dispara una notificación de prueba (Seed Test).
 */
export async function seedTestNotification(
  dto?: SeedTestNotificationDto
): Promise<Result<{ notification: UserNotification; unreadCount: number }, ActionError>> {
  try {
    const data = await fetchPost<{ notification: UserNotification; unreadCount: number }>(
      API_ROUTES.USER_NOTIFICATIONS.SEED_TEST,
      dto || {},
      "user_notifications"
    );

    return {
      success: true,
      value: data,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        statusCode: 500,
        message: error instanceof Error ? error.message : "Error al inyectar notificación de prueba",
        generalErrors: [error instanceof Error ? error.message : "Error desconocido"],
      },
    };
  }
}
