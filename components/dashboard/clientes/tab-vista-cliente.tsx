'use client'

import { Download, Eye, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAllDeclarationsEspejo } from '@/features/declarations/actions/getAllDeclarationsEspejo.action'
import type { AllDeclarationItem, ClientDeclarationSubject } from '@/features/declarations/types'
import { MONO } from '../constants'
import { ClientDeclarationDetail } from '../declaraciones/client-declaration-detail'
import {
  DeclarationFilters,
  KIND_FUTURE_PLAN,
  PRESENTED_CODES,
  TabEmpty,
  TabError,
  TabLoading,
  declarationStatusBadge,
  monthYear,
  regularizationBadge,
  resolvePdfUrl,
  useDeclarationFilters,
  withoutUnknownStatus,
} from '../declaraciones/parts'
import { Badge, Card, Divider } from '../ui'

interface Props {
  taxpayerId: number
  legalName: string
}

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; items: AllDeclarationItem[]; rfc: string; at: Date }

/**
 * Vista del cliente: la lista "Declaraciones → Todas" tal como la ve el cliente en su app,
 * leída desde el backoffice. Reusa los mismos helpers de la pantalla del cliente
 * (filtros, badge de estatus, reglas de regularización) para que no exista una segunda
 * traducción de estatus: si difieren, la diferencia se ve en la columna "Nosotros".
 */
