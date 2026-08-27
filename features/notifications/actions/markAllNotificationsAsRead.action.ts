"use server";

import { ApiError, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";

interface NotificationError {
  statusCode: number;
  message: string;
}

export async function markAllNotificationsAsReadAction(): Promise<
  Result<{ success: boolean; updatedCount: number; unreadCount: number }, NotificationError>
> {
  try {
    const data = await fetchPost<{ success: boolean; updatedCount: number; unreadCount: number }>(
      API_ROUTES.USER_NOTIFICATIONS.MARK_ALL_READ,
      {},
      "user_notifications"
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[markAllNotificationsAsReadAction] Error:", e);
    return err({ statusCode: 500, message: "No pudimos marcar las notificaciones como leídas." });
  }
}
