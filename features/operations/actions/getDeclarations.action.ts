"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { DeclarationListItem, Paged } from "../types";

interface OpsError {
  statusCode: number;
  message: string;
}

const EMPTY: Paged<DeclarationListItem> = { items: [], total: 0, skip: 0, take: 0 };

/**
 * El endpoint pasó de devolver un array pelón a `PagedResult`. Aceptamos ambas
 * formas (y `items: null`) para no romper si algún ambiente va atrasado.
 */
function normalize(
  raw: unknown,
  skip: number,
  take: number,
): Paged<DeclarationListItem> {
  if (Array.isArray(raw)) {
    const items = raw as DeclarationListItem[];
    return { items, total: items.length, skip, take };
  }
  const obj = (raw ?? {}) as Partial<Paged<DeclarationListItem>>;
  const items = Array.isArray(obj.items) ? obj.items : [];
  return {
    items,
    total: typeof obj.total === "number" ? obj.total : items.length,
    skip: typeof obj.skip === "number" ? obj.skip : skip,
    take: typeof obj.take === "number" ? obj.take : take,
  };
}

/**
 * Declaraciones filtradas (`GET /declarations`). Todos los filtros son
 * opcionales y combinables. `regimeId` es el Id de Users.TaxRegimes, no el
 * código SAT. Solo contadores (policy Contador.ReadDeclaraciones).
 */
export async function getDeclarations(params: {
  rfc?: string;
  regimeId?: number;
  year?: number;
  periodValueId?: number;
  statusId?: number;
  skip?: number;
  take?: number;
}): Promise<Result<Paged<DeclarationListItem>, OpsError>> {
  const { skip = 0, take = 100 } = params;
  try {
    const data = await fetchGet<unknown>(
      API_ROUTES.DECLARATIONS_OPS.LIST({
        ...params,
        rfc: params.rfc?.trim() || undefined,
      }),
      "declarations_reports",
    );
    return ok(data == null ? EMPTY : normalize(data, skip, take));
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getDeclarations] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener las declaraciones." });
  }
}
