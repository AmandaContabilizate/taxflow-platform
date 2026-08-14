"use server";

import { ApiError, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { BroadcastPushRequest, BroadcastPushResponse } from "../tools/types";

interface BroadcastError {
  statusCode: number;
  message: string;
}

export async function sendBroadcastPushAction(
  request: BroadcastPushRequest
): Promise<Result<BroadcastPushResponse, BroadcastError>> {
  try {
    const payload: BroadcastPushRequest = {
      ...request,
      dbOrigin: 2, // Fuerza siempre 2 = SQL Server (MSSQL)
    };
    const data = await fetchPost<BroadcastPushResponse>(
      API_ROUTES.MARKETING.BROADCAST_PUSH,
      payload,
      "marketing"
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[sendBroadcastPushAction] Error:", e);
    return err({
      statusCode: 500,
      message: "No fue posible despachar la campaña de notificación Push.",
    });
  }
}
