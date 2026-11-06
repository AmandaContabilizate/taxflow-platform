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
  /** true si entró por el iframe de un partner: no puede cambiar su correo. */
  emailChangeBlocked?: boolean;
  /** Nombre del partner que administra el acceso (p. ej. "MEDIKIT"). */
  emailChangeBlockedReason?: string | null;
}

export interface CurrentUser {
  userId: string;
  email?: string;
  fullName?: string;
  rfc?: string;
  emailChangeBlocked?: boolean;
  emailChangeBlockedReason?: string | null;
}

/** POST /api/Users/email-change/request y /resend */
export interface EmailChangeRequestResponse {
  maskedNewEmail: string;
  resendAvailableAt: string; // ISO
}

/** GET staff/taxpayers/{id}/email-change-preview. `blockedReason` != null → no se puede cambiar. */
export interface StaffEmailChangePreview {
  userId: string;
  currentEmail: string;
  rfcs: string[];
  blockedReason: string | null;
}

export interface StaffEmailChangeResult {
  userId: string;
  oldEmail: string;
  newEmail: string;
}

export interface EmailChangeError {
  statusCode: number;
  message: string;
  errorCode?: string;
  /** INVALID_CODE: intentos que quedan antes de EMAIL_CHANGE_TOO_MANY_ATTEMPTS. */
  attemptsLeft?: number;
  /** EMAIL_CHANGE_BLOCKED_PARTNER_LOGIN: nombre del partner. */
  partner?: string;
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
