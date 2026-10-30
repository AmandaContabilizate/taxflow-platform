"use server";

import { ApiError, fetchGetBlob } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { DownloadableFile } from "@/lib/common/downloadFile";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

interface ExportTaxpayersError {
  statusCode: number;
  message: string;
  code?: string;
}

/** GET taxpayers/export (Reports): Excel del padrón de contribuyentes con los filtros actuales. */
export async function exportTaxpayers(params: {
  rfc?: string;
  regimeId?: number;
  minSales?: number;
}): Promise<Result<DownloadableFile, ExportTaxpayersError>> {
  const { rfc, regimeId, minSales } = params;
  try {
    const { blob, filename } = await fetchGetBlob(
      API_ROUTES.TAXPAYERS_OPS.LIST_EXPORT(rfc?.trim() || undefined, regimeId, minSales),
      "taxpayers_reports",
    );
    const buffer = Buffer.from(await blob.arrayBuffer());
    const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12);
    return ok({
      base64: buffer.toString("base64"),
      filename: filename ?? `Contribuyentes_${stamp}.xlsx`,
      contentType: blob.type || XLSX_MIME,
    });
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode });
    }
    console.error("[exportTaxpayers] Error:", e);
    return err({ statusCode: 500, message: "No pudimos generar el Excel de contribuyentes." });
  }
}
