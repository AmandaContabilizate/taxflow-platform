'use client'

import { AlertCircle, Loader2 } from 'lucide-react'
import { getMyClients } from '@/features/taxpayers/actions/getMyClients.action'
import { MONO } from '../constants'
import { Card, HelpBox } from '../ui'
import {
  MinSalesFilter,
  Pagination,
  RegimenesCell,
  SearchBar,
  VentasPagadasCell,
  usePagedList,
} from '../clientes/parts'

const DEFAULT_MIN_SALES = 2

export function MisClientesScreen() {
  const list = usePagedList(getMyClients, 50, DEFAULT_MIN_SALES)

  return (
    <div className="flex flex-col gap-5 max-w-full h-[calc(100dvh-8.5rem)]">
      <HelpBox>
        Tu cartera: los contribuyentes con venta que tienes asignados como contador. Aquí ves cuántas
        veces ha pagado cada uno, sus compras y los planes que contrataron. Con el filtro de ventas
        dejas fuera a los de una sola compra.
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
          <div className="flex-1 px-5 py-8 text-center flex flex-col items-center justify-center gap-2">
            <AlertCircle size={20} style={{ color: '#9E3A15' }} />
            <div className="text-[13.5px]" style={{ color: 'var(--ink-700)' }}>
              {list.error}
            </div>
          </div>
        ) : list.loading ? (
          <div className="flex-1 px-5 py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando tu cartera…
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Cliente', 'RFC', 'Regímenes', 'Ventas pagadas', 'Compras', 'Planes'].map((h) => (
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
                        <div className="font-semibold" style={{ color: 'var(--ink-900)' }}>
                          {c.legalName}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--ink-500)' }}>
                          {c.email}
                        </div>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {list.items.length === 0 ? (
              <div className="text-center py-8 shrink-0">
                <div style={{ color: 'var(--ink-500)' }}>Aún no tienes clientes asignados</div>
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
    </div>
  )
}
