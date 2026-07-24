import { PROTECTED_ROUTES, PUBLIC_ROUTES } from "@/lib/routes";

/**
 * Solo Employee/Guest son cuentas de "usuario final" atadas a un RFC propio
 * — deben completar perfil/onboarding si aún no tienen uno vinculado. El
 * resto de roles (staff interno: Accountant, Seller, Admin, etc.) no operan
 * sobre su propio RFC y entran directo al dashboard sin importar si tienen
 * uno o no.
 */
const RFC_REQUIRED_ROLES = new Set(["employee", "guest"]);

export function resolveLoginDestination(params: {
  role?: string | null;
  rfc?: string | null;
  fullName?: string | null;
  fallback: string;
}): string {
  const { role, rfc, fullName, fallback } = params;

  const requiresRfc = !role || RFC_REQUIRED_ROLES.has(role.toLowerCase());
  if (!requiresRfc || rfc) return fallback;

  return fullName ? PROTECTED_ROUTES.ONBOARDING : PUBLIC_ROUTES.COMPLETE_PROFILE;
}
