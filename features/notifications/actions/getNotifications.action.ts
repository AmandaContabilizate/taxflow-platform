"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { UserNotificationsPagedResponse } from "@/types/notification";

interface NotificationError {
  statusCode: number;
  message: string;
}

export async function getNotificationsAction(
  page = 1,
  pageSize = 20,
  isRead?: boolean,
  category?: string
): Promise<Result<UserNotificationsPagedResponse, NotificationError>> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    if (isRead !== undefined) {
      params.append("isRead", isRead.toString());
    }
    if (category && category !== "Todas") {
      params.append("category", category);
    }

    const endpoint = `${API_ROUTES.USER_NOTIFICATIONS.ROOT}?${params.toString()}`;
    const data = await fetchGet<UserNotificationsPagedResponse>(
      endpoint,
      "user_notifications"
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getNotificationsAction] Error:", e);
    return err({ statusCode: 500, message: "No pudimos cargar tus notificaciones." });
  }
}
