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
  /** Id de la partida (SaleItem): enlaza el producto con los periodos que cubre. */
  saleItemId: number
  /** Id de la venta padre (SaleId). */
  saleId?: number
  plan: string
  monto: number
  fecha: string
  regularizaciones: number
  futuras: number
  /** Régimen de la venta, derivado de sus declaraciones (confiable en migrados). */
  regimenSatCode?: string | null
  regimenName?: string | null
  /** Código de promoción / descuento aplicado en la compra (null si no hubo). */
  discountCode?: string | null
  discountPercent?: number | null
  discountAmount?: number | null
  discountTypeId?: number | null
  declarationsCount?: number | null
}

/**
 * Venta ABIERTA (pendiente de cobro). Con liga del vendedor: LigaVigente · LigaVencida;
 * PendienteApp = checkout que el cliente dejó a medias en la app (sin liga del backoffice).
 */
export interface ExpedienteVentaAbierta {
  saleId: number
  fecha: string
  monto: number
  planes: string[]
  estado: 'LigaVigente' | 'LigaVencida' | 'PendienteApp'
  emitidaPorNombre: string | null
  emitidaPorEmail: string | null
  ligaVenceAt: string | null
}

/** Periodo (declaración) del expediente con su estatus agrupado. */
export interface ExpedientePeriodo {
  /** Id de la declaración: abre su reporte de predeclaración. */
  declarationId: number
  fiscalYear: number
  periodValueId: number
  estatus: string
  presentada: boolean
  taxRegimeId?: number | null
  taxRegimeSatCode?: string | null
  taxRegimeName?: string | null
  /** Ventas (SaleItem) que cubren este periodo: enlaza con "Productos comprados". */
  saleItemIds: number[]
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
  /** Ventas pendientes de cobro (ligas del vendedor y checkouts a medias). */
  ventasAbiertas: ExpedienteVentaAbierta[]
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
  ciecState?: number
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
  /** Ya no aparece en la CSF vigente y no tiene vínculos activos: solo referencia, no se reasigna. */
  isHistorical: boolean;
  /** Cuándo una lectura de la CSF la dio de baja (ISO); null si se desconoce. */
  historicalSince: string | null;
}

/** Actividad asignada a un régimen dado de baja. */
export interface InactiveRegimeActivityItem {
  activityId: number;
  description: string;
  /** false = el catálogo de actividades por régimen no la permite para este régimen. */
  allowedByRegime: boolean;
  /** true = la asignó el historial de IDC en automático. */
  autoAssigned: boolean;
}

/** Actividad del historial de IDC que coincide en fechas con el régimen y aún no está asignada. */
export interface SuggestedHistoricalActivity {
  activityId: number;
  description: string;
  startDate: string;
  endDate: string | null;
  allowedByRegime: boolean;
}

/** Régimen dado de baja (con fecha de baja). Se identifica por la liga, no por el régimen de catálogo. */
export interface InactiveRegimeActivities {
  taxPayerTaxRegimeId: number;
  regimeId: number;
  regimeName: string;
  startDate: string | null;
  endDate: string;
  activities: InactiveRegimeActivityItem[];
  suggested: SuggestedHistoricalActivity[];
  /** Actividades que el catálogo de actividades por régimen permite para este régimen. */
  allowedActivityIds: number[];
}

export interface ActivityCatalogItem {
  id: number;
  description: string;
}

export interface InactiveRegimeActivitiesResponse {
  regimes: InactiveRegimeActivities[];
  catalog: ActivityCatalogItem[];
}

/** Contribuyente con actividades pendientes de asignar (bandeja del Gerente de Operaciones). */
export interface PendingActivityAssignment {
  taxpayerId: number;
  rfc: string;
  legalName: string;
  regimesWithoutActivities: number;
  unassignedPdfActivities: number;
  unassignedIdcActivities: number;
}

/** 0 todos, 1 regímenes sin actividades, 2 actividades de la CSF sin asignar, 3 actividades de IDC sin asignar. */
export type PendingActivityKind = 0 | 1 | 2 | 3;
