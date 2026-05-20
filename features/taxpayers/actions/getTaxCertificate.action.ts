"use server";

import { ApiError, fetchGetBlob } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";

export interface PdfDocument {
  base64: string;
  filename: string;
  contentType: string;
}

interface PdfError {
  statusCode: number;
  message: string;
}

export async function getTaxCertificate(
  rfc: string,
): Promise<Result<PdfDocument, PdfError>> {
  try {
    const { blob, filename } = await fetchGetBlob(
      API_ROUTES.TAXPAYERS.TAX_CERTIFICATE(rfc),
      "taxpayers",
    );
    const buffer = Buffer.from(await blob.arrayBuffer());
    return ok({
      base64: buffer.toString("base64"),
      filename: filename ?? `csf-${rfc}.pdf`,
      contentType: blob.type || "application/pdf",
    });
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getTaxCertificate] Error:", e);
    return err({
      statusCode: 500,
      message: "No pudimos obtener la Constancia de Situación Fiscal.",
    });
  }
}