export function TabVistaCliente({ taxpayerId, legalName }: Props) {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [detail, setDetail] = useState<ClientDeclarationSubject | null>(null)

  const load = useCallback(async () => {
    setState({ status: 'loading' })
    const res = await getAllDeclarationsEspejo(taxpayerId)
    if (res.success) {
      setState({ status: 'ready', items: withoutUnknownStatus(res.value.items), rfc: res.value.rfc, at: new Date() })
    } else setState({ status: 'error', message: res.error.message })
  }, [taxpayerId])

  useEffect(() => {
    void load()
  }, [load])

  const items = state.status === 'ready' ? state.items : []
  const { filtered, filters } = useDeclarationFilters(items)

  // Resumen al pie con las palabras que lee el cliente, no con nuestros códigos.
  const resumen = useMemo(() => {
    const counts = new Map<string, number>()
    for (const d of filtered) {
      const label = declarationStatusBadge(d.statusCode, d.statusLabel).label
      counts.set(label, (counts.get(label) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, n]) => `${n} ${label.toLowerCase()}`)
      .join(' · ')
  }, [filtered])

  const firstName = legalName.split(' ')[0] ?? legalName

  // "Ver detalle": la MISMA pantalla de detalle del cliente, en solo lectura.
  if (detail) {
    return (
      <div className="flex flex-col gap-4">
        <div
          className="rounded-2xl px-4 py-2.5 flex items-center gap-2 text-[12.5px]"
          style={{ background: 'var(--ink-50)', border: '1px solid var(--border)', color: 'var(--ink-700)' }}
        >
          <Eye size={14} /> Detalle tal como lo ve {firstName} · solo lectura (sin acciones en su nombre)
        </div>
        <ClientDeclarationDetail declaration={detail} onBack={() => setDetail(null)} readOnly />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="px-5 py-4 flex items-start gap-3 flex-wrap">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
          >
            <Eye size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
              Vista del cliente
            </div>
            <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
              Lo que {firstName} ve hoy en <b>Declaraciones → Todas</b>, con sus mismas palabras y filtros.
              Solo lectura: aquí no se puede hacer nada en su nombre.
            </div>
          </div>
          <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--ink-500)' }}>
            {state.status === 'ready' && (
              <span>
                Actualizado{' '}
                {state.at.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              type="button"
              onClick={() => void load()}
              disabled={state.status === 'loading'}
              title="Volver a leer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-bold transition hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
            >
              <RefreshCw size={14} className={state.status === 'loading' ? 'animate-spin' : undefined} />
              Actualizar
            </button>
          </div>
        </div>
      </Card>

      {state.status === 'loading' && <TabLoading label="Leyendo la vista del cliente…" />}
      {state.status === 'error' && <TabError message={state.message} />}
      {state.status === 'ready' && items.length === 0 && (
        <TabEmpty message="El cliente no tiene declaraciones registradas: su lista se ve vacía." />
      )}

      {state.status === 'ready' && items.length > 0 && (
        <>
          <DeclarationFilters {...filters} />

          <Card>
            <div className="px-5 py-4">
              <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
                {filtered.length} {filtered.length === 1 ? 'declaración' : 'declaraciones'}
              </div>
              <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
                Mismo orden y mismos filtros que en su app
              </div>
            </div>
            <Divider />

            {filtered.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'var(--ink-500)' }}>
                No hay declaraciones con esos filtros.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead>
                    <tr className="text-left text-[10.5px] font-extrabold uppercase tracking-wide" style={{ color: 'var(--ink-400)' }}>
                      <th className="px-5 py-2.5">Periodo</th>
                      <th className="px-3 py-2.5">Régimen</th>
                      <th className="px-3 py-2.5">Él ve</th>
                      <th className="px-3 py-2.5">Botones que le aparecen</th>
                      <th className="px-5 py-2.5 text-right">Nosotros (interno)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((d) => {
                      const status = declarationStatusBadge(d.statusCode, d.statusLabel)
                      const presented = PRESENTED_CODES.has(d.statusCode)
                      const isFuturePlan = d.declarationKind === KIND_FUTURE_PLAN
                      const regularization = regularizationBadge(d.declarationKind, d.statusCode)
                      const title =
                        d.periodicity === 'Anual' || !d.month
                          ? `Ejercicio ${d.fiscalYear}`
                          : monthYear(d.fiscalYear, d.month)
                      return (
                        <tr key={d.declarationId} style={{ borderTop: '1px solid var(--border)' }}>
                          <td className="px-5 py-3 font-bold whitespace-nowrap" style={{ color: 'var(--ink-900)' }}>
                            {title}
                          </td>
                          <td className="px-3 py-3" style={{ color: 'var(--ink-700)' }}>
                            {d.regimeSatCode && (
                              <code style={{ ...MONO, fontSize: '11.5px', marginRight: 6 }}>{d.regimeSatCode}</code>
                            )}
                            <span className="text-[12.5px]">{d.regimeName ?? '—'}</span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className="inline-block w-2 h-2 rounded-full"
                                style={{ background: presented ? 'var(--brand-500)' : 'var(--ink-300)' }}
                                aria-hidden
                              />
                              <Badge kind={status.kind}>{status.label}</Badge>
                              {isFuturePlan && <Badge kind="sky">Plan a futuro</Badge>}
                              {regularization && <Badge kind={regularization.kind}>{regularization.label}</Badge>}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <ClientButtons
                              d={d}
                              onDetail={() =>
                                setDetail({
                                  declarationId: d.declarationId,
                                  rfc: state.rfc,
                                  legalName,
                                  periodo: title,
                                  fiscalYear: d.fiscalYear,
                                  statusCode: d.statusCode,
                                  statusLabel: d.statusLabel,
                                  regimeName: d.regimeName,
                                  periodicity: d.periodicity,
                                  acknowledgmentPdfUrl: d.acknowledgmentPdfUrl,
                                  paymentLinePdfUrl: d.paymentLinePdfUrl,
                                  paymentAcknowledgmentPdfUrl: d.paymentAcknowledgmentPdfUrl,
                                  submittedAt: d.submittedAt,
                                })
                              }
                            />
                          </td>
                          <td className="px-5 py-3 text-right whitespace-nowrap">
                            <code style={{ ...MONO, fontSize: '11.5px', color: 'var(--ink-500)' }}>
                              {d.statusCode} · {d.statusId}
                            </code>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {filtered.length > 0 && (
              <>
                <Divider />
                <div className="px-5 py-3 text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
                  {resumen}
                </div>
              </>
            )}
          </Card>
        </>
      )}
    </div>
  )
}

/**
 * Los botones que el cliente tiene en cada renglón de "Todas", con las mismas condiciones
 * que su pantalla: Comentarios y Ver detalle siempre; Acuse / Línea de captura / Pago solo
 * si existe el PDF. Los PDF abren de verdad (útil para soporte); los demás son solo señal.
 */
function ClientButtons({ d, onDetail }: { d: AllDeclarationItem; onDetail: () => void }) {
  const chip = 'inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11.5px] font-bold'
  const plain = { background: 'var(--ink-50)', color: 'var(--ink-600)', border: '1px solid var(--border)' }
  const link = { background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border-strong)' }
  const pdf = (url: string | null | undefined) => (url ? resolvePdfUrl(url) ?? url : null)

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className={chip} style={plain}>Comentarios</span>
      {d.acknowledgmentPdfUrl && (
        <a className={chip} style={link} href={pdf(d.acknowledgmentPdfUrl) ?? '#'} target="_blank" rel="noreferrer" title="El acuse que el cliente descarga">
          <Download size={12} /> Acuse
        </a>
      )}
      {d.paymentLinePdfUrl && (
        <a className={chip} style={link} href={pdf(d.paymentLinePdfUrl) ?? '#'} target="_blank" rel="noreferrer">
          <Download size={12} /> Línea de captura
        </a>
      )}
      {d.paymentAcknowledgmentPdfUrl && (
        <a className={chip} style={link} href={pdf(d.paymentAcknowledgmentPdfUrl) ?? '#'} target="_blank" rel="noreferrer">
          <Download size={12} /> Pago
        </a>
      )}
      <button
        type="button"
        onClick={onDetail}
        title="Abrir el detalle tal como lo ve el cliente"
        className={`${chip} transition hover:opacity-90`}
        style={{ background: 'linear-gradient(135deg,#00D3A1 0%,#00AD87 100%)', color: '#fff' }}
      >
        Ver detalle
      </button>
    </div>
  )
}
