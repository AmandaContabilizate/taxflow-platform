"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";

export interface DocumentMetadata {
  rfc?: string;
  status?: string;
  documentType?: string;
  generatedAt?: string;
  expiresAt?: string;
  [key: string]: unknown;
}

export interface DocumentMetadataResult {
  success: boolean;
  metadata?: DocumentMetadata;
  message?: string;
}

interface MetadataError {
  statusCode: number;
  message: string;
}

const RFC_NOT_FOUND_RE = /(taxpayer with )?rfc .* not found/i;

/**
 * Normaliza la respuesta del backend. Es tolerante a variantes:
 *  - envuelta `{ success, metadata }` (camelCase o PascalCase), o
 *  - el objeto de metadata directo (sin wrapper).
 */
function normalize(
  raw: unknown,
): Result<DocumentMetadata, MetadataError> {
  const data = (raw ?? {}) as Record<string, unknown>;

  const success =
    typeof data.success === "boolean"
      ? data.success
      : typeof data.Success === "boolean"
        ? (data.Success as boolean)
        : undefined;

  const metadata = (data.metadata ?? data.Metadata) as
    | DocumentMetadata
    | undefined;

  // Respuesta envuelta y exitosa.
  if (success === true && metadata) return ok(metadata);

  // Sin wrapper: el propio objeto es la metadata (no trae flag `success`).
  if (success === undefined && metadata === undefined && Object.keys(data).length > 0) {
    return ok(data as DocumentMetadata);
  }

  const message =
    (typeof data.message === "string" && data.message) ||
    (typeof data.Message === "string" && (data.Message as string)) ||
    "Documento no disponible.";
  const statusCode = RFC_NOT_FOUND_RE.test(message) ? 422 : 404;
  return err({ statusCode, message });
}

function handleError(
  e: unknown,
  context: string,
  fallback: string,
): Result<never, MetadataError> {
  if (e instanceof ApiError) {
    return err({ statusCode: e.status, message: e.message });
  }
  console.error(`[${context}] Error:`, e);
  return err({ statusCode: 500, message: fallback });
}

export async function getTaxCertificateMetadata(
  rfc: string,
): Promise<Result<DocumentMetadata, MetadataError>> {
  try {
    const data = await fetchGet<unknown>(
      API_ROUTES.METADATA.TAX_CERTIFICATE(rfc),
      "taxpayers",
    );
    console.log("[getTaxCertificateMetadata] raw:", JSON.stringify(data));
    return normalize(data);
  } catch (e) {
    return handleError(
      e,
      "getTaxCertificateMetadata",
      "No pudimos consultar la metadata de la Constancia de Situación Fiscal.",
    );
  }
}

export async function getComplianceOpinionMetadata(
  rfc: string,
): Promise<Result<DocumentMetadata, MetadataError>> {
  try {
    const data = await fetchGet<unknown>(
      API_ROUTES.METADATA.COMPLIANCE_OPINION(rfc),
      "taxpayers",
    );
    console.log("[getComplianceOpinionMetadata] raw:", JSON.stringify(data));
    return normalize(data);
  } catch (e) {
    return handleError(
      e,
      "getComplianceOpinionMetadata",
      "No pudimos consultar la metadata de la Opinión de Cumplimiento.",
    );
  }
}
