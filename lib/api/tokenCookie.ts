/**
 * La cookie de sesión (JWT) puede rebasar el límite del navegador (4,096 bytes
 * por cookie, nombre incluido): el token crece con cada permiso del rol y el de
 * Administrador ya lo rebasó. Se guarda troceada — `auth_token` lleva el primer
 * tramo (el middleware solo verifica su presencia) y `auth_token_1..n` el resto.
 */

const CHUNK_SIZE = 3200;
/** Tope defensivo de tramos a leer/limpiar (3200 × 8 = 25 KB de token). */
export const MAX_TOKEN_CHUNKS = 8;

export function splitAuthToken(token: string): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < token.length; i += CHUNK_SIZE) {
    chunks.push(token.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
}

/** Reconstruye el token desde las cookies; `read` abstrae el cookie store. */
export function readAuthToken(read: (name: string) => string | undefined): string | undefined {
  const base = read("auth_token");
  if (!base) return undefined;
  let token = base;
  for (let i = 1; i < MAX_TOKEN_CHUNKS; i++) {
    const chunk = read(`auth_token_${i}`);
    if (!chunk) break;
    token += chunk;
  }
  return token;
}
