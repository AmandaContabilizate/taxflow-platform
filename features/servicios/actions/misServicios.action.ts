"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { MyServices, ServiciosError } from "../types";

/** Servicios contratados (por mí o por mi empresa) y disponibles. GET api/mis-servicios?rfc= */
export async function getMyServices(rfc?: string | null): Promise<Result<MyServices, ServiciosError>> {
  try {
    const data = await fetchGet<{ success: boolean; servicios: MyServices }>(API_ROUTES.MIS_SERVICIOS.LIST(rfc ?? undefined), "mis_servicios");
    return ok(data.servicios ?? { contracted: [], available: [] });
  } catch (e) {
    if (e instanceof ApiError) return err({ statusCode: e.status, message: e.message });
    console.error("[getMyServices] Error:", e);
    return err({ statusCode: 500, message: "No pudimos cargar tus servicios." });
  }
}
