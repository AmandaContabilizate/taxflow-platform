import "server-only";

const BASE_IDENTITY = process.env.NEXT_PUBLIC_API_BASE_IDENTITY || process.env.API_BASE_IDENTITY || "https://localhost:7125/api";
const BASE_PROCEDURES = process.env.NEXT_PUBLIC_API_BASE_PROCEDURES || process.env.API_BASE_PROCEDURES || "https://localhost:7165/api";
const BASE_REPORTS = process.env.NEXT_PUBLIC_API_BASE_REPORTS || process.env.API_BASE_REPORTS || "https://localhost:7126/api";
const BASE_GEORGE = `${BASE_PROCEDURES}/george`;

const DbOrigin = "/SQLServer";

export const API_BASE_URLS = {
  default: BASE_IDENTITY,
  auth: `${BASE_IDENTITY}/auth${DbOrigin}`,
  users: `${BASE_IDENTITY}/users${DbOrigin}`,
  taxpayers: `${BASE_IDENTITY}/taxpayers${DbOrigin}`,
  catalogs: `${BASE_IDENTITY}/catalogs${DbOrigin}`,
  metadata: `${BASE_IDENTITY}/metadata${DbOrigin}`,
  roles: `${BASE_IDENTITY}/roles${DbOrigin}`,
  declaration: `${BASE_PROCEDURES}/declaration${DbOrigin}`,
  // Controller nuevo `api/declarations` (plural) de Procedures — endpoint
  // "reenviar declaración al cliente" (POST .../resend-to-client). Distinto de
  // `declaration` (singular, listados por contribuyente). OJO: NO lleva /SQLServer.
  declarations_procedures: `${BASE_PROCEDURES}/declarations`,
  // Reporte público de la declaración (enlace del correo, sin JWT).
  // OJO: NO lleva /SQLServer — el controlador expone la variante sin dbOrigin.
  declaration_report: `${BASE_PROCEDURES}/DeclarationReport`,
  vault: `${BASE_PROCEDURES}/vault${DbOrigin}`,
  cfdi: `${BASE_PROCEDURES}/cfdi${DbOrigin}`,
  catalogs_procedures: `${BASE_PROCEDURES}/catalogs${DbOrigin}`,
  finances: `${BASE_PROCEDURES}/finances${DbOrigin}`,
  accountant_assignments: `${BASE_PROCEDURES}/accountant-assignments`,
  stripe: `${BASE_PROCEDURES}/stripe`, // OJO: stripe NO lleva /SQLServer
  george: BASE_GEORGE,
  // Administración de partnerships externos (SSO). OJO: NO lleva /SQLServer.
  partnership: `${BASE_PROCEDURES}/partnership`,
  // Timbrame SSO. Incluye DbOrigin (/SQLServer).
  timbrame: `${BASE_PROCEDURES}/timbrame${DbOrigin}`,
  // Reports
  sales_procedures: `${BASE_PROCEDURES}/sales`,
  dashboard_reports: `${BASE_REPORTS}/dashboard${DbOrigin}`,
  declarations_reports: `${BASE_REPORTS}/declarations`,
  sales_reports: `${BASE_REPORTS}/sales`,
  taxpayers_reports: `${BASE_REPORTS}/taxpayers`,
  marketing: `${BASE_IDENTITY}/Marketing`,
  push_tokens: `${BASE_IDENTITY}/PushTokens`,
  users_reports: `${BASE_REPORTS}/users`,
  // Equipo comercial (módulo de comisiones). OJO: NO lleva /SQLServer.
  team: `${BASE_IDENTITY}/team`,
  // Catálogos comerciales del módulo de comisiones (Procedures). NO llevan /SQLServer.
  partners: `${BASE_PROCEDURES}/partners`,
  discount_codes: `${BASE_PROCEDURES}/discount-codes`,
  commissions: `${BASE_PROCEDURES}/commissions`,
  assignments: `${BASE_PROCEDURES}/assignments`,
  // Preferencias de notificación del usuario autenticado (autoservicio). Incluye DbOrigin.
  notification_prefs: `${BASE_PROCEDURES}/Notification${DbOrigin}`,
  user_notifications: `${BASE_PROCEDURES}/v1/user-notifications`,
} as const;

export type ApiType = keyof typeof API_BASE_URLS;

export function getBaseUrl(apiType: ApiType = "default"): string {
  const url = API_BASE_URLS[apiType];
  if (!url) {
    throw new Error(
      `[apiUrls] No hay URL base configurada para apiType="${apiType}".`,
    );
  }
  return url;
}

/**
 * Origen del alta (Catalogs.SystemsOrigin): 0 app movil, 1 Contabox, 4 Taxflow 2.
 * Este front es Taxflow 2; el back cae a 1 si no se manda, asi que hay que
 * enviarlo explicito en todo endpoint que cree usuario.
 */
const SYSTEM_ORIGIN_ID = Number(process.env.SYSTEM_ORIGIN_ID ?? 4);

export function getSystemOriginId(): number {
  return Number.isInteger(SYSTEM_ORIGIN_ID) ? SYSTEM_ORIGIN_ID : 4;
}

export function getExternalAuthUrl(provider: "google" | "facebook" | "apple"): string {
  return `${getBaseUrl("auth")}/${provider}/${getSystemOriginId()}`;
}

export { SYSTEM_ORIGIN_ID };
