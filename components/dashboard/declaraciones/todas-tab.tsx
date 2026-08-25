'use client'

import { CheckCircle2, Download, FileText, MessageSquare } from 'lucide-react'
import { useMemo, useState } from 'react'
import { getAllDeclarations } from '@/features/declarations/actions/getAllDeclarations.action'
import { useRfcStore } from '@/features/taxpayers/stores/rfcStore'
import type { ClientDeclarationSubject } from '@/features/declarations/types'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge, Card, Divider } from '../ui'
import { DeclarationComments } from './declaration-comments'
import {
  TabEmpty,
  TabError,
  TabLoading,
  declarationStatusBadge,
  monthYear,
  useRfcResource,
} from './parts'

interface CurrentUser {
  userId: string
  fullName: string
}

const PRESENTED_CODES = new Set(['Presentada', 'PresentadaManual', 'PresentadaPrevio', 'PresentadaExterno'])

/** 1 = Regularizacion, 2 = Plan a futuro (Sales.SaleDeclaration.DeclarationKind). */
const KIND_REGULARIZATION = 1
const KIND_FUTURE_PLAN = 2

/**
 * Una regularizacion esta comprada cuando tiene venta activa (kind 1) y ya se
 * activo ("En proceso"). Sin venta el back manda `declarationKind: null` y el
 * SAT la reporta como no presentada: esa es la que todavia se puede comprar.
 */
function regularizationBadge(
  kind: number | null,
  statusCode: string,
): { kind: 'brand' | 'coral'; label: string } | null {
  if (kind === KIND_REGULARIZATION && statusCode === 'EnProceso') {
    return { kind: 'brand', label: 'Comprada' }
  }
  if (kind == null && statusCode === 'NoPresentada') {
    return { kind: 'coral', label: 'Por comprar' }
  }
  return null
}

const ALL_YEARS = 'todos'
const ALL_REGIMES = 'todos'

interface Props {
  onViewDetail: (subject: ClientDeclarationSubject) => void
  currentUser: CurrentUser
}

export function TodasTab({ onViewDetail, currentUser }: Props) {
  const state = useRfcResource(getAllDeclarations)
  const { selectedRfcInfo } = useRfcStore()
  const [yearFilter, setYearFilter] = useState(ALL_YEARS)
  const [regimeFilter, setRegimeFilter] = useState(ALL_REGIMES)
  const [commentFor, setCommentFor] = useState<number | null>(null)

  const items = state.status === 'ready' ? state.data.items : []

  const years = useMemo(
    () => Array.from(new Set(items.map((i) => i.fiscalYear))).sort((a, b) => b - a),
    [items],
  )

  const regimes = useMemo(
    () =>
      Array.from(new Set(items.map((i) => i.regimeName).filter((r): r is string => Boolean(r)))).sort(
        (a, b) => a.localeCompare(b),
      ),
    [items],
  )

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (yearFilter === ALL_YEARS || String(i.fiscalYear) === yearFilter) &&
          (regimeFilter === ALL_REGIMES || i.regimeName === regimeFilter),
      ),
    [items, yearFilter, regimeFilter],
  )

  if (state.status === 'loading') return <TabLoading label="Cargando tus declaraciones…" />
  if (state.status === 'error') return <TabError message={state.message} />

  if (items.length === 0) {
    return <TabEmpty message="No tienes declaraciones registradas." />
  }

  return (
    <>
      <Card>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
              Año fiscal
            </label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border text-[13px]"
              style={{ borderColor: 'var(--border)', background: 'var(--input)', color: 'var(--foreground)' }}
            >
              <option value={ALL_YEARS}>Todos</option>
              {years.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
              Régimen
            </label>
            <select
              value={regimeFilter}
              onChange={(e) => setRegimeFilter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border text-[13px]"
              style={{ borderColor: 'var(--border)', background: 'var(--input)', color: 'var(--foreground)' }}
            >
              <option value={ALL_REGIMES}>Todos</option>
              {regimes.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <div className="px-5 py-4">
          <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
            {filtered.length} {filtered.length === 1 ? 'declaración' : 'declaraciones'}
          </div>
          <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
            Historial completo, sin filtrar por acción pendiente
          </div>
        </div>
        <Divider />
        {filtered.length === 0 ? (
          <div className="text-center py-8">
            <div style={{ color: 'var(--ink-500)' }}>No hay declaraciones con esos filtros.</div>
          </div>
        ) : (
          <div>
            {filtered.map((d, i) => {
              const status = declarationStatusBadge(d.statusCode, d.statusLabel)
              const presented = PRESENTED_CODES.has(d.statusCode)
              const isFuturePlan = d.declarationKind === KIND_FUTURE_PLAN
              const regularization = regularizationBadge(d.declarationKind, d.statusCode)
              const title =
                d.periodicity === 'Anual' || !d.month
                  ? `Ejercicio ${d.fiscalYear}`
                  : monthYear(d.fiscalYear, d.month)

              return (
                <div key={d.declarationId}>
                  <div className="flex items-center gap-3 px-5 py-4">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: presented ? 'var(--brand-100)' : 'var(--ink-50)',
                        color: presented ? 'var(--brand-700)' : 'var(--ink-500)',
                      }}
                    >
                      {presented ? <CheckCircle2 size={18} /> : <FileText size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-bold text-[14.5px]" style={{ color: 'var(--ink-900)' }}>
                          {title}
                        </div>
                        <Badge kind={status.kind}>{status.label}</Badge>
                        {isFuturePlan && <Badge kind="sky">Plan a futuro</Badge>}
                        {regularization && (
                          <Badge kind={regularization.kind}>{regularization.label}</Badge>
                        )}
                      </div>
                      <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                        {[d.regimeName, d.statusLabel].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setCommentFor(d.declarationId)}
                        title="Comentarios"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-bold transition hover:opacity-90"
                        style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
                      >
                        <MessageSquare size={14} /> Comentarios
                      </button>
                      {d.acknowledgmentPdfUrl && (
                        <a
                          href={d.acknowledgmentPdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-bold transition hover:opacity-90"
                          style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
                        >
                          <Download size={14} /> Acuse
                        </a>
                      )}
                      <button
                        onClick={() =>
                          onViewDetail({
                            declarationId: d.declarationId,
                            rfc: selectedRfcInfo?.rfc ?? (state.status === 'ready' ? state.data.rfc : ''),
                            legalName: selectedRfcInfo?.legalName ?? '',
                            periodo: title,
                            fiscalYear: d.fiscalYear,
                            statusCode: d.statusCode,
                            statusLabel: d.statusLabel,
                            regimeName: d.regimeName,
                            periodicity: d.periodicity,
                            acknowledgmentPdfUrl: d.acknowledgmentPdfUrl,
                            submittedAt: d.submittedAt,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-bold transition hover:opacity-90"
                        style={{ background: 'linear-gradient(135deg,#00D3A1 0%,#00AD87 100%)', color: '#fff' }}
                      >
                        Ver detalle
                      </button>
                    </div>
                  </div>
                  {i < filtered.length - 1 && <Divider />}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Sheet open={commentFor != null} onOpenChange={(open) => !open && setCommentFor(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-4 p-5">
          <SheetHeader className="p-0">
            <SheetTitle>Comentarios</SheetTitle>
          </SheetHeader>
          {commentFor != null && (
            <DeclarationComments declarationId={commentFor} currentUser={currentUser} />
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
