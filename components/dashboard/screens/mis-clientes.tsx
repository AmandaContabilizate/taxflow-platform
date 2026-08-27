'use client'

import { useCallback, useEffect, useState } from 'react'
import { Info, Loader2, Tags, UserCog, Users } from 'lucide-react'
import { getMyClients } from '@/features/taxpayers/actions/getMyClients.action'
import type { ClientListItem } from '@/features/taxpayers/types'
import { MONO } from '../constants'
import { Card, ErrorState, HelpBox } from '../ui'
import {
  MinSalesFilter,
  Pagination,
  RegimenesCell,
  SearchBar,
  VentasPagadasCell,
  usePagedList,
} from '../clientes/parts'
import { ReassignModal } from '../clientes/reassign-modal'
import { ActividadesModal } from '../clientes/actividades-modal'

const DEFAULT_MIN_SALES = 2

const ASSIGN_PERMISSION = 'AssignAccountant'
const ACTIVITIES_PERMISSION = 'AccountingManager.GetRegimeActivities'

interface MisClientesProps {
  permissions?: string[]
  /** Usuario autenticado, para la opción "Mi cartera" del filtro de gerencia. */
  userId?: string | null
}

/**
 * Cartera contable. Alcance por permisos (lo decide el backend con el token):
 * - Contador: solo su cartera, como siempre.
 * - Gerencia (AssignAccountant): todas las carteras del área, con columna y
 *   filtro por contador, reasignación y actividades económicas por régimen.
 */
