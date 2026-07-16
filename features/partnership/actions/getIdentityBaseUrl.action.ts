"use server";

/**
 * Devuelve la URL base del microservicio Identity (server-only vía
 * API_BASE_IDENTITY, sin prefijo NEXT_PUBLIC_) — se resuelve en request time
 * para que el mismo build sirva STG/Producción sin rebuild, a diferencia de
 * leerla directo con NEXT_PUBLIC_ en un client component (se hornea en build
 * time). Solo se usa para mostrarla en los ejemplos de integración SSO, no
 * es un valor secreto.
 */
export async function getIdentityBaseUrl(): Promise<string> {
  return process.env.API_BASE_IDENTITY || "https://localhost:7125/api";
}
