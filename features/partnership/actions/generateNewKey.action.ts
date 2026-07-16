"use server";

import { fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { toPartnershipError } from "../errors";
import type { NewKeyResponse, PartnershipError } from "../types";

export async function generateNewKey(): Promise<
  Result<NewKeyResponse, PartnershipError>
> {
  try {
    const data = await fetchPost<NewKeyResponse>(
      API_ROUTES.PARTNERSHIP.KEYS.GENERATE,
      undefined,
      "partnership",
    );
    return ok(data);
  } catch (e) {
    return err(toPartnershipError(e, "No pudimos generar la llave."));
  }
}
