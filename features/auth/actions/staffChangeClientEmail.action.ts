"use server";

import { fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { toEmailChangeError } from "../lib/emailChangeError";
import { staffEmailChangeSchema } from "../schemas/emailChange.schema";
import type { EmailChangeError, StaffEmailChangeResult } from "../types";

/**
 * Staff cambia el correo de acceso de un cliente. Se aplica de inmediato: el back cierra las
 * sesiones del cliente y avisa al correo anterior y al nuevo.
 */
export async function staffChangeClientEmail(
  taxpayerId: number,
  newEmail: string,
  reason: string,
  staffPassword: string,
): Promise<Result<StaffEmailChangeResult, EmailChangeError>> {
  const parsed = staffEmailChangeSchema.safeParse({ newEmail, reason, staffPassword });
  if (!parsed.success) {
    return err({
      statusCode: 400,
      message: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    });
  }

  try {
    const response = await fetchPost<StaffEmailChangeResult>(
      API_ROUTES.USERS.STAFF_EMAIL_CHANGE(taxpayerId),
      parsed.data,
      "users",
    );
    return ok(response);
  } catch (e) {
    return err(toEmailChangeError(e, "No pudimos cambiar el correo del cliente."));
  }
}
