"use server";

import { fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { toRolesError } from "../errors";
import type { RolesError, UserRolePayload } from "../types";

export async function assignRole(
  payload: UserRolePayload,
): Promise<Result<true, RolesError>> {
  try {
    await fetchPost<unknown>(API_ROUTES.USERS.ASSIGN_ROLE, payload, "users");
    return ok(true);
  } catch (e) {
    return err(toRolesError(e, "No pudimos asignar el rol."));
  }
}
