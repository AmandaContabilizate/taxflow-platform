"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { DiagnosticoError, DiagnosticoPasos } from "../types";
import { getDiagnosticoMock } from "../mocks/getDiagnosticoMock";

/** Pasos del diagnóstico del RFC del cliente autenticado (modal "i" y redirección post-login). */
export async function getDiagnosticoPasosCliente(
  rfc: string,
): Promise<Result<DiagnosticoPasos, DiagnosticoError>> {
  const mock = await getDiagnosticoMock();
  if (mock) return ok(mock.pasos);

  try {
    const data = await fetchGet<DiagnosticoPasos>(
      API_ROUTES.DIAGNOSTICO.PASOS_CLIENTE(rfc),
      "diagnostico",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, errorCode: e.errorCode });
    }
    console.error("[diagnostico] Error:", e);
    return err({ statusCode: 500, message: "No pudimos consultar los pasos del diagnóstico." });
  }
}
