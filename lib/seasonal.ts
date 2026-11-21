// Ventana de la decoración de temporada. SOLO servidor: lee App Settings (sin NEXT_PUBLIC_),
// así se prende/apaga/extiende en Azure sin rebuild (solo reinicio).
//
//   SEASONAL_THEME        auto (default: usa la ventana) | on (forzar, QA) | off (kill switch)
//   SEASONAL_THEME_START  MM-DD, default 12-01
//   SEASONAL_THEME_END    MM-DD inclusivo, default 01-06 (END < START ⇒ cruza de año)
//
// "Hoy" es la fecha de Ciudad de México, no la UTC del servidor.
// Easter egg: ?h=December (o diciembre) la activa fuera de temporada, salvo con off.

export type Season = "christmas";

const DEFAULT_START = "12-01";
const DEFAULT_END = "01-06";
const TIME_ZONE = "America/Mexico_City";

/** MM-DD → número comparable MMDD (1201, 106…). null si no es una fecha de calendario válida. */
export function parseMonthDay(value: string | undefined): number | null {
  if (!value) return null;
  const m = /^(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  // Año bisiesto de referencia (2024) para aceptar 02-29.
  const daysInMonth = new Date(Date.UTC(2024, month, 0)).getUTCDate();
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth) return null;
  return month * 100 + day;
}

function readMonthDay(name: string, fallback: string): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return parseMonthDay(fallback)!;
  const parsed = parseMonthDay(raw);
  if (parsed === null) {
    console.warn(`[seasonal] ${name}="${raw}" no es MM-DD válido; se usa ${fallback}.`);
    return parseMonthDay(fallback)!;
  }
  return parsed;
}

/** MMDD de "hoy" en Ciudad de México. */
export function todayMonthDayInMexico(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  return month * 100 + day;
}

/** ¿Cae `today` (MMDD) dentro de [start, end] inclusivo? Soporta ventanas que cruzan de año. */
export function isWithinWindow(today: number, start: number, end: number): boolean {
  return start <= end ? today >= start && today <= end : today >= start || today <= end;
}

/** ¿El valor de `?h=` es el easter egg? */
export function isSeasonalEasterEgg(h: string | string[] | undefined): boolean {
  const v = (Array.isArray(h) ? h[0] : h)?.trim().toLowerCase();
  return v === "december" || v === "diciembre";
}

export interface ActiveSeason {
  season: Season | null;
  /** true cuando la temporada solo está activa por el easter egg: nada se persiste. */
  easterEgg: boolean;
  /** false con SEASONAL_THEME=off: el kill switch apaga también el egg guardado en la sesión. */
  eggAllowed: boolean;
}

/** Lo que el servidor le pasa a SeasonalProvider. */
export interface SeasonalInit extends ActiveSeason {
  /** Preferencia del backend; null = desconocida (login, o el GET falló). */
  enabled: boolean | null;
}

export function getActiveSeason(opts: { easterEgg?: boolean; now?: Date } = {}): ActiveSeason {
  const mode = (process.env.SEASONAL_THEME ?? "auto").trim().toLowerCase();
  if (mode === "off") return { season: null, easterEgg: false, eggAllowed: false };
  if (mode === "on") return { season: "christmas", easterEgg: false, eggAllowed: true };
  if (mode !== "auto") {
    console.warn(`[seasonal] SEASONAL_THEME="${mode}" no reconocido (auto|on|off); se usa auto.`);
  }

  const start = readMonthDay("SEASONAL_THEME_START", DEFAULT_START);
  const end = readMonthDay("SEASONAL_THEME_END", DEFAULT_END);
  if (isWithinWindow(todayMonthDayInMexico(opts.now), start, end)) {
    return { season: "christmas", easterEgg: false, eggAllowed: true };
  }
  if (opts.easterEgg) return { season: "christmas", easterEgg: true, eggAllowed: true };
  return { season: null, easterEgg: false, eggAllowed: true };
}
