"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { Paged, UserListItem } from "../types";

interface UsersError {
  statusCode: number;
  message: string;
}

const EMPTY: Paged<UserListItem> = { items: [], total: 0, skip: 0, take: 0 };

/** Padrón de cuentas registradas (GET /users). Sin filtros trae todas. */
export async function getUsers(params: {
  skip?: number;
  take?: number;
  /** Texto libre: nombre, email o teléfono. */
  search?: string;
  /** Nombre del rol tal cual lo devuelve el backend (Accounter, Cliente, …). */
  role?: string;
  /** true confirmados, false pendientes, ausente todos. */
  emailConfirmed?: boolean;
}): Promise<Result<Paged<UserListItem>, UsersError>> {
  const { skip = 0, take = 100, search, role, emailConfirmed } = params;
  try {
    const data = await fetchGet<Paged<UserListItem>>(
      API_ROUTES.USERS_OPS.LIST(
        skip,
        take,
        search?.trim() || undefined,
        role?.trim() || undefined,
        emailConfirmed,
      ),
      "users_reports",
    );
    return ok(data ?? EMPTY);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getUsers] Error:", e);
    return err({
      statusCode: 500,
      message: "No pudimos obtener los usuarios.",
    });
  }
}
