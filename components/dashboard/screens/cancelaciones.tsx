'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  useCancellationDeclarations,
  useCancellationHistory,
  useCancellationTaxpayerSearch,
  useInvalidateCancellationTaxpayer,
} from '@/features/cancellations/hooks/useCancellationQueries'
import type { CancellationDeclaration, CancellationTaxpayer } from '@/features/cancellations/types'
import { CancelDeclarationsModal } from '../cancelaciones/cancel-declarations-modal'
import { CancelTaxpayerModal } from '../cancelaciones/cancel-taxpayer-modal'
import { type DeclarationFilters, DeclarationsTable } from '../cancelaciones/declarations-table'
import { HistoryTab } from '../cancelaciones/history-tab'
import { CANCEL_DECLARATIONS_CLAIM, CANCEL_TAXPAYER_CLAIM, REACTIVATE_CLAIM } from '../cancelaciones/parts'
import { ReactivateModal, type ReactivateTarget } from '../cancelaciones/reactivate-modal'
import { TaxpayerHeader } from '../cancelaciones/taxpayer-header'
import { TaxpayerSearch } from '../cancelaciones/taxpayer-search'
import { useHasPermission } from '../permissions'
import { Card, NoAccessState, Tabs } from '../ui'
import { numParam, useUrlState } from '../url-state'

const TABS = ['Declaraciones', 'Historial']

/**
 * VENTAS → Cancelaciones (gerencia comercial): baja lógica de declaraciones sueltas y de clientes,
 * con historial y reactivación. Estado navegable en la URL: `q`/`skip` (búsqueda), `tp` + `rfc`
 * (contribuyente abierto; el RFC permite rehidratar la ficha al entrar por link directo),
 * `tab`, y los filtros de la tabla (`regimen`, `year`, `estatus`, `cancelables`).
 */
