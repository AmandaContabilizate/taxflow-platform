"use server";

import { ApiError, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";

export interface BroadcastPushRequest {
  title: string;
  body: string;
  category?: string;
  actionUrl?: string;
  imageUrl?: string;
  targetAudience?: string;
  roleName?: string;
  userIds?: string[];
  sendChannel?: string;
}

export interface BroadcastPushDetail {
  userId?: string;
  email?: string | null;
  rfc?: string | null;
  token?: string;
  platform?: string;
  status?: string;
  messageId?: string | null;
  error?: string | null;
}

export interface BroadcastPushResponse {
  success: boolean;
  message?: string;
  targetAudience?: string;
  totalUsersTargeted?: number;
  totalTokensFound?: number;
  sentCount?: number;
  failedCount?: number;
  details?: BroadcastPushDetail[];
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
