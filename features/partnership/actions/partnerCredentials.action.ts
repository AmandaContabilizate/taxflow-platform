"use server";

import { fetchGet, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { toPartnershipError } from "../errors";
import type {
  CreatePartnerApiKeyRequest,
  CreatedPartnerApiKey,
  PartnerApiKey,
  PartnerRequestLogItem,
  PartnerScope,
  PartnershipError,
  ProviderKeySummary,
  UploadPublicKeyRequest,
} from "../types";

// ──────────── Llaves de firma (SSO + JWT de la Partner API) ────────────

export async function getAllProviderKeys(): Promise<Result<ProviderKeySummary[], PartnershipError>> {
  try {
    return ok(await fetchGet<ProviderKeySummary[]>(API_ROUTES.PARTNERSHIP.KEYS.ALL, "partnership"));
  } catch (e) {
    return err(toPartnershipError(e, "No pudimos obtener las llaves."));
  }
}

export async function uploadPublicKey(
  data: UploadPublicKeyRequest,
): Promise<Result<ProviderKeySummary, PartnershipError>> {
  try {
    return ok(await fetchPost<ProviderKeySummary>(API_ROUTES.PARTNERSHIP.KEYS.UPLOAD, data, "partnership"));
  } catch (e) {
    return err(toPartnershipError(e, "No pudimos registrar la llave pública."));
  }
}

export async function revokeProviderKey(id: number): Promise<Result<true, PartnershipError>> {
  try {
    await fetchPost<void>(API_ROUTES.PARTNERSHIP.KEYS.REVOKE(id), undefined, "partnership");
    return ok(true);
  } catch (e) {
    return err(toPartnershipError(e, "No pudimos revocar la llave."));
  }
}

// ──────────── API keys ────────────

export async function getPartnerApiKeys(): Promise<Result<PartnerApiKey[], PartnershipError>> {
  try {
    return ok(await fetchGet<PartnerApiKey[]>(API_ROUTES.PARTNERSHIP.API_KEYS.LIST, "partnership"));
  } catch (e) {
    return err(toPartnershipError(e, "No pudimos obtener las API keys."));
  }
}

export async function getGrantedScopes(): Promise<Result<PartnerScope[], PartnershipError>> {
  try {
    return ok(await fetchGet<PartnerScope[]>(API_ROUTES.PARTNERSHIP.API_KEYS.SCOPES, "partnership"));
  } catch (e) {
    return err(toPartnershipError(e, "No pudimos obtener los permisos de su empresa."));
  }
}

export async function createPartnerApiKey(
  data: CreatePartnerApiKeyRequest,
): Promise<Result<CreatedPartnerApiKey, PartnershipError>> {
  try {
    return ok(await fetchPost<CreatedPartnerApiKey>(API_ROUTES.PARTNERSHIP.API_KEYS.CREATE, data, "partnership"));
  } catch (e) {
    return err(toPartnershipError(e, "No pudimos crear la API key."));
  }
}

export async function revokePartnerApiKey(id: number): Promise<Result<true, PartnershipError>> {
  try {
    await fetchPost<void>(API_ROUTES.PARTNERSHIP.API_KEYS.REVOKE(id), undefined, "partnership");
    return ok(true);
  } catch (e) {
    return err(toPartnershipError(e, "No pudimos revocar la API key."));
  }
}

export async function getPartnerApiRequests(days = 5): Promise<Result<PartnerRequestLogItem[], PartnershipError>> {
  try {
    return ok(await fetchGet<PartnerRequestLogItem[]>(API_ROUTES.PARTNERSHIP.API_REQUESTS(days), "partnership"));
  } catch (e) {
    return err(toPartnershipError(e, "No pudimos obtener la bitácora de la API."));
  }
}
