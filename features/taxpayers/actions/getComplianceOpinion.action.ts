"use server";

import { ApiError, fetchGetBlob } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { PdfDocument } from "./getTaxCertificate.action";

interface PdfError {
  statusCode: number;
  message: string;
}

export async function getComplianceOpinion(
  rfc: string,
): Promise<Result<PdfDocument, PdfError>> {
  try {
    const { blob, filename } = await fetchGetBlob(
      API_ROUTES.TAXPAYERS.COMPLIANCE_OPINION(rfc),
      "taxpayers",
    );
    const buffer = Buffer.from(await blob.arrayBuffer());
    return ok({
      base64: buffer.toString("base64"),
      filename: filename ?? `opinion-cumplimiento-${rfc}.pdf`,
      contentType: blob.type || "application/pdf",
    });
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getComplianceOpinion] Error:", e);
    return err({
      statusCode: 500,
      message: "No pudimos obtener la Opinión de Cumplimiento.",
    });
  }
}
