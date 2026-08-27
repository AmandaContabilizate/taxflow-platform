"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";

interface NotificationError {
  statusCode: number;
  message: string;
}

export async function getUnreadCountAction(): Promise<Result<{ unreadCount: number }, NotificationError>> {
  try {
    const data = await fetchGet<{ unreadCount: number }>(
      API_ROUTES.USER_NOTIFICATIONS.UNREAD_COUNT,
      "user_notifications"
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getUnreadCountAction] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener el conteo de notificaciones." });
  }
}