export function CancelacionesScreen() {
  const { params, setParams } = useUrlState()
  // El menú ya lo oculta sin claims, pero `?s=cancelaciones` a mano no.
  const canCancelDeclarations = useHasPermission(CANCEL_DECLARATIONS_CLAIM)
  const canCancelTaxpayer = useHasPermission(CANCEL_TAXPAYER_CLAIM)
  const canReactivate = useHasPermission(REACTIVATE_CLAIM)
  const canView = canCancelDeclarations || canCancelTaxpayer || canReactivate

  const q = params.get('q') ?? ''
  const skip = numParam(params, 'skip') ?? 0
  const taxpayerId = numParam(params, 'tp')
  const rfcParam = params.get('rfc') ?? ''
  const tab = params.get('tab') === 'historial' ? 1 : 0
  const filters: DeclarationFilters = {
    regimen: numParam(params, 'regimen'),
    year: numParam(params, 'year'),
    estatus: numParam(params, 'estatus'),
    cancelables: params.get('cancelables') === '1',
  }

  const [taxpayer, setTaxpayer] = useState<CancellationTaxpayer | null>(null)
  const [cancelSelection, setCancelSelection] = useState<CancellationDeclaration[] | null>(null)
  const [cancelTaxpayerOpen, setCancelTaxpayerOpen] = useState(false)
  const [reactivateTarget, setReactivateTarget] = useState<ReactivateTarget | null>(null)

  // Link directo (`?tp=&rfc=`) sin ficha en memoria: se busca por RFC y se toma el id pedido.
  const needsHydration = canView && taxpayerId != null && taxpayer?.taxpayerId !== taxpayerId && rfcParam.length >= 3
  const hydration = useCancellationTaxpayerSearch(needsHydration ? rfcParam : '', 0, 20)
  useEffect(() => {
    if (!needsHydration || !hydration.data) return
    const found = hydration.data.items.find((t) => t.taxpayerId === taxpayerId)
    if (found) setTaxpayer(found)
  }, [needsHydration, hydration.data, taxpayerId])

  // Tras cancelar/reactivar, la ficha (estatus de cuenta, contador) se refresca desde la búsqueda.
  const refreshed = useCancellationTaxpayerSearch(taxpayer && !needsHydration ? taxpayer.rfc : '', 0, 20)
  useEffect(() => {
    if (!taxpayer || !refreshed.data) return
    const found = refreshed.data.items.find((t) => t.taxpayerId === taxpayer.taxpayerId)
    if (found && found !== taxpayer) setTaxpayer(found)
  }, [refreshed.data, taxpayer])

  const invalidate = useInvalidateCancellationTaxpayer()

  const serverFilters = useMemo(
    () => ({
      taxRegimeId: filters.regimen ?? undefined,
      fiscalYear: filters.year ?? undefined,
      statusId: filters.estatus ?? undefined,
      onlyCancellable: filters.cancelables || undefined,
    }),
    [filters.regimen, filters.year, filters.estatus, filters.cancelables],
  )
  const activeId = taxpayer && taxpayer.taxpayerId === taxpayerId ? taxpayer.taxpayerId : null
  const declarations = useCancellationDeclarations(activeId, serverFilters)
  // Universo sin filtrar para los selects (compartido por caché con la vista sin filtros).
  const allDeclarations = useCancellationDeclarations(activeId, {})
  const history = useCancellationHistory(activeId, tab === 1)

  const onSearch = useCallback(
    (nextQ: string, nextSkip: number) => setParams({ q: nextQ || null, skip: nextSkip || null }, { replace: true }),
    [setParams],
  )
  const openTaxpayer = (t: CancellationTaxpayer) => {
    setTaxpayer(t)
    setParams({ tp: t.taxpayerId, rfc: t.rfc, tab: null, regimen: null, year: null, estatus: null, cancelables: null })
  }
  const closeTaxpayer = () =>
    setParams({ tp: null, rfc: null, tab: null, regimen: null, year: null, estatus: null, cancelables: null })
  const onFilters = (patch: Partial<DeclarationFilters>) =>
    setParams(
      {
        ...(patch.regimen !== undefined && { regimen: patch.regimen }),
        ...(patch.year !== undefined && { year: patch.year }),
        ...(patch.estatus !== undefined && { estatus: patch.estatus }),
        ...(patch.cancelables !== undefined && { cancelables: patch.cancelables ? 1 : null }),
      },
      { replace: true },
    )
  const afterWrite = () => {
    if (activeId != null) void invalidate(activeId)
  }

  if (!canView) {
    return (
      <Card>
        <NoAccessState />
      </Card>
    )
  }

  if (taxpayerId == null || (!taxpayer && !needsHydration)) {
    return <TaxpayerSearch q={q} skip={skip} onSearch={onSearch} onSelect={openTaxpayer} />
  }

  if (!taxpayer || taxpayer.taxpayerId !== taxpayerId) {
    return (
      <Card>
        {hydration.isError || (hydration.data && !hydration.data.items.some((t) => t.taxpayerId === taxpayerId)) ? (
          <div className="px-5 py-8 text-center text-[13px] flex flex-col items-center gap-3" style={{ color: 'var(--ink-500)' }}>
            No encontramos al contribuyente de este enlace.
            <button
              type="button"
              onClick={closeTaxpayer}
              className="px-4 py-2 rounded-xl text-[12.5px] font-bold cursor-pointer"
              style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
            >
              Volver a la búsqueda
            </button>
          </div>
        ) : (
          <div className="px-5 py-10 text-center text-[13px]" style={{ color: 'var(--ink-500)' }}>
            Cargando la ficha…
          </div>
        )}
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4 max-w-full">
      <TaxpayerHeader
        taxpayer={taxpayer}
        prepaid={allDeclarations.data?.prepaid ?? declarations.data?.prepaid ?? null}
        onBack={closeTaxpayer}
        onCancelTaxpayer={() => setCancelTaxpayerOpen(true)}
        onReactivateTaxpayer={() => setReactivateTarget({ kind: 'taxpayer', taxpayer })}
      />

      <Tabs items={TABS} active={tab} onChange={(i) => setParams({ tab: i === 1 ? 'historial' : null }, { replace: true })} />

      {tab === 0 ? (
        <DeclarationsTable
          items={declarations.data?.items ?? []}
          allItems={allDeclarations.data?.items ?? declarations.data?.items ?? []}
          loading={declarations.isPending}
          error={declarations.isError ? declarations.error.message : null}
          filters={filters}
          onFilters={onFilters}
          onCancel={(selected) => setCancelSelection(selected)}
        />
      ) : (
        <HistoryTab
          taxpayer={taxpayer}
          taxpayerLogs={history.data?.taxpayer ?? []}
          declarationLogs={history.data?.declarations ?? []}
          loading={history.isPending}
          error={history.isError ? history.error.message : null}
          onReactivate={setReactivateTarget}
        />
      )}

      <CancelDeclarationsModal
        open={cancelSelection != null}
        declarations={cancelSelection ?? []}
        onClose={() => setCancelSelection(null)}
        onDone={afterWrite}
      />
      <CancelTaxpayerModal
        open={cancelTaxpayerOpen}
        taxpayer={taxpayer}
        onClose={() => setCancelTaxpayerOpen(false)}
        onDone={afterWrite}
      />
      <ReactivateModal target={reactivateTarget} onClose={() => setReactivateTarget(null)} onDone={afterWrite} />
    </div>
  )
}
