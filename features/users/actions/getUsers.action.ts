"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { UsuariosPage } from "../types";

interface UsersError {
  statusCode: number;
  message: string;
}

const EMPTY: UsuariosPage = { items: [], total: 0, skip: 0, take: 0, estatus: [] };

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
  /** Avance del alta: legacy | creado | correo-enviado | correo-verificado | completo | rfc. */
  estatus?: string;
  /** true = el rol debe ser el ÚNICO de la cuenta (clientes puros). */
  roleExclusive?: boolean;
  /** IDs de Catalogs.SystemsOrigin (ej. [0, 4] = app móvil + Taxflow). Ausente = todos. */
  origins?: number[];
}): Promise<Result<UsuariosPage, UsersError>> {
  const { skip = 0, take = 100, search, role, emailConfirmed, estatus, roleExclusive, origins } = params;
  try {
    const data = await fetchGet<UsuariosPage>(
      API_ROUTES.USERS_OPS.LIST(
        skip,
        take,
        search?.trim() || undefined,
        role?.trim() || undefined,
        emailConfirmed,
        estatus?.trim() || undefined,
        roleExclusive,
        origins?.length ? origins.join(",") : undefined,
      ),
      "users_reports",
    );
    return ok(data ? { ...data, estatus: data.estatus ?? [] } : EMPTY);
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
