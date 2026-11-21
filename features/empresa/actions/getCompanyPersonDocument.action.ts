"use server";

import { ApiError, fetchGetBlob } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { EmpresaError } from "../types";

export type CompanyDocumentKind = "constancia" | "opinion";

export interface CompanyPersonDocument {
  base64: string;
  filename: string;
  contentType: string;
}

/**
 * PDF de la constancia u opinión de cumplimiento de una persona de mi empresa (Procedures, permiso
 * Empresa.VerExpediente + alcance autorizado). El backend deja bitácora de la descarga.
 */
export async function getCompanyPersonDocument(
  personId: number,
  tipo: CompanyDocumentKind,
  partnershipId?: number,
): Promise<Result<CompanyPersonDocument, EmpresaError>> {
  try {
    const query = partnershipId ? `?partnershipId=${partnershipId}` : "";
    const { blob, filename } = await fetchGetBlob(`${API_ROUTES.EMPRESA.PERSONA_DOCUMENTO(personId, tipo)}${query}`, "empresa");
    const buffer = Buffer.from(await blob.arrayBuffer());
    return ok({
      base64: buffer.toString("base64"),
      filename: filename ?? `${tipo === "constancia" ? "CSF" : "Opinion"}_${personId}.pdf`,
      contentType: blob.type || "application/pdf",
    });
  } catch (e) {
    if (e instanceof ApiError) {
      const body = e.body as { errorCode?: string; message?: string } | null;
      return err({ statusCode: e.status, errorCode: e.errorCode ?? body?.errorCode, message: body?.message ?? e.message });
    }
    console.error("[getCompanyPersonDocument] Error:", e);
    return err({ statusCode: 500, message: "No pudimos abrir el documento." });
  }
}
