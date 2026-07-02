"use server";

import { fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { toRolesError } from "../errors";
import type { RolesError, UserRoleDto } from "../types";

export async function getUserRoles(
  userId: string,
): Promise<Result<UserRoleDto[], RolesError>> {
  try {
    // Devuelve un array directo (no envuelto en { roles }).
    const data = await fetchGet<UserRoleDto[]>(
      API_ROUTES.USERS.ROLES(userId),
      "users",
    );
    return ok(Array.isArray(data) ? data : []);
  } catch (e) {
    return err(toRolesError(e, "No pudimos obtener los roles del usuario."));
  }
}
