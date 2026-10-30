"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { DeclarationReportLink } from "../types";

interface ReportLinkError {
  statusCode: number;
  message: string;
  /** DECLARATION_NOT_FOUND | REPORT_LINK_NOT_AVAILABLE | INVALID_REQUEST. */
  code?: string;
}

/**
 * Enlace al reporte del cliente para previsualizarlo desde el modal de envío.
 * Solo lectura: no cambia estatus ni manda correo. Misma policy que
 * `resend-to-client` (Contador.UpdateDeclaracionEstatus).
 */
export async function getDeclarationReportLink(
  declarationId: number,
): Promise<Result<DeclarationReportLink, ReportLinkError>> {
  if (!declarationId || declarationId <= 0) {
    return err({ statusCode: 400, message: "Declaración inválida.", code: "INVALID_REQUEST" });
  }

  try {
    const data = await fetchGet<DeclarationReportLink>(
      API_ROUTES.DECLARATIONS_PROCEDURES.REPORT_LINK(declarationId),
      "declarations_procedures",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode });
    }
    console.error("[getDeclarationReportLink] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener el enlace del reporte." });
  }
}
