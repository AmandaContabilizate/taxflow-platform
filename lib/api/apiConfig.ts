import "server-only";

/**
 * Configuración general de la API.
 * URLs por defecto apuntan al backend ContaboxPro core2 en local (HTTPS dev).
 * Sobrescribe en .env.local. Sin prefijo NEXT_PUBLIC_ — server-only.
 */
export const API_CONFIG = {
  BASE_URL: process.env.API_URL ?? "https://localhost:7125",
  AUTH_COOKIE_NAME:
    process.env.AUTH_COOKIE_NAME ?? ".AspNetCore.Cookies",
} as const;
