"use server";

import { fetchPut } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { toRolesError } from "../errors";
import type { ReplaceUserRolesPayload, RolesError } from "../types";

export async function replaceUserRoles(
  userId: string,
  payload: ReplaceUserRolesPayload,
): Promise<Result<true, RolesError>> {
  try {
    await fetchPut<unknown>(API_ROUTES.USERS.ROLES(userId), payload, "users");
    return ok(true);
  } catch (e) {
    return err(toRolesError(e, "No pudimos actualizar los roles del usuario."));
  }
}
