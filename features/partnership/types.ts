export interface ProviderCorsItem {
  providerCorsId: number;
  hostName: string;
  label: string | null;
  createdAt: string;
  isActive: boolean;
}

export interface AddProviderCorsRequest {
  hostName: string;
  label?: string;
}

export interface ProviderKeyItem {
  providerKeyId: number;
  privateKeyPrefijo: string | null;
  privateKeyPostfijo: string | null;
  createdAt: string;
  isActive: boolean;
  providerName: string | null;
}

/** Llave activa (null si no hay) + nombre del partnership, que llega aun sin llave. */
export interface ActiveKeyResult {
  key: ProviderKeyItem | null;
  providerName: string | null;
}

export interface NewKeyResponse {
  providerKeyId: number;
  privateKeyPrefijo: string | null;
  privateKeyPostfijo: string | null;
  createdAt: string;
  privateKey: string;
  providerName: string | null;
}

export interface AuthLogItem {
  authLogId: number;
  userId: string | null;
  tokenId: string | null;
  logDate: string;
  result: string;
  details: string | null;
}

/** Error uniforme de las acciones de partnership. */
export interface PartnershipError {
  statusCode: number;
  message: string;
}

// ──────────── Partner API v1 ────────────

/** Llave de firma del aliado (SSO y JWT de la Partner API). `keyId` es el `kid` de sus JWT. */
export interface ProviderKeySummary {
  providerKeyId: number;
  keyId: string;
  source: "Generated" | "Uploaded";
  validFrom: string;
  validTo: string | null;
  createdAt: string;
  privateKeyPrefijo: string | null;
  privateKeyPostfijo: string | null;
  status: "Active" | "Expired" | "Revoked";
}

export interface UploadPublicKeyRequest {
  publicKeyPem: string;
  /** Obligatorio si no es certificado X.509. */
  expiresInDays?: number;
}

export interface PartnerScope {
  code: string;
  description: string;
}

export interface PartnerApiKey {
  id: number;
  name: string;
  prefix: string;
  scopes: string[];
  expiresAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  status: "Active" | "Expired" | "Revoked";
}

export interface CreatePartnerApiKeyRequest {
  name: string;
  scopes: string[];
  expiresInDays?: number;
}

/** `apiKey` llega UNA sola vez; no se puede volver a consultar. */
export interface CreatedPartnerApiKey {
  id: number;
  name: string;
  prefix: string;
  apiKey: string;
  scopes: string[];
  expiresAt: string;
}

export interface PartnerRequestLogItem {
  id: number;
  credentialType: "ApiKey" | "ProviderKey";
  credentialId: number;
  httpMethod: string;
  path: string;
  rfc: string | null;
  statusCode: number;
  durationMs: number;
  createdAt: string;
}

// ──────────── Webhooks (Partner API v1, Fase 4) ────────────

export interface PartnerEventTypeItem {
  code: string;
  description: string;
}

export interface WebhookEndpoint {
  id: number;
  url: string;
  description: string | null;
  isActive: boolean;
  events: string[];
  secretRotatedAt: string;
  createdAt: string;
}

/** `secret` llega UNA sola vez (alta o rotación). */
export interface WebhookEndpointWithSecret {
  endpoint: WebhookEndpoint;
  secret: string;
}

export interface WebhookEndpointRequest {
  url: string;
  description?: string;
  events: string[];
  isActive: boolean;
}

export interface WebhookDelivery {
  id: number;
  endpointId: number;
  eventId: string;
  eventType: string;
  rfc: string | null;
  status: "Pending" | "Delivered" | "Failed" | "Retrying";
  attempts: number;
  httpStatus: number | null;
  lastError: string | null;
  isManualRedelivery: boolean;
  createdAt: string;
  sentAt: string | null;
  nextAttemptAt: string;
}

// ──────────── Contribuyentes ligados (Partner API v1, Fase 2) ────────────

export type PartnerLinkStatus =
  | "pending_consent"
  | "active"
  | "rejected"
  | "revoked_by_owner"
  | "unlinked"
  | "consent_expired"
  | "reported_by_owner";

export interface PartnerTaxpayerLink {
  linkId: number;
  rfc: string;
  status: PartnerLinkStatus;
  externalReference: string | null;
  linkOrigin: "created_by_partner" | "existing_partner_user" | "owner_consent" | null;
  consentExpiresAt: string | null;
  activatedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  /** Solo con liga activa. */
  taxpayer: {
    legalName: string | null;
    ciec: { status: "missing" | "unverified" | "valid" | "invalid" };
    efirma: { status: "missing" | "unverified" | "valid" | "invalid" | "expired"; validTo: string | null };
  } | null;
}

export interface PartnerTaxpayerPage {
  items: PartnerTaxpayerLink[];
  total: number;
  page: number;
  pageSize: number;
}

/** Página pública /consentimiento/[token]. */
export interface PartnerConsentInfo {
  status: "pending" | "accepted" | "rejected" | "expired" | "cancelled" | "invalid";
  partnerName: string | null;
  rfc: string | null;
  legalName: string | null;
  expiresAt: string | null;
  permissions: string[];
}

/** Mi cuenta → Aliados con acceso. */
export interface OwnerPartnerLink {
  linkId: number;
  partnerName: string;
  rfc: string;
  status: "pending_consent" | "active";
  activatedAt: string | null;
  consentRequestedAt: string | null;
  consentExpiresAt: string | null;
}
