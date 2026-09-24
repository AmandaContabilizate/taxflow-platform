"use server";

import { ApiError, fetchPostMultipart } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";

export interface UploadTaxCertificateResult {
  rfc: string;
  fechaEmision: string;
  diasDeAntiguedad: number;
  regimenes: string[];
  actividades: number;
  /** Siempre true: la constancia subida queda "sin verificar" hasta que el robot la contraste con el SAT. */
  pendienteDeVerificar: boolean;
}

/** Códigos estables del 400 (ProblemDetails.errorCode); el título no se parsea. */
export type UploadTaxCertificateErrorCode =
  | "FILE_REQUIRED"
  | "CSF_DATE_NOT_FOUND"
  | "CSF_TOO_OLD"
  | "CSF_RFC_MISMATCH"
  | "NO_REGIMES_FOUND"
  | "TAXPAYER_NOT_FOUND";

export interface UploadTaxCertificateError {
  statusCode: number;
  errorCode?: string;
  message: string;
}

/**
 * En un 500 el catálogo (UNEXPECTED_ERROR → "Ocurrió un error inesperado.") tapa el `detail`
 * del ProblemDetails, que es donde Identity pone el mensaje de la excepción. Para la subida de
 * constancia ese detalle es justo lo que se necesita para saber qué falló (blob, régimen,
 * base de datos), así que se antepone al mensaje catalogado. Solo texto corto y de una línea.
 */
/**
 * Identity responde `{ success: true, data: {...} }` (TaxpayersController.SendUploadTaxCertificateAsync)
 * y el cliente HTTP devuelve el cuerpo tal cual: el resultado real va en `data`.
 */
function desenvolver(raw: unknown): UploadTaxCertificateResult {
  const env = raw as { data?: UploadTaxCertificateResult } | null | undefined;
  const r = (env && typeof env === "object" && env.data ? env.data : raw) as UploadTaxCertificateResult;
  return { ...r, regimenes: Array.isArray(r?.regimenes) ? r.regimenes : [] };
}

function mensajeConDetalle(e: ApiError): string {
  if (e.status < 500) return e.message;
  const body = e.body as { detail?: unknown } | null | undefined;
  const detail = typeof body?.detail === "string" ? body.detail.trim() : "";
  if (!detail || detail.length > 400 || /\n/.test(detail)) return e.message;
  return `No se pudo guardar la constancia. Detalle técnico: ${detail}`;
}

/**
 * Sube la constancia de situación fiscal (PDF) del RFC del propio cliente cuando el SAT no
 * responde. El backend valida fecha de emisión (≤ Csf:MaxAgeDays), RFC del PDF y al menos un
 * régimen; si pasa, aplica régimenes/actividades por el mismo camino que el robot.
 */
export async function uploadTaxCertificate(
  rfc: string,
  file: File,
): Promise<Result<UploadTaxCertificateResult, UploadTaxCertificateError>> {
  try {
    const formData = new FormData();
    formData.append("rfc", rfc);
    formData.append("file", file);

    const data = desenvolver(await fetchPostMultipart<unknown>(
      API_ROUTES.TAXPAYERS.UPLOAD_TAX_CERTIFICATE,
      formData,
      "taxpayers",
    ));
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, errorCode: e.errorCode, message: mensajeConDetalle(e) });
    }
    console.error("[uploadTaxCertificate] Error:", e);
    return err({ statusCode: 500, message: "No pudimos subir tu constancia. Intenta de nuevo." });
  }
}

/**
 * Backoffice: el vendedor/gerente sube la constancia que el cliente le mandó, para un
 * contribuyente ajeno (policy GerenciaComercial.RunDiagnosticoCliente). Mismas validaciones.
 */
export async function uploadTaxCertificateStaff(
  taxpayerId: number,
  file: File,
): Promise<Result<UploadTaxCertificateResult, UploadTaxCertificateError>> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const data = desenvolver(await fetchPostMultipart<unknown>(
      API_ROUTES.TAXPAYERS.UPLOAD_TAX_CERTIFICATE_STAFF(taxpayerId),
      formData,
      "taxpayers",
    ));
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, errorCode: e.errorCode, message: mensajeConDetalle(e) });
    }
    console.error("[uploadTaxCertificateStaff] Error:", e);
    return err({ statusCode: 500, message: "No pudimos subir la constancia. Intenta de nuevo." });
  }
}
