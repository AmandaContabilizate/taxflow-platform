'use client'

import { Info, Loader2 } from 'lucide-react'
import { getTaxpayers } from '@/features/taxpayers/actions/getTaxpayers.action'
import { MONO } from '../constants'
import { Card, ErrorState, HelpBox } from '../ui'
import {
  Pagination,
  RegimenesCell,
  TaxpayerFilters,
  VentasPagadasCell,
  usePagedList,
  useRegimenOptions,
} from '../clientes/parts'

const DEFAULT_MIN_SALES = 2

export function ContribuyentesScreen() {
  const list = usePagedList(getTaxpayers, 50, DEFAULT_MIN_SALES)
  const regimenOptions = useRegimenOptions(list.items)

  return (
    <div className="flex flex-col gap-5 max-w-full h-[calc(100dvh-8.5rem)]">
      <HelpBox>
        Padrón de contribuyentes. Filtra por RFC, régimen fiscal o por número de ventas pagadas
        (con 2+ ves solo a los que renovaron).
      </HelpBox>

      <Card className="shrink-0">
        <div className="p-4">
          <TaxpayerFilters
            rfc={list.rfc}
            onRfcChange={list.setRfc}
            regimeId={list.regimeId}
            onRegimeChange={list.setRegimeId}
            regimenes={regimenOptions}
            placeholder="Buscar por RFC, correo, nombre o teléfono…"
            minSales={list.minSales}
            onMinSalesChange={list.setMinSales}
            minSalesAllLabel="Todos (con o sin venta)"
          />
        </div>
      </Card>

      <Card className="flex-1 min-h-0 flex flex-col">
        <div
          className="px-5 py-4 flex items-center justify-between flex-wrap gap-2 border-b shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
            {list.loading ? 'Cargando…' : `${list.total} contribuyentes`}
          </div>
        </div>

        {list.error ? (
          <div className="flex-1 flex flex-col justify-center">
            <ErrorState message={list.error} />
          </div>
        ) : list.loading ? (
          <div className="flex-1 px-5 py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando contribuyentes…
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Contribuyente', 'RFC', 'Correo', 'Regímenes', 'Venta de Planes'].map((h) => (
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
                  {list.items.map((t) => (
                    <tr key={t.taxpayerId} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-5 py-4">
                        <div className="font-semibold" style={{ color: 'var(--ink-900)' }}>
                          {t.legalName}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <code style={{ ...MONO, fontSize: '11px', color: 'var(--ink-700)' }}>{t.rfc}</code>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm" style={{ color: 'var(--ink-700)' }}>
                          {t.email}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <RegimenesCell regimenes={t.regimenes} />
                      </td>
                      <td className="px-5 py-4">
                        <VentasPagadasCell ventas={t.ventasPagadas} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {list.items.length === 0 ? (
              <div className="text-center py-8 shrink-0">
                <div style={{ color: 'var(--ink-500)' }}>No se encontraron contribuyentes</div>
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
