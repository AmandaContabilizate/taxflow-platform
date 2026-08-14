'use client'

import { AlertCircle, Loader2 } from 'lucide-react'
import { getTaxpayers } from '@/features/taxpayers/actions/getTaxpayers.action'
import { MONO } from '../constants'
import { Card, HelpBox } from '../ui'
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
            placeholder="Buscar por RFC…"
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
          <div className="flex-1 px-5 py-8 text-center flex flex-col items-center justify-center gap-2">
            <AlertCircle size={20} style={{ color: '#9E3A15' }} />
            <div className="text-[13.5px]" style={{ color: 'var(--ink-700)' }}>
              {list.error}
            </div>
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
                    {['Contribuyente', 'RFC', 'Correo', 'Regímenes', 'Ventas pagadas'].map((h) => (
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
