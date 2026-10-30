"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { CurrentSubscription } from "../types";

interface SubscriptionError {
  statusCode: number;
  message: string;
}

export async function getCurrentSubscription(
  rfc: string,
): Promise<Result<CurrentSubscription, SubscriptionError>> {
  try {
    const data = await fetchGet<CurrentSubscription>(
      API_ROUTES.STRIPE.SUBSCRIPTION_CURRENT(rfc),
      "stripe",
    );
    return ok(data ?? { hasSubscription: false });
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getCurrentSubscription] Error:", e);
    return err({
      statusCode: 500,
      message: "No pudimos obtener tu suscripción actual.",
    });
  }
}
