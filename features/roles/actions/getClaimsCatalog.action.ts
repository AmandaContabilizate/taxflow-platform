"use server";

import { cookies } from "next/headers";
import { getBaseUrl } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { toRolesError } from "../errors";
import type {
  ClaimsDepartmentDto,
  GetClaimsCatalogResponse,
  RolesError,
} from "../types";

export async function getClaimsCatalog(): Promise<
  Result<ClaimsDepartmentDto[], RolesError>
> {
  // ── DEBUG (temporal): loguea request + response crudo del backend ──────────
  const url = `${getBaseUrl("roles")}${API_ROUTES.ROLES.CLAIMS_CATALOG}`;
  const token = (await cookies()).get("auth_token")?.value;

  console.log("\n[claims-catalog] ▶ REQUEST");
  console.log("  method :", "GET");
  console.log("  url    :", url);
  console.log("  auth   :", token ? `Bearer ${token.slice(0, 20)}…` : "(sin token)");

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const rawText = await response.text();

    console.log("[claims-catalog] ◀ RESPONSE");
    console.log("  status :", response.status, response.statusText);
    console.log("  ctype  :", response.headers.get("content-type"));
    console.log("  body   :", rawText, "\n");

    if (!response.ok) {
      let message = rawText || `HTTP ${response.status}`;
      try {
        const parsed = JSON.parse(rawText);
        message = parsed?.detail ?? parsed?.title ?? parsed?.message ?? message;
      } catch {
        /* body no-JSON: se queda el texto crudo */
      }
      return err({ statusCode: response.status, message });
    }

    const data = rawText
      ? (JSON.parse(rawText) as GetClaimsCatalogResponse)
      : { departments: [] };
    return ok(data?.departments ?? []);
  } catch (e) {
    console.log("[claims-catalog] ✖ THREW:", e, "\n");
    return err(toRolesError(e, "No pudimos obtener el catálogo de claims."));
  }
}
