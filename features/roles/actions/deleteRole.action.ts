"use server";

import { fetchDelete } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { toRolesError } from "../errors";
import type { RolesError } from "../types";

export async function deleteRole(
  roleId: string,
): Promise<Result<true, RolesError>> {
  try {
    await fetchDelete<unknown>(API_ROUTES.ROLES.DELETE(roleId), "roles");
    return ok(true);
  } catch (e) {
    return err(toRolesError(e, "No pudimos eliminar el rol."));
  }
}
