"use server";

import { ApiError, fetchGet, fetchPut } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { NotificationInfo, NotificationInfoUpdate } from "../types";

interface SettingsError {
  statusCode: number;
  message: string;
}

/**
 * Preferencias de notificación del usuario autenticado (GET /Notification/info):
 * canales (Email/SMS/WebPush) y tipos del catálogo con su estado. Autoservicio —
 * el backend resuelve al usuario por el email del token.
 */
export async function getNotificationInfo(): Promise<Result<NotificationInfo, SettingsError>> {
  try {
    const data = await fetchGet<NotificationInfo>(
      API_ROUTES.NOTIFICATION_PREFS.INFO,
      "notification_prefs",
    );
    return ok({
      userSuscriptions: data?.userSuscriptions ?? [],
      usersPreferences: data?.usersPreferences ?? [],
    });
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getNotificationInfo] Error:", e);
    return err({ statusCode: 500, message: "No pudimos cargar tus preferencias de notificación." });
  }
}

/** Guarda canales y/o preferencias (PUT /Notification/info, upsert por usuario). */
export async function saveNotificationInfo(
  update: NotificationInfoUpdate,
): Promise<Result<true, SettingsError>> {
  try {
    await fetchPut(API_ROUTES.NOTIFICATION_PREFS.INFO, update, "notification_prefs");
    return ok(true);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[saveNotificationInfo] Error:", e);
    return err({ statusCode: 500, message: "No pudimos guardar tus preferencias." });
  }
}
