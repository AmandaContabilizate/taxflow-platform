/**
 * Mapa de bases URL por microservicio del backend ContaboxPro core2.
 *
 * Microservicios (puertos por defecto en dev):
 *   - Identity   → 7125  (auth, users, taxpayers, employees, roles)
 *   - Procedures → 7165  (declaration, vault, cfdi, ...)
 *   - Reports    → 7126  (dashboards)
 *   - Scrappers  → 7042  (SAT scrappers)
 *
 * Configurables en .env.local con NEXT_PUBLIC_API_*.
 */

const BASE_IDENTITY = process.env.NEXT_PUBLIC_API_BASE_IDENTITY || "https://localhost:7125/api";
const BASE_PROCEDURES = process.env.NEXT_PUBLIC_API_BASE_PROCEDURES || "https://localhost:7165/api";
const BASE_REPORTS = process.env.NEXT_PUBLIC_API_BASE_REPORTS || "https://localhost:7126/api";
const BASE_SCRAPPERS = process.env.NEXT_PUBLIC_API_BASE_SCRAPPERS || "https://localhost:7042/api";
const DbOrigin = "/SQLServer";

export const API_BASE_URLS = {
  default: BASE_IDENTITY,
  // Identity
  auth: `${BASE_IDENTITY}/auth${DbOrigin}`,
  users: `${BASE_IDENTITY}/users${DbOrigin}`,
  taxpayers: `${BASE_IDENTITY}/taxpayers${DbOrigin}`,
  catalogs: `${BASE_IDENTITY}/catalogs${DbOrigin}`,
  metadata: `${BASE_IDENTITY}/metadata${DbOrigin}`,
  roles: `${BASE_IDENTITY}/roles${DbOrigin}`,
  // Procedures
  declaration: `${BASE_PROCEDURES}/declaration${DbOrigin}`,
  vault: `${BASE_PROCEDURES}/vault${DbOrigin}`,
  cfdi: `${BASE_PROCEDURES}/cfdi${DbOrigin}`,
  // Reports
  dashboard_reports: `${BASE_REPORTS}/dashboard/3`,
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
