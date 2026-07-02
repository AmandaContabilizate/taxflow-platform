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

export async function getClientsWithPaidSales(params: {
  skip?: number;
  take?: number;
  rfc?: string;
}): Promise<Result<Paged<ClientListItem>, ClientsError>> {
  const { skip = 0, take = 100, rfc } = params;
  try {
    const data = await fetchGet<Paged<ClientListItem>>(
      API_ROUTES.TAXPAYERS_OPS.WITH_PAID_SALES(skip, take, rfc?.trim() || undefined),
      "taxpayers_reports",
    );
    return ok(data ?? EMPTY);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getClientsWithPaidSales] Error:", e);
    return err({
      statusCode: 500,
      message: "No pudimos obtener los clientes.",
    });
  }
}
