"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { ActivePlan } from "../types";

interface ActivePlanError {
  statusCode: number;
  message: string;
}

const NO_PLAN: ActivePlan = {
  hasPlan: false,
  type: null,
  saleId: null,
  planId: null,
  planKey: null,
  planName: null,
  price: null,
  currency: null,
  billingPeriod: null,
  features: null,
  featuresJson: null,
  status: null,
  subscriptionId: null,
  renewDate: null,
  nextChargeAmount: null,
  paymentIntentId: null,
  paidAmount: null,
  paidAt: null,
};

export async function getActivePlan(
  rfc: string,
): Promise<Result<ActivePlan, ActivePlanError>> {
  try {
    const data = await fetchGet<ActivePlan>(
      API_ROUTES.STRIPE.ACTIVE_PLAN(rfc),
      "stripe",
    );
    return ok(data ?? NO_PLAN);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getActivePlan] Error:", e);
    return err({
      statusCode: 500,
      message: "No pudimos obtener tu plan activo.",
    });
  }
}
