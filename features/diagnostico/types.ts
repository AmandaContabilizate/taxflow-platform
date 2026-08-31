/**
 * Contratos del diagnóstico fiscal bajo demanda (Identity, apiType "diagnostico").
 * Doc: "Ejecutar diagnóstico bajo consumo" — cliente (rfc, 1 corrida/día) y
 * vendedor (taxpayerId, cooldown 6h). Los POST fallan con ProblemDetails cuyo
 * campo estable es `errorCode` (nunca parsear title/detail).
 */

/** GET puede-ejecutar (cliente o vendedor) — solo lectura, no dispara nada. */
export interface CanRunDiagnostico {
  /** Hay declaración "Por Revisar" o "No Presentada". false = al corriente. */
  tienePendientes: boolean;
  /** CIEC o e.Firma vigente. */
  credencialValida: boolean;
  /** Diagnóstico en curso (cualquier fuente). */
  yaCorriendo: boolean;
  /** AND de todo + throttle pasado — único campo necesario para habilitar el botón. */
  puedeEjecutar: boolean;
  /** ISO 8601: cuándo libera el throttle, si por eso puedeEjecutar=false. */
  proximaVentanaUtc: string | null;
}

/** POST de disparo: triggered=false significa "ya está al corriente". */
export interface RunDiagnosticoResult {
  triggered: boolean;
}

/** Declaración pendiente encontrada por el diagnóstico (GET vendedor/resultado). */
export interface DiagnosticoPendiente {
  declarationId: number;
  fiscalYear: number;
  periodValueId: number | null;
  /** Etiqueta lista para pintar: "Agosto 2026", "Anual 2025"… */
  periodo: string;
  regimen: string | null;
  /** 13 = Por Revisar (sembrada, sin confirmar) · 14 = No Presentada (adeudo confirmado). */
  estatusId: number;
  estatus: string;
}

export interface DiagnosticoResultado {
  porRevisar: number;
  noPresentadas: number;
  pendientes: DiagnosticoPendiente[];
}

/** Corrida del diagnóstico registrada en DiagnosticoRun (GET vendedor/historial). */
export interface DiagnosticoCorrida {
  id: number;
  startedAt: string;
  finishedAt: string | null;
  /** 1 = Cron · 2 = Cliente · 3 = Vendedor. */
  fuenteId: number;
  /** Etiqueta lista: "Automático" | "Cliente" | "Backoffice". */
  fuente: string;
  /** 1 = En curso · 2 = Completada · 3 = Abortada. */
  estatusId: number;
  estatus: string;
  /** Nombre/correo de quien la disparó; null en corridas automáticas. */
  disparadoPor: string | null;
}

export interface DiagnosticoHistorial {
  corridas: DiagnosticoCorrida[];
}

/** Códigos estables de los 400 del POST. */
export type DiagnosticoErrorCode =
  | "NO_VALID_CREDENTIAL"
  | "DIAGNOSTICO_THROTTLED"
  | "DIAGNOSTICO_ALREADY_RUNNING"
  | "TAXPAYER_NOT_FOUND";

export interface DiagnosticoError {
  statusCode: number;
  message: string;
  errorCode?: string;
}

/** Mensajes en español por errorCode (el título del ProblemDetails no se parsea). */
export function diagnosticoErrorMessage(errorCode: string | undefined, fallback: string): string {
  switch (errorCode) {
    case "NO_VALID_CREDENTIAL":
      return "El contribuyente no tiene CIEC ni e.Firma vigente.";
    case "DIAGNOSTICO_THROTTLED":
      return "Ya se corrió un diagnóstico hace poco — vuelve a intentarlo más tarde.";
    case "DIAGNOSTICO_ALREADY_RUNNING":
      return "Ya hay un diagnóstico en curso. Los resultados se reflejan en unos minutos.";
    case "TAXPAYER_NOT_FOUND":
      return "No encontramos al contribuyente.";
    default:
      return fallback;
  }
}
