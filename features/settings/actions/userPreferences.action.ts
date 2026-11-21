"use server";

import { ApiError, fetchGet, fetchPut } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";

export interface UserPreferences {
  seasonalThemeEnabled: boolean;
}

interface PreferencesError {
  statusCode: number;
  message: string;
}

/**
 * Preferencias de UI del usuario autenticado (GET api/Users/me/preferences). Autoservicio,
 * cualquier rol; el backend resuelve al usuario por el NameIdentifier del token.
 */
export async function getUserPreferences(): Promise<Result<UserPreferences, PreferencesError>> {
  try {
    const data = await fetchGet<Partial<UserPreferences>>(API_ROUTES.USERS.MY_PREFERENCES, "users");
    return ok({ seasonalThemeEnabled: data?.seasonalThemeEnabled ?? true });
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getUserPreferences] Error:", e);
    return err({ statusCode: 500, message: "No pudimos cargar tus preferencias." });
  }
}

/** Guarda las preferencias de UI (PUT api/Users/me/preferences → 204). */
export async function saveUserPreferences(
  prefs: UserPreferences,
): Promise<Result<true, PreferencesError>> {
  try {
    await fetchPut(API_ROUTES.USERS.MY_PREFERENCES, prefs, "users");
    return ok(true);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[saveUserPreferences] Error:", e);
    return err({ statusCode: 500, message: "No pudimos guardar tu preferencia." });
  }
}
