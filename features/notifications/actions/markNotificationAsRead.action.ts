"use server";

import { ApiError, fetchPatch } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";

interface NotificationError {
  statusCode: number;
  message: string;
}

export async function markNotificationAsReadAction(
  id: string,
  isRead = true
): Promise<Result<{ success: boolean; isRead: boolean; unreadCount: number }, NotificationError>> {
  try {
    const endpoint = API_ROUTES.USER_NOTIFICATIONS.READ(id);
    const data = await fetchPatch<{ success: boolean; isRead: boolean; unreadCount: number }>(
      endpoint,
      { isRead },
      "user_notifications"
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[markNotificationAsReadAction] Error:", e);
    return err({ statusCode: 500, message: "No pudimos actualizar la notificación." });
  }
}
