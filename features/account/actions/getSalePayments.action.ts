"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { SalePaymentsPage } from "../types";

interface PaymentsError {
  statusCode: number;
  message: string;
}

// Pagos a Contabilízate por RFC, paginados (GET /api/sales/payments).
export async function getSalePayments(
  rfc: string,
  page = 1,
  pageSize = 20,
): Promise<Result<SalePaymentsPage, PaymentsError>> {
  if (!rfc) {
    return err({ statusCode: 400, message: "Falta el RFC." });
  }

  try {
    const data = await fetchGet<SalePaymentsPage>(
      API_ROUTES.SALES.PAYMENTS(rfc, page, pageSize),
      "sales_procedures",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getSalePayments] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener tus pagos." });
  }
}
