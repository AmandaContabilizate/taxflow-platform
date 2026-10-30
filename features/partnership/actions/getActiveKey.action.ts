"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { toPartnershipError } from "../errors";
import type { ActiveKeyResult, PartnershipError, ProviderKeyItem } from "../types";

export async function getActiveKey(): Promise<
  Result<ActiveKeyResult, PartnershipError>
> {
  try {
    // Sin llave activa el backend responde 200 { message, providerName } (sin
    // providerKeyId): se distingue para no pintarla como llave.
    const data = await fetchGet<Partial<ProviderKeyItem> & { message?: string }>(
      API_ROUTES.PARTNERSHIP.KEYS.ACTIVE,
      "partnership",
    );
    const providerName = data?.providerName ?? null;
    const key = data?.providerKeyId != null ? (data as ProviderKeyItem) : null;
    return ok({ key, providerName });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return ok({ key: null, providerName: null });
    return err(toPartnershipError(e, "No pudimos obtener la llave activa."));
  }
}
