"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { ActivePlan, PlanAccount, PlanAccountBase } from "../types";

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

const PAID_STATUS_ID = 2;

function normalizeAccount(
  raw: Partial<PlanAccountBase> | null | undefined,
  fallbackRfc: string,
): PlanAccountBase {
  const rawCompras = raw?.compras ?? [];
  const paidCompras = rawCompras.filter(
    (c) => c.statusId === PAID_STATUS_ID || c.status?.toLowerCase() === "pagada",
  );

  return {
    rfc: raw?.rfc ?? fallbackRfc,
    legalName: raw?.legalName ?? null,
    plan: raw?.plan ?? NO_PLAN,
    compras: paidCompras,
  };
}

/**
 * Cuenta completa del RFC: plan vigente, historial de compras y los demás RFC
 * del usuario.
 */
export async function getPlanAccount(
  rfc: string,
): Promise<Result<PlanAccount, ActivePlanError>> {
  try {
    const data = await fetchGet<PlanAccount | null>(
      API_ROUTES.STRIPE.ACTIVE_PLAN(rfc),
      "stripe",
    );
    return ok({
      ...normalizeAccount(data, rfc),
      otrosRfc: (data?.otrosRfc ?? []).map((other) =>
        normalizeAccount(other, other?.rfc ?? ""),
      ),
    });
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getPlanAccount] Error:", e);
    return err({
      statusCode: 500,
      message: "No pudimos obtener tu plan activo.",
    });
  }
}

/** Solo el plan vigente del RFC, para las vistas que no necesitan las compras. */
export async function getActivePlan(
  rfc: string,
): Promise<Result<ActivePlan, ActivePlanError>> {
  const res = await getPlanAccount(rfc);
  if (!res.success) return res;
  return ok(res.value.plan);
}
