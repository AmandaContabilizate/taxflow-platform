"use server";

import { fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { toRolesError } from "../errors";
import type { GetRoleUsersResponse, RoleUserDto, RolesError } from "../types";

/**
 * Usuarios que tienen asignado un rol (GET /roles/{roleId}/users), con el flag
 * de rol activo (por defecto) de cada uno.
 */
export async function getRoleUsers(
  roleId: string,
): Promise<Result<RoleUserDto[], RolesError>> {
  try {
    const data = await fetchGet<GetRoleUsersResponse>(
      API_ROUTES.ROLES.USERS(roleId),
      "roles",
    );
    return ok(data?.users ?? []);
  } catch (e) {
    return err(toRolesError(e, "No pudimos obtener los usuarios del rol."));
  }
}
