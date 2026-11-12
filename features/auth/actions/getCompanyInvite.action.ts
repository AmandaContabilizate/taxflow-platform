"use server";

import { fetchGetPublic } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import type { CompanyInviteInfo } from "../types";

/**
 * Estado de una liga de invitación de empresa (?ref=EMP-…). GET /api/users/company-invite/{ref}, anónimo.
 * Cualquier fallo se reporta como "invalid" para que el login no se rompa.
 */
export async function getCompanyInvite(ref: string): Promise<CompanyInviteInfo> {
  try {
    const info = await fetchGetPublic<CompanyInviteInfo>(API_ROUTES.USERS.COMPANY_INVITE(ref), "users");
    return info ?? { status: "invalid" };
  } catch (e) {
    console.error("[getCompanyInvite] Error:", e instanceof Error ? e.message : String(e));
    return { status: "invalid" };
  }
}
