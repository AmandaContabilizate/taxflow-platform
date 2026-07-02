"use server";

import { fetchPut } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { toRolesError } from "../errors";
import type { RoleDetailDto, RolesError, UpdateRolePayload } from "../types";

export async function updateRole(
  payload: UpdateRolePayload,
): Promise<Result<RoleDetailDto, RolesError>> {
  try {
    const data = await fetchPut<RoleDetailDto>(
      API_ROUTES.ROLES.UPDATE,
      payload,
      "roles",
    );
    return ok(data);
  } catch (e) {
    return err(toRolesError(e, "No pudimos actualizar el rol."));
  }
}
