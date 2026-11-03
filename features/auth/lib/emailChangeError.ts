import { ApiError } from "@/lib/api";
import type { EmailChangeError } from "../types";

interface EmailChangeProblemBody {
  attemptsLeft?: number;
  partner?: string;
  extensions?: { attemptsLeft?: number; partner?: string };
}

/**
 * El back manda `attemptsLeft` (INVALID_CODE) y `partner` (EMAIL_CHANGE_BLOCKED_PARTNER_LOGIN)
 * en `extensions` del ProblemDetails; se leen también en la raíz por si el serializador los aplana,
 * igual que hace fetchClient con `errorCode`.
 */
export function toEmailChangeError(e: unknown, fallback: string): EmailChangeError {
  if (!(e instanceof ApiError)) {
    console.error("[emailChange] Error:", e);
    return { statusCode: 500, message: fallback };
  }
  const body = (typeof e.body === "object" && e.body !== null ? e.body : {}) as EmailChangeProblemBody;
  const attemptsLeft = body.extensions?.attemptsLeft ?? body.attemptsLeft;
  const partner = body.extensions?.partner ?? body.partner;
  return {
    statusCode: e.status,
    message: e.message,
    errorCode: e.errorCode,
    attemptsLeft: typeof attemptsLeft === "number" ? attemptsLeft : undefined,
    partner: typeof partner === "string" && partner ? partner : undefined,
  };
}
