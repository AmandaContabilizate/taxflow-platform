"use server";

import { fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { toPartnershipError } from "../errors";
import type { PartnershipError, ProviderCorsItem } from "../types";

export async function getProviderCors(): Promise<
  Result<ProviderCorsItem[], PartnershipError>
> {
  try {
    const data = await fetchGet<ProviderCorsItem[]>(
      API_ROUTES.PARTNERSHIP.CORS.LIST,
      "partnership",
    );
    return ok(data);
  } catch (e) {
    return err(toPartnershipError(e, "No pudimos obtener los hosts CORS."));
  }
}
