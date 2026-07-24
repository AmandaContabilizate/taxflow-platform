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
