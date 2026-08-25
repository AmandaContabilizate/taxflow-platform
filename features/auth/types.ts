/**
 * Contratos del backend ContaboxPro core2 · módulo Identity.
 *
 * LoginRequest  → POST /api/auth/login
 * LoginResponse ← POST /api/auth/login
 * /api/auth/validate devuelve un payload similar para usuario autenticado.
 */

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginResponse {
  userId: string;
  token: string;
  expiresAt: string; // ISO
  refreshToken?: string;
  email?: string;
  fullName?: string;
  rfc?: string;
}

export interface CurrentUser {
  userId: string;
  email?: string;
  fullName?: string;
  rfc?: string;
}

export interface UserInfo {
  userId: string;
  email?: string;
  fullName?: string;
  phoneMobile?: string;
}

export type SignInError = {
  statusCode: number;
  errorCode?: string;
  fieldErrors: Record<string, string[]>;
};
