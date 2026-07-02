"use server";

import { fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { toRolesError } from "../errors";
import type { CreateRolePayload, RoleDetailDto, RolesError } from "../types";

export async function createRole(
  payload: CreateRolePayload,
): Promise<Result<RoleDetailDto, RolesError>> {
  try {
    const data = await fetchPost<RoleDetailDto>(
      API_ROUTES.ROLES.CREATE,
      payload,
      "roles",
    );
    return ok(data);
  } catch (e) {
    return err(toRolesError(e, "No pudimos crear el rol."));
  }
}
