"use server";

import { ApiError, fetchDelete } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";

interface NotificationError {
  statusCode: number;
  message: string;
}

export async function deleteNotificationAction(
  id: string
): Promise<Result<{ success: boolean; unreadCount: number }, NotificationError>> {
  try {
    const endpoint = API_ROUTES.USER_NOTIFICATIONS.DELETE(id);
    const data = await fetchDelete<{ success: boolean; unreadCount: number }>(
      endpoint,
      "user_notifications"
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[deleteNotificationAction] Error:", e);
    return err({ statusCode: 500, message: "No pudimos eliminar la notificación." });
  }
}
