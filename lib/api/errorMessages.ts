import ErrorCatalog from "./errorCatalog.json";

type Lang = "es" | "en";

const CATALOG = ErrorCatalog as Record<string, Partial<Record<Lang, string>>>;

/**
 * Traduce un `errorCode` del backend (ContaboxPro core2, `extensions.errorCode`
 * en las respuestas `ProblemDetails`) a un mensaje legible, usando
 * `errorCatalog.json`. Mismo catálogo que `contaboxpro-frontend-next` — al
 * agregar códigos nuevos, mantenerlos sincronizados entre ambos repos.
 */
export function getErrorMessage(errorCode: string | undefined | null, lang: Lang = "es"): string {
  const defaultMessages: Record<Lang, string> = {
    es: "Error desconocido",
    en: "Unknown error",
  };

  if (!errorCode) return defaultMessages[lang];

  const entry = CATALOG[errorCode];
  if (!entry) return defaultMessages[lang];

  return entry[lang] ?? entry.es ?? defaultMessages[lang];
}

/** true si `errorCode` tiene una entrada catalogada (para decidir si vale la pena usarlo). */
export function hasErrorCode(errorCode: string | undefined | null): boolean {
  return Boolean(errorCode && CATALOG[errorCode]);
}
