"use server";

import { ApiError, fetchGetBlob } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export interface ExportedFile {
  base64: string;
  filename: string;
  contentType: string;
}

export interface ExportCoverageRenewalsError {
  statusCode: number;
  message: string;
  code?: string;
}

/** GET sales/export-coverage-renewals (Reports). Descarga el Excel .xlsx con los 13 campos de SAC. */
export async function exportCoverageRenewals(params: {
  margen?: number;
  regimen?: string;
  search?: string;
}): Promise<Result<ExportedFile, ExportCoverageRenewalsError>> {
  const { margen, regimen, search } = params;
  try {
    const { blob, filename } = await fetchGetBlob(
      API_ROUTES.SALES_OPS.EXPORT_COVERAGE_RENEWALS(
        margen,
        regimen?.trim() || undefined,
        search?.trim() || undefined,
      ),
      "sales_reports",
    );
    const buffer = Buffer.from(await blob.arrayBuffer());
    const fallbackParts = [
      "Renovaciones_SAC",
      new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12),
      margen !== undefined && margen !== null ? `Margen_${margen}M` : "Margen_Todos",
    ];
    if (regimen?.trim()) fallbackParts.push(`Reg_${regimen.trim().replace(/[^a-zA-Z0-9_-]/g, "_")}`);

    return ok({
      base64: buffer.toString("base64"),
      filename: filename ?? `${fallbackParts.join("_")}.xlsx`,
      contentType: blob.type || XLSX_MIME,
    });
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode });
    }
    console.error("[exportCoverageRenewals] Error:", e);
    return err({ statusCode: 500, message: "No pudimos generar el reporte de renovaciones SAC." });
  }
}
