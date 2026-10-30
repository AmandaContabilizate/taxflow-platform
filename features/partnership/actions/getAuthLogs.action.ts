"use server";

import { fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { toPartnershipError } from "../errors";
import type { AuthLogItem, PartnershipError } from "../types";

export async function getAuthLogs(): Promise<
  Result<AuthLogItem[], PartnershipError>
> {
  try {
    const data = await fetchGet<AuthLogItem[]>(
      API_ROUTES.PARTNERSHIP.LOGINS,
      "partnership",
    );
    return ok(data);
  } catch (e) {
    return err(toPartnershipError(e, "No pudimos obtener los logs de acceso."));
  }
}
