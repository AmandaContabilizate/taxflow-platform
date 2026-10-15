"use server";

import { ApiError, fetchGetBlob } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { DownloadableFile } from "@/lib/common/downloadFile";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

interface ExportUsersError {
  statusCode: number;
  message: string;
  code?: string;
}

/** GET users/export (Reports): Excel del padrón con los mismos filtros que el listado, sin paginar. */
export async function exportUsers(params: {
  search?: string;
  role?: string;
  emailConfirmed?: boolean;
  estatus?: string;
  roleExclusive?: boolean;
  origins?: number[];
}): Promise<Result<DownloadableFile, ExportUsersError>> {
  const { search, role, emailConfirmed, estatus, roleExclusive, origins } = params;
  try {
    const { blob, filename } = await fetchGetBlob(
      API_ROUTES.USERS_OPS.EXPORT(
        search?.trim() || undefined,
        role?.trim() || undefined,
        emailConfirmed,
        estatus?.trim() || undefined,
        roleExclusive,
        origins?.length ? origins.join(",") : undefined,
      ),
      "users_reports",
    );
    const buffer = Buffer.from(await blob.arrayBuffer());
    const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12);
    return ok({
      base64: buffer.toString("base64"),
      filename: filename ?? `Usuarios_${stamp}.xlsx`,
      contentType: blob.type || XLSX_MIME,
    });
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode });
    }
    console.error("[exportUsers] Error:", e);
    return err({ statusCode: 500, message: "No pudimos generar el Excel de usuarios." });
  }
}
