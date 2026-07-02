"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { Paged, TaxpayerListItem } from "../types";

interface TaxpayersError {
  statusCode: number;
  message: string;
}

const EMPTY: Paged<TaxpayerListItem> = { items: [], total: 0, skip: 0, take: 0 };

export async function getTaxpayers(params: {
  skip?: number;
  take?: number;
  rfc?: string;
}): Promise<Result<Paged<TaxpayerListItem>, TaxpayersError>> {
  const { skip = 0, take = 100, rfc } = params;
  try {
    const data = await fetchGet<Paged<TaxpayerListItem>>(
      API_ROUTES.TAXPAYERS_OPS.LIST(skip, take, rfc?.trim() || undefined),
      "taxpayers_reports",
    );
    return ok(data ?? EMPTY);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getTaxpayers] Error:", e);
    return err({
      statusCode: 500,
      message: "No pudimos obtener los contribuyentes.",
    });
  }
}
