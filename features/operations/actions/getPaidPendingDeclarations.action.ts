"use server";

import { cookies } from "next/headers";
import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { DeclarationKind, PaidPendingDeclaration } from "../types";

interface OpsError {
  statusCode: number;
  message: string;
}

export async function getPaidPendingDeclarations(
  kind: DeclarationKind,
  skip = 0,
  take = 500,
  // Cuando es true, filtra por el contador autenticado (cookie "userId").
  onlyMine = false,
): Promise<Result<PaidPendingDeclaration[], OpsError>> {
  try {
    let accountantUserId: string | undefined;
    if (onlyMine) {
      const cookieStore = await cookies();
      accountantUserId = cookieStore.get("userId")?.value;
      if (!accountantUserId) {
        return err({ statusCode: 400, message: "No pudimos identificar tu usuario." });
      }
    }

    const data = await fetchGet<PaidPendingDeclaration[]>(
      API_ROUTES.DECLARATIONS_OPS.PAID_PENDING(kind, skip, take, accountantUserId),
      "declarations_reports",
    );
    return ok(Array.isArray(data) ? data : []);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getPaidPendingDeclarations] Error:", e);
    return err({
      statusCode: 500,
      message: "No pudimos obtener las declaraciones pendientes.",
    });
  }
}
