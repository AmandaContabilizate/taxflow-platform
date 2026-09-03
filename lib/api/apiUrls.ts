import "server-only";

const BASE_IDENTITY = process.env.API_BASE_IDENTITY || "https://localhost:7125/api";
const BASE_PROCEDURES = process.env.API_BASE_PROCEDURES || "https://localhost:7165/api";
const BASE_REPORTS = process.env.API_BASE_REPORTS || "https://localhost:7126/api";
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
  declarations_procedures: `${BASE_PROCEDURES}/declarations`,
  declaration_report: `${BASE_PROCEDURES}/DeclarationReport`,
  vault: `${BASE_PROCEDURES}/vault${DbOrigin}`,
  cfdi: `${BASE_PROCEDURES}/cfdi${DbOrigin}`,
  catalogs_procedures: `${BASE_PROCEDURES}/catalogs${DbOrigin}`,
  finances: `${BASE_PROCEDURES}/finances${DbOrigin}`,
  accountant_assignments: `${BASE_PROCEDURES}/accountant-assignments`,
  stripe: `${BASE_PROCEDURES}/stripe`,
  payment_link: `${BASE_PROCEDURES}/payment-link`,
  george: BASE_GEORGE,
  partnership: `${BASE_PROCEDURES}/partnership`,
  timbrame: `${BASE_PROCEDURES}/timbrame${DbOrigin}`,
  // Reports
  sales_procedures: `${BASE_PROCEDURES}/sales`,
  dashboard_reports: `${BASE_REPORTS}/dashboard${DbOrigin}`,
  declarations_reports: `${BASE_REPORTS}/declarations`,
  sales_reports: `${BASE_REPORTS}/sales`,
  taxpayers_reports: `${BASE_REPORTS}/taxpayers`,
  // Diagnóstico fiscal bajo demanda (Identity). OJO: NO lleva /SQLServer.
  diagnostico: `${BASE_IDENTITY}/diagnostico`,
  marketing: `${BASE_IDENTITY}/Marketing`,
  push_tokens: `${BASE_IDENTITY}/PushTokens`,
  users_reports: `${BASE_REPORTS}/users`,
  team: `${BASE_IDENTITY}/team`,
  partners: `${BASE_PROCEDURES}/partners`,
  discount_codes: `${BASE_PROCEDURES}/discount-codes`,
  commissions: `${BASE_PROCEDURES}/commissions`,
  assignments: `${BASE_PROCEDURES}/assignments`,
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

const SYSTEM_ORIGIN_ID = Number(process.env.SYSTEM_ORIGIN_ID ?? 4);

export function getSystemOriginId(): number {
  return Number.isInteger(SYSTEM_ORIGIN_ID) ? SYSTEM_ORIGIN_ID : 4;
}

export function getExternalAuthUrl(provider: "google" | "facebook" | "apple"): string {
  return `${getBaseUrl("auth")}/${provider}/${getSystemOriginId()}`;
}

export { SYSTEM_ORIGIN_ID };
