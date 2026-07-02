'use client'

import { AlertCircle, Loader2 } from 'lucide-react'
import { getTaxpayers } from '@/features/taxpayers/actions/getTaxpayers.action'
import { MONO } from '../constants'
import { Card, HelpBox } from '../ui'
import { Pagination, RegimenesCell, SearchBar, usePagedList } from '../clientes/parts'

export function ContribuyentesScreen() {
  const list = usePagedList(getTaxpayers, 50)

  return (
    <div className="flex flex-col gap-5 max-w-full">
      <HelpBox>
        Padrón completo de contribuyentes. Filtra por RFC y navega entre páginas.
      </HelpBox>

      <Card>
        <div className="p-4">
          <SearchBar value={list.rfc} onChange={list.setRfc} placeholder="Buscar por RFC…" />
        </div>
      </Card>

      <Card>
        <div
          className="px-5 py-4 flex items-center justify-between flex-wrap gap-2 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
            {list.loading ? 'Cargando…' : `${list.total} contribuyentes`}
          </div>
        </div>

        {list.error ? (
          <div className="px-5 py-8 text-center flex flex-col items-center gap-2">
            <AlertCircle size={20} style={{ color: '#9E3A15' }} />
            <div className="text-[13.5px]" style={{ color: 'var(--ink-700)' }}>
              {list.error}
            </div>
          </div>
        ) : list.loading ? (
          <div className="px-5 py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando contribuyentes…
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Contribuyente', 'RFC', 'Correo', 'Regímenes'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left font-extrabold" style={{ color: 'var(--ink-700)' }}>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {list.items.length === 0 ? (
              <div className="text-center py-8">
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
