"use server";

import { ApiError, fetchGet, fetchPost, fetchPut } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { AdminPartnersError, PartnerAbuseAlert, PartnerAbuseDetail, PartnerAbuseOverviewRow } from "../types";

function toError(e: unknown, fallback: string): AdminPartnersError {
  if (e instanceof ApiError) return { statusCode: e.status, message: e.message || fallback };
  console.error("[admin-partners]", fallback, e);
  return { statusCode: 500, message: fallback };
}

export async function getAdminPartnersOverview(): Promise<Result<PartnerAbuseOverviewRow[], AdminPartnersError>> {
  try {
    return ok(await fetchGet<PartnerAbuseOverviewRow[]>(API_ROUTES.ADMIN_PARTNERS.OVERVIEW, "admin_partners"));
  } catch (e) {
    return err(toError(e, "No pudimos cargar el tablero de aliados."));
  }
}

export async function getAdminPartnersAlerts(
  status: "open" | "reviewed" | "dismissed" | "all",
  partnershipId?: number,
): Promise<Result<PartnerAbuseAlert[], AdminPartnersError>> {
  const q = new URLSearchParams({ status });
  if (partnershipId) q.set("partnershipId", String(partnershipId));
  try {
    return ok(await fetchGet<PartnerAbuseAlert[]>(API_ROUTES.ADMIN_PARTNERS.ALERTS(`?${q.toString()}`), "admin_partners"));
  } catch (e) {
    return err(toError(e, "No pudimos cargar las alertas."));
  }
}

export async function reviewAdminPartnersAlert(
  alertId: number,
  dismiss: boolean,
  notes: string,
): Promise<Result<true, AdminPartnersError>> {
  try {
    const route = dismiss ? API_ROUTES.ADMIN_PARTNERS.ALERT_DISMISS(alertId) : API_ROUTES.ADMIN_PARTNERS.ALERT_REVIEW(alertId);
    await fetchPost<void>(route, { notes }, "admin_partners");
    return ok(true);
  } catch (e) {
    return err(toError(e, "No pudimos actualizar la alerta."));
  }
}

export async function getAdminPartnerDetail(partnershipId: number): Promise<Result<PartnerAbuseDetail, AdminPartnersError>> {
  try {
    return ok(await fetchGet<PartnerAbuseDetail>(API_ROUTES.ADMIN_PARTNERS.DETAIL(partnershipId), "admin_partners"));
  } catch (e) {
    return err(toError(e, "No pudimos cargar el detalle del aliado."));
  }
}

export async function restrictAdminPartner(
  partnershipId: number,
  type: "suspend" | "block-onboarding",
  notes: string,
): Promise<Result<true, AdminPartnersError>> {
  try {
    const route =
      type === "suspend"
        ? API_ROUTES.ADMIN_PARTNERS.SUSPEND(partnershipId)
        : API_ROUTES.ADMIN_PARTNERS.BLOCK_ONBOARDING(partnershipId);
    await fetchPost<unknown>(route, { notes }, "admin_partners");
    return ok(true);
  } catch (e) {
    return err(toError(e, "No pudimos aplicar la restricción."));
  }
}

export async function liftAdminPartnerRestriction(
  partnershipId: number,
  restrictionId: number,
  notes: string,
): Promise<Result<true, AdminPartnersError>> {
  try {
    await fetchPost<void>(API_ROUTES.ADMIN_PARTNERS.LIFT(partnershipId, restrictionId), { notes }, "admin_partners");
    return ok(true);
  } catch (e) {
    return err(toError(e, "No pudimos reactivar."));
  }
}

export async function setAdminPartnerLimits(
  partnershipId: number,
  consentRequestsPerDay: number | null,
  consentRequestsPerWeek: number | null,
): Promise<Result<true, AdminPartnersError>> {
  try {
    await fetchPut<void>(
      API_ROUTES.ADMIN_PARTNERS.LIMITS(partnershipId),
      { consentRequestsPerDay, consentRequestsPerWeek },
      "admin_partners",
    );
    return ok(true);
  } catch (e) {
    return err(toError(e, "No pudimos guardar los topes."));
  }
}
