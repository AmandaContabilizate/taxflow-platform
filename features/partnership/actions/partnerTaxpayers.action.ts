"use server";

import { fetchGet, fetchGetPublic, fetchPost, fetchPostPublic } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { toPartnershipError } from "../errors";
import type {
  OwnerPartnerLink,
  PartnerConsentInfo,
  PartnerLinkStatus,
  PartnerTaxpayerLink,
  PartnerTaxpayerPage,
  PartnershipError,
} from "../types";

// ──────────── Integraciones → Contribuyentes (administrador del aliado) ────────────

export async function getPartnerTaxpayers(params: {
  status?: PartnerLinkStatus | "";
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<Result<PartnerTaxpayerPage, PartnershipError>> {
  const q = new URLSearchParams();
  if (params.status) q.set("status", params.status);
  if (params.search?.trim()) q.set("search", params.search.trim());
  q.set("page", String(params.page ?? 1));
  q.set("pageSize", String(params.pageSize ?? 25));
  try {
    return ok(
      await fetchGet<PartnerTaxpayerPage>(API_ROUTES.PARTNERSHIP.TAXPAYERS.LIST(`?${q.toString()}`), "partnership"),
    );
  } catch (e) {
    return err(toPartnershipError(e, "No pudimos obtener los contribuyentes."));
  }
}

export async function unlinkPartnerTaxpayer(linkId: number): Promise<Result<PartnerTaxpayerLink, PartnershipError>> {
  try {
    return ok(await fetchPost<PartnerTaxpayerLink>(API_ROUTES.PARTNERSHIP.TAXPAYERS.UNLINK(linkId), undefined, "partnership"));
  } catch (e) {
    return err(toPartnershipError(e, "No pudimos desligar el contribuyente."));
  }
}

/** Restricciones vigentes de la API de la empresa (banner de Integraciones). */
export async function getPartnerApiStatus(): Promise<
  Result<{ fullySuspended: boolean; onboardingBlocked: boolean; consentRequestsPerDay: number; consentRequestsPerWeek: number }, PartnershipError>
> {
  try {
    return ok(await fetchGet(API_ROUTES.PARTNERSHIP.API_STATUS, "partnership"));
  } catch (e) {
    return err(toPartnershipError(e, "No pudimos obtener el estado de la API."));
  }
}

// ──────────── Consentimiento con la liga del correo (página pública, sin sesión) ────────────

export async function getPartnerConsent(token: string): Promise<Result<PartnerConsentInfo, PartnershipError>> {
  try {
    return ok(await fetchGetPublic<PartnerConsentInfo>(API_ROUTES.PARTNER_CONSENT.CONSENT(token), "partner_consent"));
  } catch (e) {
    return err(toPartnershipError(e, "No pudimos cargar la solicitud."));
  }
}

export async function respondPartnerConsent(
  token: string,
  action: "accept" | "reject" | "report",
): Promise<Result<{ status: string }, PartnershipError>> {
  try {
    const route =
      action === "accept"
        ? API_ROUTES.PARTNER_CONSENT.CONSENT_ACCEPT(token)
        : action === "reject"
          ? API_ROUTES.PARTNER_CONSENT.CONSENT_REJECT(token)
          : API_ROUTES.PARTNER_CONSENT.CONSENT_REPORT(token);
    return ok(await fetchPostPublic<{ status: string }>(route, undefined, "partner_consent"));
  } catch (e) {
    return err(toPartnershipError(e, "No pudimos registrar tu respuesta."));
  }
}

// ──────────── Mi cuenta → Aliados con acceso (dueño del RFC, con sesión) ────────────

export async function getMyPartnerLinks(): Promise<Result<OwnerPartnerLink[], PartnershipError>> {
  try {
    return ok(await fetchGet<OwnerPartnerLink[]>(API_ROUTES.PARTNER_CONSENT.MY_LINKS, "partner_consent"));
  } catch (e) {
    return err(toPartnershipError(e, "No pudimos obtener los aliados con acceso."));
  }
}

export async function respondMyPartnerLink(
  linkId: number,
  action: "accept" | "reject" | "report" | "revoke",
): Promise<Result<{ status: string }, PartnershipError>> {
  const route =
    action === "accept"
      ? API_ROUTES.PARTNER_CONSENT.MY_LINK_ACCEPT(linkId)
      : action === "reject"
        ? API_ROUTES.PARTNER_CONSENT.MY_LINK_REJECT(linkId)
        : action === "report"
          ? API_ROUTES.PARTNER_CONSENT.MY_LINK_REPORT(linkId)
          : API_ROUTES.PARTNER_CONSENT.MY_LINK_REVOKE(linkId);
  try {
    return ok(await fetchPost<{ status: string }>(route, undefined, "partner_consent"));
  } catch (e) {
    return err(toPartnershipError(e, "No pudimos guardar el cambio."));
  }
}
