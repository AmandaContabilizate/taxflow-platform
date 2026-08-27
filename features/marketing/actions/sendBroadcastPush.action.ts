"use server";

import { ApiError, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";

export interface BroadcastPushRequest {
  title: string;
  body: string;
  category?: string;
  imageUrl?: string;
  targetAudience?: string;
  roleName?: string;
  userIds?: string[];
}

export interface BroadcastPushResponse {
  success: boolean;
  totalTargetUsers?: number;
  totalTokensFound?: number;
  successCount?: number;
  failureCount?: number;
  message?: string;
}

interface MarketingError {
  statusCode: number;
  message: string;
}

export async function sendBroadcastPushAction(
  payload: BroadcastPushRequest
): Promise<Result<BroadcastPushResponse, MarketingError>> {
  try {
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
    return err({ statusCode: 500, message: "No pudimos despachar la notificación Push masiva." });
  }
}
