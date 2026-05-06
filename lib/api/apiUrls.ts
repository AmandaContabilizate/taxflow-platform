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

const BASE_IDENTITY   = process.env.NEXT_PUBLIC_API_BASE_IDENTITY   || "https://localhost:7125";
const BASE_PROCEDURES = process.env.NEXT_PUBLIC_API_BASE_PROCEDURES || "https://localhost:7165";
const BASE_REPORTS    = process.env.NEXT_PUBLIC_API_BASE_REPORTS    || "https://localhost:7126";
const BASE_SCRAPPERS  = process.env.NEXT_PUBLIC_API_BASE_SCRAPPERS  || "https://localhost:7042";

export const API_BASE_URLS = {
  default:   BASE_IDENTITY,
  // Identity
  auth:      `${BASE_IDENTITY}/api/auth`,
  users:     `${BASE_IDENTITY}/api/users`,
  taxpayers: `${BASE_IDENTITY}/api/taxpayers`,
  catalogs:  `${BASE_IDENTITY}/api/catalogs`,
  metadata:  `${BASE_IDENTITY}/api/metadata`,
  roles:     `${BASE_IDENTITY}/api/roles`,
  // Procedures
  declaration: `${BASE_PROCEDURES}/api/declaration`,
  vault:       `${BASE_PROCEDURES}/api/vault`,
  cfdi:        `${BASE_PROCEDURES}/api/cfdi`,
  procedures:  BASE_PROCEDURES,
  // Reports
  reports:   BASE_REPORTS,
  // Scrappers
  scrappers: BASE_SCRAPPERS,
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
