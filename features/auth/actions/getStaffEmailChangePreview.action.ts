"use server";

import { fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { toEmailChangeError } from "../lib/emailChangeError";
import type { EmailChangeError, StaffEmailChangePreview } from "../types";

/** Correo actual de la cuenta dueña del contribuyente + todos sus RFCs (el cambio los afecta a todos). */
export async function getStaffEmailChangePreview(
  taxpayerId: number,
): Promise<Result<StaffEmailChangePreview, EmailChangeError>> {
  try {
    const data = await fetchGet<StaffEmailChangePreview>(
      API_ROUTES.USERS.STAFF_EMAIL_CHANGE_PREVIEW(taxpayerId),
      "users",
    );
    return ok({ ...data, rfcs: data?.rfcs ?? [], blockedReason: data?.blockedReason ?? null });
  } catch (e) {
    return err(toEmailChangeError(e, "No pudimos consultar el correo del cliente."));
  }
}
