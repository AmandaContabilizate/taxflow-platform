/**
 * Configuración general de la API.
 * URLs por defecto apuntan al backend ContaboxPro core2 en local (HTTPS dev).
 * Sobrescribe en .env.local.
 */
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL ?? "https://localhost:7125",
  AUTH_COOKIE_NAME:
    process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME ?? ".AspNetCore.Cookies",
} as const;
