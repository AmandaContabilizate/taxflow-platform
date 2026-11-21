"use server";

import { fetchGet, fetchPut } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { toPartnershipError } from "../errors";
import type { PartnerScope, PartnershipError } from "../types";

/** Personal interno (Backoffice.ManageEmpresas): catálogo de scopes de la Partner API. */
export async function getPartnerScopeCatalog(): Promise<Result<PartnerScope[], PartnershipError>> {
  try {
    return ok(await fetchGet<PartnerScope[]>(API_ROUTES.PARTNERSHIP_ADMIN.SCOPES_CATALOG, "partnership_admin"));
  } catch (e) {
    return err(toPartnershipError(e, "No pudimos obtener el catálogo de permisos de la API."));
  }
}

/** Scopes concedidos a un aliado. */
export async function getPartnershipScopes(partnershipId: number): Promise<Result<PartnerScope[], PartnershipError>> {
  try {
    return ok(await fetchGet<PartnerScope[]>(API_ROUTES.PARTNERSHIP_ADMIN.SCOPES(partnershipId), "partnership_admin"));
  } catch (e) {
    return err(toPartnershipError(e, "No pudimos obtener los permisos del aliado."));
  }
}

/** Reemplaza los scopes concedidos (quitar uno lo quita también de sus API keys). */
export async function setPartnershipScopes(
  partnershipId: number,
  scopes: string[],
): Promise<Result<PartnerScope[], PartnershipError>> {
  try {
    return ok(await fetchPut<PartnerScope[]>(API_ROUTES.PARTNERSHIP_ADMIN.SCOPES(partnershipId), { scopes }, "partnership_admin"));
  } catch (e) {
    return err(toPartnershipError(e, "No pudimos guardar los permisos del aliado."));
  }
}
