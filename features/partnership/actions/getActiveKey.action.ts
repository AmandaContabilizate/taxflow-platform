"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { toPartnershipError } from "../errors";
import type { PartnershipError, ProviderKeyItem } from "../types";

export async function getActiveKey(): Promise<
  Result<ProviderKeyItem | null, PartnershipError>
> {
  try {
    const data = await fetchGet<ProviderKeyItem>(
      API_ROUTES.PARTNERSHIP.KEYS.ACTIVE,
      "partnership",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return ok(null);
    return err(toPartnershipError(e, "No pudimos obtener la llave activa."));
  }
}