export function MisClientesScreen({ permissions = [], userId }: MisClientesProps) {
  const isManager = permissions.includes(ASSIGN_PERMISSION)
  const canActivities = permissions.includes(ACTIVITIES_PERMISSION)

  // ''= todas las carteras (solo gerencia); un userId = cartera de ese contador.
  const [contadorFiltro, setContadorFiltro] = useState('')
  // Contadores vistos en los resultados: alimentan el dropdown sin endpoint extra.
  const [contadores, setContadores] = useState<{ id: string; name: string }[]>([])

  const fetcher = useCallback(
    (p: { skip?: number; take?: number; rfc?: string; minSales?: number }) =>
      getMyClients({
        ...p,
        accountantUserId: isManager ? contadorFiltro || undefined : undefined,
      }),
    [isManager, contadorFiltro],
  )
  const list = usePagedList(fetcher, 50, DEFAULT_MIN_SALES)

  const [reassignTarget, setReassignTarget] = useState<ClientListItem | null>(null)
  const [activitiesTarget, setActivitiesTarget] = useState<ClientListItem | null>(null)

  useEffect(() => {
    if (!isManager) return
    setContadores((prev) => {
      const next = new Map(prev.map((c) => [c.id, c.name]))
      for (const item of list.items) {
        if (item.accountantUserId && !next.has(item.accountantUserId)) {
          next.set(item.accountantUserId, item.accountantName || item.accountantEmail || 'Sin nombre')
        }
      }
      return next.size === prev.length ? prev : Array.from(next, ([id, name]) => ({ id, name }))
    })
  }, [isManager, list.items])

  const changeContador = (value: string) => {
    setContadorFiltro(value)
    list.resetPage()
  }

  const headers = isManager
    ? ['Cliente', 'RFC', 'Regímenes', 'Venta de Planes', 'Compras', 'Planes', 'Contador', 'Acciones']
    : ['Cliente', 'RFC', 'Regímenes', 'Venta de Planes', 'Compras', 'Planes']

  return (
    <div className="flex flex-col gap-5 max-w-full h-[calc(100dvh-8.5rem)]">
      <HelpBox>
        {isManager ? (
          <>
            Vista del área: las carteras de todos los contadores, con su contador asignado. Filtra
            por contador (o &ldquo;Mi cartera&rdquo; si también atiendes clientes), reasigna carteras y
            administra las actividades económicas por régimen de cada contribuyente.
          </>
        ) : (
          <>
            Tu cartera: los contribuyentes con venta que tienes asignados como contador. Aquí ves
            cuántas veces ha pagado cada uno, sus compras y los planes que contrataron. Con el
            filtro de ventas dejas fuera a los de una sola compra.
          </>
        )}
      </HelpBox>

      <Card className="shrink-0">
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 min-w-0">
            <SearchBar value={list.rfc} onChange={list.setRfc} placeholder="Buscar por RFC, correo, nombre o teléfono…" />
          </div>
          {isManager && (
            <select
              value={contadorFiltro}
              onChange={(e) => changeContador(e.target.value)}
              aria-label="Filtrar por contador"
              className="px-3 py-2.5 rounded-lg text-[13px] font-semibold sm:w-[230px] outline-none cursor-pointer"
              style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--ink-700)' }}
            >
              <option value="">Todos los contadores</option>
              {userId && <option value={userId}>Mi cartera</option>}
              {contadores
                .filter((c) => c.id !== userId)
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
          )}
          <MinSalesFilter
            value={list.minSales}
            onChange={list.setMinSales}
            allLabel="Todos (1 venta o más)"
            className="sm:w-[240px]"
          />
        </div>
      </Card>

      <Card className="flex-1 min-h-0 flex flex-col">
        <div
          className="px-5 py-4 flex items-center justify-between flex-wrap gap-2 border-b shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
            {list.loading ? 'Cargando…' : `${list.total} clientes`}
          </div>
        </div>

        {list.error ? (
          <div className="flex-1 flex flex-col justify-center">
            <ErrorState message={list.error} />
          </div>
        ) : list.loading ? (
          <div className="flex-1 px-5 py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando cartera…
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {headers.map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left font-extrabold"
                        style={{ color: 'var(--ink-700)', background: 'var(--card)' }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{h}</span>
                          {h === 'Venta de Planes' && (
                            <div className="relative group/tooltip inline-flex items-center">
                              <span className="cursor-help inline-flex items-center text-amber-500 hover:text-amber-600 dark:text-amber-400 transition-colors">
                                <Info size={14} />
                              </span>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover/tooltip:flex flex-col w-max px-3 py-2 bg-zinc-900/95 dark:bg-zinc-800/95 text-white text-[11.5px] font-medium leading-relaxed rounded-xl shadow-2xl backdrop-blur-md border border-zinc-700/50 pointer-events-none z-50 text-center animate-in fade-in zoom-in-95 duration-150">
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-zinc-900/95 dark:border-b-zinc-800/95" />
                                <span className="whitespace-nowrap">No se consideran las ventas de regularizaciones, trámites,</span>
                                <span className="whitespace-nowrap">declaraciones anuales ni complementarias.</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.items.map((c) => (
                    <tr key={c.taxpayerId} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-5 py-4">
                        <div className="font-semibold" style={{ color: 'var(--ink-900)' }}>
                          {c.legalName}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--ink-500)' }}>
                          {c.email}
                        </div>
                        {c.phone && (
                          <div className="text-[11.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                            📞 {c.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <code style={{ ...MONO, fontSize: '11px', color: 'var(--ink-700)' }}>{c.rfc}</code>
                      </td>
                      <td className="px-5 py-4">
                        <RegimenesCell regimenes={c.regimenes} />
                      </td>
                      <td className="px-5 py-4">
                        <VentasPagadasCell ventas={c.ventasPagadas} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-0.5 text-xs" style={{ color: 'var(--ink-700)' }}>
                          <span>Declaraciones: <b>{c.declaracionesCompradas}</b></span>
                          <span>Regularizaciones: <b>{c.regularizacionesCompradas}</b></span>
                          <span>Futuras: <b>{c.futurasCompradas}</b></span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {c.planes && c.planes.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {c.planes.map((p, i) => (
                              <span
                                key={`${c.taxpayerId}-${i}`}
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold"
                                style={{ background: 'var(--brand-100)', color: 'var(--brand-700)' }}
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--ink-500)' }}>—</span>
                        )}
                      </td>
                      {isManager && (
                        <>
                          <td className="px-5 py-4">
                            {c.accountantName ? (
                              <div className="flex items-center gap-1.5 text-[12.5px]" style={{ color: 'var(--ink-900)' }}>
                                <Users size={13} style={{ color: 'var(--ink-400)' }} />
                                {c.accountantName}
                              </div>
                            ) : (
                              <span className="text-xs" style={{ color: 'var(--ink-500)' }}>Sin contador</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setReassignTarget(c)}
                                title={c.accountantUserId ? 'Reasignar contador' : 'Asignar contador'}
                                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11.5px] font-bold cursor-pointer active:scale-[0.97]"
                                style={{
                                  background: 'var(--ink-50)',
                                  color: 'var(--ink-700)',
                                  border: '1px solid var(--border)',
                                  transition: 'transform 120ms cubic-bezier(0.23, 1, 0.32, 1)',
                                }}
                              >
                                <UserCog size={13} /> {c.accountantUserId ? 'Reasignar' : 'Asignar'}
                              </button>
                              {canActivities && (
                                <button
                                  type="button"
                                  onClick={() => setActivitiesTarget(c)}
                                  title="Actividades económicas por régimen"
                                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11.5px] font-bold cursor-pointer active:scale-[0.97]"
                                  style={{
                                    background: 'var(--hero-brand-soft)',
                                    color: 'var(--brand-700)',
                                    border: '1px solid var(--brand-500)',
                                    transition: 'transform 120ms cubic-bezier(0.23, 1, 0.32, 1)',
                                  }}
                                >
                                  <Tags size={13} /> Actividades
                                </button>
                              )}
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {list.items.length === 0 ? (
              <div className="text-center py-8 shrink-0">
                <div style={{ color: 'var(--ink-500)' }}>
                  {isManager && contadorFiltro === ''
                    ? 'No hay carteras asignadas todavía'
                    : 'Sin clientes en esta cartera'}
                </div>
              </div>
            ) : (
              <Pagination
                page={list.page}
                totalPages={list.totalPages}
                total={list.total}
                skip={list.skip}
                take={list.take}
                itemCount={list.items.length}
                onPrev={list.prevPage}
                onNext={list.nextPage}
              />
            )}
          </>
        )}
      </Card>

      {isManager && (
        <>
          <ReassignModal
            open={reassignTarget !== null}
            onOpenChange={(open) => !open && setReassignTarget(null)}
            client={reassignTarget}
            onReassigned={() => {
              setReassignTarget(null)
              list.reload()
            }}
          />
          <ActividadesModal
            open={activitiesTarget !== null}
            onOpenChange={(open) => !open && setActivitiesTarget(null)}
            client={activitiesTarget}
          />
        </>
      )}
    </div>
  )
}
