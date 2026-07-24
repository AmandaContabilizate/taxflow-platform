"use server";

import { fetchDelete } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { toPartnershipError } from "../errors";
import type { PartnershipError } from "../types";

export async function deleteProviderCors(
  id: number,
): Promise<Result<void, PartnershipError>> {
  try {
    await fetchDelete<void>(API_ROUTES.PARTNERSHIP.CORS.DELETE(id), "partnership");
    return ok(undefined);
  } catch (e) {
    return err(toPartnershipError(e, "No pudimos eliminar el host."));
  }
}
