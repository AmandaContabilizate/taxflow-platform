"use server";

import { ApiError, fetchGetBlob } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { DownloadableFile } from "@/lib/common/downloadFile";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

interface ExportClientsError {
  statusCode: number;
  message: string;
  code?: string;
}

/** GET taxpayers/with-paid-sales/export (Reports): Excel del padrón de clientes con los filtros actuales. */
export async function exportClientsWithPaidSales(params: {
  rfc?: string;
  minSales?: number;
}): Promise<Result<DownloadableFile, ExportClientsError>> {
  const { rfc, minSales } = params;
  try {
    const { blob, filename } = await fetchGetBlob(
      API_ROUTES.TAXPAYERS_OPS.WITH_PAID_SALES_EXPORT(rfc?.trim() || undefined, minSales),
      "taxpayers_reports",
    );
    const buffer = Buffer.from(await blob.arrayBuffer());
    const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12);
    return ok({
      base64: buffer.toString("base64"),
      filename: filename ?? `Clientes_${stamp}.xlsx`,
      contentType: blob.type || XLSX_MIME,
    });
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode });
    }
    console.error("[exportClientsWithPaidSales] Error:", e);
    return err({ statusCode: 500, message: "No pudimos generar el Excel de clientes." });
  }
}
