"use server";

import { fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { toPartnershipError } from "../errors";
import type {
  AddProviderCorsRequest,
  PartnershipError,
  ProviderCorsItem,
} from "../types";

export async function addProviderCors(
  data: AddProviderCorsRequest,
): Promise<Result<ProviderCorsItem, PartnershipError>> {
  try {
    const created = await fetchPost<ProviderCorsItem>(
      API_ROUTES.PARTNERSHIP.CORS.ADD,
      data,
      "partnership",
    );
    return ok(created);
  } catch (e) {
    return err(toPartnershipError(e, "No pudimos agregar el host."));
  }
}
