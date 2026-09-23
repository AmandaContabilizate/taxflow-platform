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

    const data = await fetchPostMultipart<UploadTaxCertificateResult>(
      API_ROUTES.TAXPAYERS.UPLOAD_TAX_CERTIFICATE,
      formData,
      "taxpayers",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, errorCode: e.errorCode, message: e.message });
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

    const data = await fetchPostMultipart<UploadTaxCertificateResult>(
      API_ROUTES.TAXPAYERS.UPLOAD_TAX_CERTIFICATE_STAFF(taxpayerId),
      formData,
      "taxpayers",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, errorCode: e.errorCode, message: e.message });
    }
    console.error("[uploadTaxCertificateStaff] Error:", e);
    return err({ statusCode: 500, message: "No pudimos subir la constancia. Intenta de nuevo." });
  }
}
