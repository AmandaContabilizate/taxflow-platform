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
