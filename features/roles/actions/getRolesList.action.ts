"use server";

import { fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { toRolesError } from "../errors";
import type { GetRolesResponse, RoleOverviewDto, RolesError } from "../types";

export async function getRolesList(): Promise<
  Result<RoleOverviewDto[], RolesError>
> {
  try {
    const data = await fetchGet<GetRolesResponse>(
      API_ROUTES.ROLES.LIST,
      "roles",
    );
    return ok(data?.roles ?? []);
  } catch (e) {
    return err(toRolesError(e, "No pudimos obtener los roles."));
  }
}
