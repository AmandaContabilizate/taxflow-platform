/**
 * Claves de caché (TanStack Query) del detalle de declaración del contador.
 *
 * Todas cuelgan de `['decl', declarationId]` y llevan `consulta` cuando la server
 * action tiene ruta espejo `/consulta/*`: el perfil SAC y el contador no deben
 * compartir una entrada de caché aunque pidan la misma declaración.
 *
 * `DATA_SEGMENTS` son las que cambian cuando el back escribe (recálculo, reenvío,
 * reapertura, acuse subido) y se invalidan juntas con `invalidateDeclarationData`.
 * Las demás (`report-link`, descargas, catálogo) tienen su propio ciclo.
 */

/**
 * Filtros sin paginación de `/invoices`. Todos los campos van SIEMPRE presentes
 * (`null` = sin filtro, no `undefined`): TanStack compara los objetos de la clave
 * por coincidencia parcial, y un prefijo al que le faltara `isIssued` casaría con
 * las páginas de `isIssued: true`; con la forma fija el match es exacto.
 */
export interface InvoiceFilterKey {
  isIssued: boolean | null
  invoiceTypeId: number | null
  clasificada: boolean | null
  sortBy: 'invoiceDate' | 'total'
  sortDir: 'asc' | 'desc'
}

/** Igual que `InvoiceFilterKey`, sin `invoiceTypeId` (las constancias no tienen tipo). */
export interface WithholdingFilterKey {
  isIssued: boolean | null
  clasificada: boolean | null
  sortBy: 'invoiceDate' | 'total'
  sortDir: 'asc' | 'desc'
}

export interface PeriodInvoicesKey {
  rfc: string
  year: number
  beginMonth: number
  endMonth: number
  idRegime: number
}

export const declarationKeys = {
  all: (id: number) => ['decl', id] as const,
  general: (id: number, consulta: boolean) => ['decl', id, 'general', consulta] as const,
  logs: (id: number, consulta: boolean) => ['decl', id, 'logs', consulta] as const,
  calculations: (id: number, consulta: boolean) => ['decl', id, 'calculations', consulta] as const,
  /** Prefijo de todas las páginas de un mismo conjunto de filtros (sin paginación). */
  invoicesFilters: (id: number, consulta: boolean, filters: InvoiceFilterKey) =>
    ['decl', id, 'invoices', consulta, filters] as const,
  invoices: (id: number, consulta: boolean, filters: InvoiceFilterKey, skip: number, includeTotals: boolean) =>
    ['decl', id, 'invoices', consulta, filters, { skip, includeTotals }] as const,
  withholdingsFilters: (id: number, consulta: boolean, filters: WithholdingFilterKey) =>
    ['decl', id, 'withholdings', consulta, filters] as const,
  withholdings: (
    id: number,
    consulta: boolean,
    filters: WithholdingFilterKey,
    skip: number,
    includeTotals: boolean,
  ) => ['decl', id, 'withholdings', consulta, filters, { skip, includeTotals }] as const,
  /** `take=1` sin `esRetencion`: el universo combinado, solo para el conteo "N CFDIs en el periodo". */
  invoiceCount: (id: number, consulta: boolean) => ['decl', id, 'invoice-count', consulta] as const,
  periodInvoices: (id: number, input: PeriodInvoicesKey) => ['decl', id, 'period-invoices', input] as const,
  reportLink: (id: number) => ['decl', id, 'report-link'] as const,
  downloadCanRun: (id: number) => ['decl', id, 'download-can-run'] as const,
  downloadStatus: (id: number) => ['decl', id, 'download-status'] as const,
  /** 612: activos del contribuyente vistos desde esta declaración. El recálculo crea sugerencias. */
  fixedAssets: (id: number, rfc: string) => ['decl', id, 'fixed-assets', rfc] as const,
  /** 612: saldos a favor de IVA. El recálculo registra aplicaciones y el saldo generado. */
  ivaFavorBalances: (id: number, rfc: string) => ['decl', id, 'iva-favor', rfc] as const,
}

export const catalogKeys = {
  classifications: ['catalog', 'classifications'] as const,
  fixedAssetTypes: ['catalog', 'fixed-asset-types'] as const,
}

/** Segmentos que se invalidan cuando el back escribió en la declaración. */
export const DATA_SEGMENTS: ReadonlySet<string> = new Set([
  'general',
  'logs',
  'calculations',
  'invoices',
  'withholdings',
  'invoice-count',
  'period-invoices',
  'fixed-assets',
  'iva-favor',
])
