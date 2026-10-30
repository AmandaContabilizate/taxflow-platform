"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { ClientListItem, Paged } from "../types";

interface ClientsError {
  statusCode: number;
  message: string;
}

const EMPTY: Paged<ClientListItem> = { items: [], total: 0, skip: 0, take: 0 };

/**
 * Cartera del contador autenticado (GET /taxpayers/my-clients).
 * Usa el contador del token; `accountantUserId` es un override admin opcional.
 */
export async function getMyClients(params: {
  skip?: number;
  take?: number;
  rfc?: string;
  accountantUserId?: string;
  /** Mínimo de ventas pagadas; el endpoint ya exige 1, así que sólo aplica con 2+. */
  minSales?: number;
}): Promise<Result<Paged<ClientListItem>, ClientsError>> {
  const { skip = 0, take = 100, rfc, accountantUserId, minSales } = params;
  try {
    const data = await fetchGet<Paged<ClientListItem>>(
      API_ROUTES.TAXPAYERS_OPS.MY_CLIENTS(
        skip,
        take,
        rfc?.trim() || undefined,
        accountantUserId?.trim() || undefined,
        minSales,
      ),
      "taxpayers_reports",
    );
    return ok(data ?? EMPTY);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getMyClients] Error:", e);
    return err({
      statusCode: 500,
      message: "No pudimos obtener tu cartera de clientes.",
    });
  }
}
