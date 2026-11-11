"use server";

import { fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { toRolesError } from "../errors";
import type { MyRole, RolesError } from "../types";

/** Roles del usuario autenticado (self-service). Con 2+ se muestra el selector "Cambiar de rol". */
export async function getMyRoles(): Promise<Result<MyRole[], RolesError>> {
  try {
    const data = await fetchGet<MyRole[]>(API_ROUTES.USERS.MY_ROLES, "users");
    return ok(data ?? []);
  } catch (e) {
    return err(toRolesError(e, "No pudimos consultar tus roles."));
  }
}
