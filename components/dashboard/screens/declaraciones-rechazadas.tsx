'use client'

import { ArrowRight, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { DECLARATION_STATUS } from '@/features/declaration-report/types'
import { getDeclarations } from '@/features/operations/actions/getDeclarations.action'
import type { DeclarationListItem, DeclarationSubject, Paged } from '@/features/operations/types'
import { declarationStatusBadge } from '../declaraciones/parts'
import { DeclarationDetail } from '../operaciones/declaration-detail'
import { Pagination } from '../clientes/parts'
import { MONO } from '../constants'
import { numParam, useUrlState } from '../url-state'
import { Badge, Card, ErrorState, HelpBox } from '../ui'

const TAKE = 50

interface CurrentUser {
  userId: string
  fullName: string
}

const emptyPage: Paged<DeclarationListItem> = { items: [], total: 0, skip: 0, take: TAKE }

/** Subject vacío para entrar por link directo (`?decl=`); el detalle lo llena con /general. */
const stubSubject = (declarationId: number, rfc: string | null): DeclarationSubject => ({
  declarationId,
  rfc: rfc ?? '',
  legalName: '',
  periodo: '',
  fiscalYear: 0,
  accountantName: null,
})

/**
 * Declaraciones que el cliente rechazó desde su reporte (`RebotadaCliente`, estatus
 * 10). Reusa la action `getDeclarations` (existente, sin uso hasta ahora) filtrando
 * por `statusId`, y el detalle normal `DeclarationDetail`, que ya pinta el banner de
 * rechazo con el comentario del cliente cuando la declaración está en estatus 10.
 */
export function DeclaracionesRechazadasScreen({ currentUser }: { currentUser: CurrentUser }) {
  const { params, setParams } = useUrlState()
  const declarationId = numParam(params, 'decl')
  const rfcParam = params.get('rfc')
  const skip = numParam(params, 'skip') ?? 0

  const [page, setPage] = useState<Paged<DeclarationListItem>>(emptyPage)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subject, setSubject] = useState<DeclarationSubject | null>(null)

  useEffect(() => {
    if (declarationId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    void (async () => {
      const res = await getDeclarations({ statusId: DECLARATION_STATUS.CLIENT_REJECTED, skip, take: TAKE })
      if (cancelled) return
      if (res.success) setPage(res.value)
      else {
        setError(res.error.message)
        setPage(emptyPage)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [declarationId, skip])

  const openDeclaration = (item: DeclarationListItem) => {
    setSubject({
      declarationId: item.id,
      rfc: item.rfc,
      legalName: item.legalName ?? '',
      periodo: item.periodo ?? '',
      fiscalYear: item.fiscalYear,
      accountantName: null,
    })
    setParams({ decl: item.id, rfc: item.rfc })
  }

  if (declarationId) {
    const current = subject?.declarationId === declarationId ? subject : stubSubject(declarationId, rfcParam)
    return (
      <DeclarationDetail
        declaration={current}
        onBack={() => setParams({ decl: null, rfc: null })}
        currentUser={currentUser}
      />
    )
  }

  const totalPages = Math.max(1, Math.ceil(page.total / TAKE))

  return (
    <div className="flex flex-col gap-5 max-w-full h-[calc(100dvh-8.5rem)]">
      <HelpBox>
        Declaraciones que el cliente rechazó desde su reporte, con el motivo que dejó. Corrige lo
        necesario y reenvíasela con &quot;Enviar Predeclaración&quot; desde el detalle.
      </HelpBox>

      <Card className="flex-1 min-h-0 flex flex-col">
        <div
          className="px-5 py-4 flex items-center justify-between flex-wrap gap-2 border-b shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
            {loading
              ? 'Cargando…'
              : `${page.total} ${page.total === 1 ? 'declaración rechazada' : 'declaraciones rechazadas'}`}
          </div>
        </div>

        {error ? (
          <div className="flex-1 flex flex-col justify-center">
            <ErrorState message={error} />
          </div>
        ) : loading ? (
          <div className="flex-1 px-5 py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando declaraciones…
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Contribuyente', 'RFC', 'Periodo', 'Ejercicio', 'Régimen', 'Estatus', ''].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left font-extrabold whitespace-nowrap"
                        style={{ color: 'var(--ink-700)', background: 'var(--card)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {page.items.map((item) => {
                    const badge = declarationStatusBadge(item.statusCode, item.statusLabel ?? item.statusCode)
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-5 py-4 font-semibold" style={{ color: 'var(--ink-900)' }}>
                          {item.legalName || '—'}
                        </td>
                        <td className="px-5 py-4">
                          <code style={{ ...MONO, fontSize: '11px', color: 'var(--ink-700)' }}>{item.rfc}</code>
                        </td>
                        <td className="px-5 py-4" style={{ color: 'var(--ink-700)' }}>{item.periodo ?? '—'}</td>
                        <td className="px-5 py-4" style={{ color: 'var(--ink-700)' }}>{item.fiscalYear}</td>
                        <td className="px-5 py-4" style={{ color: 'var(--ink-700)' }}>{item.regimeName ?? '—'}</td>
                        <td className="px-5 py-4">
                          <Badge kind={badge.kind}>{badge.label}</Badge>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => openDeclaration(item)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-bold whitespace-nowrap"
                            style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
                          >
                            Abrir <ArrowRight size={14} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {page.items.length === 0 ? (
              <div className="text-center py-8 shrink-0">
                <div style={{ color: 'var(--ink-500)' }}>No hay declaraciones rechazadas por el cliente.</div>
              </div>
            ) : (
              <Pagination
                page={Math.floor(skip / TAKE) + 1}
                totalPages={totalPages}
                total={page.total}
                skip={skip}
                take={TAKE}
                itemCount={page.items.length}
                onPrev={() => setParams({ skip: Math.max(0, skip - TAKE) || null })}
                onNext={() => setParams({ skip: skip + TAKE < page.total ? skip + TAKE : skip })}
              />
            )}
          </>
        )}
      </Card>
    </div>
  )
}
