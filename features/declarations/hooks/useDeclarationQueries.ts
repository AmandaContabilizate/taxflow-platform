'use client'

import { type QueryClient, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { canRunDeclarationDownload } from '@/features/declarations/actions/canRunDeclarationDownload.action'
import { getClassificationCategories } from '@/features/declarations/actions/getClassificationCategories.action'
import { getDeclarationPeriodInvoices } from '@/features/declarations/actions/getDeclarationPeriodInvoices.action'
import { getPeriodDownloadStatus } from '@/features/declarations/actions/getPeriodDownloadStatus.action'
import { getDeclarationCalculations } from '@/features/operations/actions/getDeclarationCalculations.action'
import { getDeclarationGeneral } from '@/features/operations/actions/getDeclarationGeneral.action'
import { getDeclarationInvoices } from '@/features/operations/actions/getDeclarationInvoices.action'
import { getDeclarationLogs } from '@/features/operations/actions/getDeclarationLogs.action'
import { getDeclarationReportLink } from '@/features/operations/actions/getDeclarationReportLink.action'
import { getDeclarationWithholdings } from '@/features/operations/actions/getDeclarationWithholdings.action'
import type { DeclarationInvoice, InvoiceTotales, PagedConTotales } from '@/features/operations/types'
import type { Result } from '@/lib/common'
import {
  DATA_SEGMENTS,
  type InvoiceFilterKey,
  type PeriodInvoicesKey,
  type WithholdingFilterKey,
  catalogKeys,
  declarationKeys,
} from './declarationQueryKeys'

/**
 * Las server actions devuelven `Result` y nunca lanzan. Para que la caché conserve
 * el último valor bueno cuando un refetch falla (como hacía el `useState` de antes:
 * `general` se quedaba y solo se guardaba el mensaje), el `queryFn` convierte el
 * `Result` fallido en una excepción tipada con el `code` del back.
 */
export class DeclarationQueryError extends Error {
  readonly statusCode: number
  readonly code?: string

  constructor(error: { statusCode: number; message: string; code?: string }) {
    super(error.message)
    this.name = 'DeclarationQueryError'
    this.statusCode = error.statusCode
    this.code = error.code
  }
}

export function unwrap<T>(res: Result<T, { statusCode: number; message: string; code?: string }>): T {
  if (res.success) return res.value
  throw new DeclarationQueryError(res.error)
}

// Todas las consultas del dashboard pasan por `unwrap`, así que `error` siempre es
// `DeclarationQueryError` (con `code`), no un `Error` genérico.
declare module '@tanstack/react-query' {
  interface Register {
    defaultError: DeclarationQueryError
  }
}

/** Datos de la declaración: se consideran frescos 5 min; antes de eso volver a una pestaña no pide nada. */
const DATA_STALE_MS = 5 * 60_000
/** El catálogo de clasificaciones es estático. */
const CATALOG_STALE_MS = 60 * 60_000
/** Estado de descargas: el ↻ del chip y encolar una descarga lo refrescan a mano. */
const DOWNLOAD_STALE_MS = 60_000

/* -------------------------------------------------------------------------- */
/*  Invalidación                                                              */
/* -------------------------------------------------------------------------- */

/**
 * El back escribió en la declaración (recálculo, reenvío —incluido el 400 de
 * `CALCULATION_CHANGED`, que ya movió el estatus y las cifras—, reapertura, acuse
 * subido): general, bitácora, cálculos y comprobantes dejan de valer. Las
 * consultas montadas se vuelven a pedir ya; las de pestañas cerradas, al volver.
 */
export function invalidateDeclarationData(queryClient: QueryClient, declarationId: number) {
  return queryClient.invalidateQueries({
    predicate: (q) => {
      const key = q.queryKey
      return key[0] === 'decl' && key[1] === declarationId && DATA_SEGMENTS.has(String(key[2]))
    },
  })
}

/* -------------------------------------------------------------------------- */
/*  Cabecera: /general + /logs                                                */
/* -------------------------------------------------------------------------- */

export function useDeclarationGeneral(declarationId: number, consulta: boolean) {
  return useQuery({
    queryKey: declarationKeys.general(declarationId, consulta),
    queryFn: async () => unwrap(await getDeclarationGeneral(declarationId, consulta)),
    staleTime: DATA_STALE_MS,
  })
}

export function useDeclarationLogs(declarationId: number, consulta: boolean) {
  return useQuery({
    queryKey: declarationKeys.logs(declarationId, consulta),
    queryFn: async () => unwrap(await getDeclarationLogs(declarationId, 0, 100, consulta)),
    staleTime: DATA_STALE_MS,
  })
}

const EMPTY_LOGS: never[] = []

/**
 * Lo que la cabecera del detalle necesita: `/general` y `/logs` en paralelo (antes
 * la bitácora esperaba a `/general`), más `refresh()` para cuando el back escribió.
 */
export function useDeclaration(declarationId: number, consulta: boolean) {
  const queryClient = useQueryClient()
  const generalQ = useDeclarationGeneral(declarationId, consulta)
  const logsQ = useDeclarationLogs(declarationId, consulta)

  const refresh = useCallback(
    () => invalidateDeclarationData(queryClient, declarationId),
    [queryClient, declarationId],
  )

  return {
    general: generalQ.data ?? null,
    generalError: generalQ.error?.message ?? null,
    logs: logsQ.data ?? EMPTY_LOGS,
    // `isFetching` y no `isPending`: el Historial muestra "Cargando historial…" también
    // durante el refresco, igual que con el `logsLoading` anterior.
    logsLoading: logsQ.isFetching,
    refresh,
  }
}

/* -------------------------------------------------------------------------- */
/*  Cálculos                                                                  */
/* -------------------------------------------------------------------------- */

/** Compartida por Cálculos, Clasificación y Reporte Cliente: una sola llamada por declaración. */
export function useDeclarationCalculations(declarationId: number, consulta: boolean) {
  return useQuery({
    queryKey: declarationKeys.calculations(declarationId, consulta),
    queryFn: async () => unwrap(await getDeclarationCalculations(declarationId, consulta)),
    staleTime: DATA_STALE_MS,
  })
}

/* -------------------------------------------------------------------------- */
/*  Comprobantes                                                              */
/* -------------------------------------------------------------------------- */

const TAKE = 100
/**
 * Las páginas viven más que el default (5 min): si la página 1 se recolectara mientras
 * el contador lee la 2, sus totales dejarían de estar en caché y la clave de la 2
 * cambiaría a "con totales", disparando una llamada de más.
 */
const PAGE_GC_MS = 30 * 60_000

/**
 * Totales del periodo que ya llegaron para este conjunto de filtros, buscando en
 * cualquier página cacheada. Si existen, las páginas siguientes se piden con
 * `includeTotals=false` y la franja sigue usando estos.
 */
export function findCachedTotales(queryClient: QueryClient, prefix: readonly unknown[]): InvoiceTotales | undefined {
  for (const q of queryClient.getQueryCache().findAll({ queryKey: prefix })) {
    // Una página invalidada (el back escribió) no vale como fuente de totales: la
    // siguiente página se pide con totales hasta que alguna llegue fresca.
    if (q.state.isInvalidated) continue
    const data = q.state.data as PagedConTotales<DeclarationInvoice> | undefined
    if (data?.totales) return data.totales
  }
  return undefined
}

export function useDeclarationInvoices(
  declarationId: number,
  consulta: boolean,
  filters: InvoiceFilterKey,
  skip: number,
) {
  const queryClient = useQueryClient()
  const cachedTotales = findCachedTotales(queryClient, declarationKeys.invoicesFilters(declarationId, consulta, filters))
  // Solo se omiten los totales en páginas siguientes Y cuando ya están en caché para
  // este filtro; en cualquier otro caso el parámetro no viaja (= true en el back).
  const includeTotals = !(skip > 0 && cachedTotales != null)

  const query = useQuery({
    queryKey: declarationKeys.invoices(declarationId, consulta, filters, skip, includeTotals),
    queryFn: async () =>
      unwrap(
        await getDeclarationInvoices({
          declarationId,
          isIssued: filters.isIssued ?? undefined,
          invoiceTypeId: filters.invoiceTypeId ?? undefined,
          clasificada: filters.clasificada ?? undefined,
          sortBy: filters.sortBy,
          sortDir: filters.sortDir,
          skip,
          take: TAKE,
          esRetencion: false,
          consulta,
          includeTotals: includeTotals ? undefined : false,
        }),
      ),
    staleTime: DATA_STALE_MS,
    gcTime: PAGE_GC_MS,
  })

  return { query, cachedTotales }
}

export function useDeclarationWithholdings(
  declarationId: number,
  consulta: boolean,
  filters: WithholdingFilterKey,
  skip: number,
) {
  const queryClient = useQueryClient()
  const cachedTotales = findCachedTotales(
    queryClient,
    declarationKeys.withholdingsFilters(declarationId, consulta, filters),
  )
  const includeTotals = !(skip > 0 && cachedTotales != null)

  const query = useQuery({
    queryKey: declarationKeys.withholdings(declarationId, consulta, filters, skip, includeTotals),
    queryFn: async () =>
      unwrap(
        await getDeclarationWithholdings({
          declarationId,
          isIssued: filters.isIssued ?? undefined,
          clasificada: filters.clasificada ?? undefined,
          sortBy: filters.sortBy,
          sortDir: filters.sortDir,
          skip,
          take: TAKE,
          consulta,
          includeTotals: includeTotals ? undefined : false,
        }),
      ),
    staleTime: DATA_STALE_MS,
    gcTime: PAGE_GC_MS,
  })

  return { query, cachedTotales }
}

/**
 * Conteo "N CFDIs en el periodo": el universo combinado (`take=1`, sin
 * `esRetencion`). Solo usa `total`, así que va sin totales. Clasificación y Reporte
 * Cliente comparten la entrada.
 */
export function useDeclarationInvoiceCount(declarationId: number, consulta: boolean) {
  return useQuery({
    queryKey: declarationKeys.invoiceCount(declarationId, consulta),
    queryFn: async () =>
      unwrap(await getDeclarationInvoices({ declarationId, skip: 0, take: 1, consulta, includeTotals: false })).total,
    staleTime: DATA_STALE_MS,
  })
}

/* -------------------------------------------------------------------------- */
/*  Recálculo                                                                 */
/* -------------------------------------------------------------------------- */

const EMPTY_INPUT: PeriodInvoicesKey = { rfc: '', year: 0, beginMonth: 0, endMonth: 0, idRegime: 0 }

/** Universo completo del periodo (Procedures). `input` null = todavía no hay con qué pedirlo. */
export function useDeclarationPeriodInvoices(declarationId: number, input: PeriodInvoicesKey | null) {
  return useQuery({
    queryKey: declarationKeys.periodInvoices(declarationId, input ?? EMPTY_INPUT),
    queryFn: async () => unwrap(await getDeclarationPeriodInvoices(input!)),
    enabled: input != null,
    staleTime: DATA_STALE_MS,
  })
}

export function useClassificationCategories(enabled: boolean) {
  return useQuery({
    queryKey: catalogKeys.classifications,
    queryFn: async () => unwrap(await getClassificationCategories()),
    enabled,
    staleTime: CATALOG_STALE_MS,
    gcTime: CATALOG_STALE_MS,
  })
}

/* -------------------------------------------------------------------------- */
/*  Envío: enlace del reporte                                                 */
/* -------------------------------------------------------------------------- */

/** El token es determinista: se pide una vez por declaración. */
export function useDeclarationReportLink(declarationId: number, enabled: boolean) {
  return useQuery({
    queryKey: declarationKeys.reportLink(declarationId),
    queryFn: async () => unwrap(await getDeclarationReportLink(declarationId)),
    enabled,
    staleTime: Infinity,
  })
}

/* -------------------------------------------------------------------------- */
/*  Descargas SAT                                                             */
/* -------------------------------------------------------------------------- */

export function useDownloadCanRun(declarationId: number, enabled: boolean) {
  return useQuery({
    queryKey: declarationKeys.downloadCanRun(declarationId),
    queryFn: async () => unwrap(await canRunDeclarationDownload(declarationId)),
    enabled,
    staleTime: DOWNLOAD_STALE_MS,
  })
}

export function useDownloadStatus(declarationId: number, enabled: boolean) {
  return useQuery({
    queryKey: declarationKeys.downloadStatus(declarationId),
    queryFn: async () => unwrap(await getPeriodDownloadStatus(declarationId)),
    enabled,
    staleTime: DOWNLOAD_STALE_MS,
  })
}

/** Para que el botón avise al chip sin pasar por un `refreshKey` del padre. */
export function useInvalidateDownloadStatus(declarationId: number) {
  const queryClient = useQueryClient()
  return useMemo(
    () => () => void queryClient.invalidateQueries({ queryKey: declarationKeys.downloadStatus(declarationId) }),
    [queryClient, declarationId],
  )
}
