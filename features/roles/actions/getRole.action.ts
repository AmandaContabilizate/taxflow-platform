"use server";

import { fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { toRolesError } from "../errors";
import type { RoleDetailDto, RolesError } from "../types";

export async function getRole(
  roleId: string,
): Promise<Result<RoleDetailDto, RolesError>> {
  try {
    const data = await fetchGet<RoleDetailDto>(
      API_ROUTES.ROLES.GET(roleId),
      "roles",
    );
    return ok(data);
  } catch (e) {
    return err(toRolesError(e, "No pudimos obtener el rol."));
  }
}
