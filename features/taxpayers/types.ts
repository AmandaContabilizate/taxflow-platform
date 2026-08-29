/**
 * Padrón de contribuyentes / clientes (microservicio Reports).
 * - `/taxpayers`            → todos los contribuyentes.
 * - `/taxpayers/with-paid-sales` → contribuyentes con ventas pagadas (clientes),
 *   con conteos de compras y los planes contratados.
 */

/** Respuesta paginada del backend (skip/take/total). */
export interface Paged<T> {
  items: T[];
  total: number;
  skip: number;
  take: number;
}

export interface TaxpayerRegimen {
  id: number;
  satCode: string;
  name: string;
}

/** Item de `/taxpayers`. */
export interface TaxpayerListItem {
  taxpayerId: number;
  rfc: string;
  legalName: string;
  email: string;
  phone?: string | null;
  regimenes: TaxpayerRegimen[];
  /** Ventas pagadas (StatusSaleId=2 con referencia de Stripe). */
  ventasPagadas: number;
}

/**
 * Item de `/taxpayers/with-paid-sales` y `/taxpayers/my-clients` —
 * contribuyente + datos de compra + contador asignado.
 */
/** Producto (venta pagada) dentro del expediente del cliente. */
export interface ExpedienteProducto {
  plan: string
  monto: number
  fecha: string
  regularizaciones: number
  futuras: number
}

/** Periodo (declaración) del expediente con su estatus agrupado. */
export interface ExpedientePeriodo {
  fiscalYear: number
  periodValueId: number
  estatus: string
  presentada: boolean
}

/**
 * Expediente del cliente (`/taxpayers/{id}/expediente`, gerencia comercial):
 * resumen + equipo + productos + periodos. Las credenciales van aparte
 * (endpoints de Identity con sus propios claims).
 */
export interface ExpedienteCliente {
  taxpayerId: number
  rfc: string
  legalName: string
  email: string | null
  phone: string | null
  createdAt: string
  /** 1 = CIEC válida, 2 = inválida, 0 = sin verificar. */
  passwordState: number
  regimenes: { id: number; satCode: string | null; name: string }[]
  contadorUserId: string | null
  contadorNombre: string | null
  contadorEmail: string | null
  vendedorNombre: string | null
  vendedorEmail: string | null
  ventasPagadas: number
  productos: ExpedienteProducto[]
  periodos: ExpedientePeriodo[]
  /** Últimas validaciones de la CIEC (estado/fecha/fuente; nunca la contraseña). */
  ciecHistorial: CiecValidacion[]
  /** e.firmas registradas con su vigencia de certificado. */
  efirmas: Efirma[]
}

export interface CiecValidacion {
  fecha: string
  valida: boolean
  estatus: string
  fuente: string
}

export interface Efirma {
  isActive: boolean
  notBefore: string
  noAfter: string
}

/** Credenciales SAT bajo demanda (Identity `/sat-password`). */
export interface SatCredentials {
  satPassword: string
  tieneEfirma: boolean
}

/**
 * Respuesta cruda de Identity `/sat-password` (policy `Contador.GetSatPassword`).
 * Trae la CIEC en claro: no la persistas, no la loguees y bórrala del estado en
 * cuanto deje de estar visible.
 */
export interface SatPassword {
  satPassword: string
  publicId: string
  rfc: string
  tieneEfirma: boolean
}

export interface ClientListItem extends TaxpayerListItem {
  declaracionesCompradas: number;
  regularizacionesCompradas: number;
  futurasCompradas: number;
  planes: string[];
  /** Contador asignado (null si aún no tiene). */
  accountantUserId: string | null;
  accountantName: string | null;
  accountantEmail: string | null;
  fechaPrimeraVenta?: string | null;
}

/**
 * Celda de la matriz régimen × actividad de un contribuyente (última CSF leída).
 * `taxPayerTaxRegimeActivityId` es null si ese par nunca se ha vinculado.
 */
export interface RegimeActivityMatrixItem {
  regimeId: number;
  regimeName: string;
  activityId: number;
  activityDescription: string;
  taxPayerTaxRegimeActivityId: number | null;
  isActive: boolean;
}
