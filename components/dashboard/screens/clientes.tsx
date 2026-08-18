'use client'

import { useState } from 'react'
import { Loader2, UserCog } from 'lucide-react'
import { getClientsWithPaidSales } from '@/features/taxpayers/actions/getClientsWithPaidSales.action'
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
import { ExpedienteCliente } from '../clientes/expediente-cliente'

const ASSIGN_PERMISSION = 'AssignAccountant'
const EXPEDIENTE_PERMISSION = 'GerenciaComercial.ReadExpedienteCliente'
const DEFAULT_MIN_SALES = 2

export function ClientesScreen({ permissions = [] }: { permissions?: string[] }) {
  const list = usePagedList(getClientsWithPaidSales, 50, DEFAULT_MIN_SALES)
  const canAssign = permissions.includes(ASSIGN_PERMISSION)
  const canExpediente = permissions.includes(EXPEDIENTE_PERMISSION)
  const [target, setTarget] = useState<ClientListItem | null>(null)
  const [expedienteId, setExpedienteId] = useState<number | null>(null)

  // Clic en el nombre del cliente → expediente (Resumen / Credenciales / Productos)
  if (expedienteId !== null) {
    return (
      <ExpedienteCliente
        taxpayerId={expedienteId}
        permissions={permissions}
        onBack={() => setExpedienteId(null)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-5 max-w-full h-[calc(100dvh-8.5rem)]">
      <HelpBox>
        Contribuyentes con ventas pagadas. Aquí ves cuántas veces ha pagado cada uno, sus compras y
        los planes que contrataron. Con el filtro de ventas dejas fuera a los de una sola compra.
      </HelpBox>

      <Card className="shrink-0">
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 min-w-0">
            <SearchBar value={list.rfc} onChange={list.setRfc} placeholder="Buscar por RFC…" />
          </div>
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
            <Loader2 size={18} className="animate-spin" /> Cargando clientes…
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Cliente', 'RFC', 'Regímenes', 'Ventas pagadas', 'Compras', 'Planes', 'Contador'].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left font-extrabold"
                        style={{ color: 'var(--ink-700)', background: 'var(--card)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.items.map((c) => (
                    <tr key={c.taxpayerId} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-5 py-4">
                        {canExpediente ? (
                          <button
                            type="button"
                            onClick={() => setExpedienteId(c.taxpayerId)}
                            title="Abrir expediente del cliente"
                            className="text-left cursor-pointer group"
                          >
                            <div
                              className="font-semibold group-hover:underline underline-offset-2"
                              style={{ color: 'var(--ink-900)' }}
                            >
                              {c.legalName}
                            </div>
                            <div className="text-xs mt-0.5" style={{ color: 'var(--ink-500)' }}>
                              {c.email}
                            </div>
                          </button>
                        ) : (
                          <>
                            <div className="font-semibold" style={{ color: 'var(--ink-900)' }}>
                              {c.legalName}
                            </div>
                            <div className="text-xs mt-0.5" style={{ color: 'var(--ink-500)' }}>
                              {c.email}
                            </div>
                          </>
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
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {c.accountantUserId ? (
                            <div className="min-w-0">
                              <div className="font-semibold text-[13px] truncate" style={{ color: 'var(--ink-900)' }}>
                                {c.accountantName ?? '—'}
                              </div>
                              {c.accountantEmail && (
                                <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--ink-500)' }}>
                                  {c.accountantEmail}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold"
                              style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)' }}
                            >
                              Sin asignar
                            </span>
                          )}
                          {canAssign && (
                            <button
                              type="button"
                              onClick={() => setTarget(c)}
                              title={c.accountantUserId ? 'Reasignar contador' : 'Asignar contador'}
                              className="inline-flex items-center gap-1 text-[11.5px] font-bold px-2 py-1 rounded-lg transition hover:opacity-80"
                              style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
                            >
                              <UserCog size={13} /> {c.accountantUserId ? 'Reasignar' : 'Asignar'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {list.items.length === 0 ? (
              <div className="text-center py-8 shrink-0">
                <div style={{ color: 'var(--ink-500)' }}>No se encontraron clientes</div>
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

      {canAssign && (
        <ReassignModal
          open={target !== null}
          onOpenChange={(o) => !o && setTarget(null)}
          client={target}
          onReassigned={() => {
            setTarget(null)
            list.reload()
          }}
        />
      )}
    </div>
  )
}
