"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { SellerDashboard } from "../types";

interface UsersError {
  statusCode: number;
  message: string;
}

/**
 * Panel comercial (GET /users/seller-dashboard): embudo de onboarding, altas
 * recientes y clientes con RFC. El backend acota el alcance por claims: quien
 * solo tiene Comercial.ReadOwnUsers ve únicamente su propio embudo.
 */
export async function getSellerDashboard(): Promise<Result<SellerDashboard, UsersError>> {
  try {
    const data = await fetchGet<SellerDashboard>(
      API_ROUTES.USERS_OPS.SELLER_DASHBOARD,
      "users_reports",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getSellerDashboard] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener tu panel." });
  }
}
