"use server";

import { ApiError, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { CancelSubscriptionResponse } from "../types";

interface CancelError {
  statusCode: number;
  message: string;
}

export async function cancelSubscription(
  subscriptionId: string,
): Promise<Result<CancelSubscriptionResponse, CancelError>> {
  try {
    const data = await fetchPost<CancelSubscriptionResponse>(
      API_ROUTES.STRIPE.SUBSCRIPTION_CANCEL,
      { subscriptionId },
      "stripe",
    );
    return ok(data ?? { success: true });
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[cancelSubscription] Error:", e);
    return err({
      statusCode: 500,
      message: "No se pudo cancelar la suscripción.",
    });
  }
}
