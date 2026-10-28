'use client'

import { ArrowRight, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useCancellationTaxpayerSearch } from '@/features/cancellations/hooks/useCancellationQueries'
import type { CancellationTaxpayer } from '@/features/cancellations/types'
import { Pagination, SearchBar } from '../clientes/parts'
import { MONO } from '../constants'
import { Card, ErrorState, HelpBox } from '../ui'
import { AccountStatusChip } from './parts'

const TAKE = 20

/**
 * Paso 1 del módulo: encontrar al cliente por RFC, nombre o correo (mínimo 3 caracteres, con
 * debounce). El término y la página viven en la URL (`q`, `skip`) para que un refresh no los pierda.
 */
export function TaxpayerSearch({
  q,
  skip,
  onSearch,
  onSelect,
}: {
  q: string
  skip: number
  onSearch: (q: string, skip: number) => void
  onSelect: (t: CancellationTaxpayer) => void
}) {
  const [input, setInput] = useState(q)

  useEffect(() => {
    setInput(q)
  }, [q])

  useEffect(() => {
    const trimmed = input.trim()
    if (trimmed === q) return
    if (trimmed.length > 0 && trimmed.length < 3) return
    const handle = setTimeout(() => onSearch(trimmed, 0), 350)
    return () => clearTimeout(handle)
  }, [input, q, onSearch])

  const query = useCancellationTaxpayerSearch(q, skip, TAKE)
  const items = query.data?.items ?? []
  const total = query.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / TAKE))

  return (
    <div className="flex flex-col gap-5">
      <HelpBox>
        Busca al cliente por RFC, nombre o correo y abre su ficha para cancelar declaraciones sueltas o
        dar de baja al contribuyente completo. Todo queda en bitácora y se puede reactivar desde su
        pestaña Historial. Ojo: el crédito del paquete de una declaración cancelada <b>se pierde</b>.
      </HelpBox>

      <Card>
        <div className="p-4">
          <SearchBar value={input} onChange={setInput} placeholder="Buscar por RFC, nombre o correo…" />
        </div>

        {query.isError ? (
          <ErrorState message={query.error.message} />
        ) : q.length < 3 ? (
          <div className="px-5 pb-8 text-center text-[13px]" style={{ color: 'var(--ink-500)' }}>
            Escribe al menos 3 caracteres para buscar.
          </div>
        ) : query.isPending ? (
          <div className="px-5 py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Buscando…
          </div>
        ) : items.length === 0 ? (
          <div className="px-5 pb-8 text-center text-[13px]" style={{ color: 'var(--ink-500)' }}>
            No encontramos contribuyentes con “{q}”.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Cliente', 'RFC', 'Cuenta', 'Contador', 'Vendedor', ''].map((h) => (
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
                  {items.map((t) => (
                    <tr key={t.taxpayerId} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-5 py-4">
                        <div className="font-semibold" style={{ color: 'var(--ink-900)' }}>
                          {t.legalName || t.rfc}
                        </div>
                        {t.email && (
                          <div className="text-xs mt-0.5" style={{ color: 'var(--ink-500)' }}>
                            {t.email}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <code style={{ ...MONO, fontSize: '11px', color: 'var(--ink-700)' }}>{t.rfc}</code>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <AccountStatusChip accountStatusId={t.accountStatusId} deactivatedAt={t.deactivatedAt} />
                      </td>
                      <td className="px-5 py-4" style={{ color: 'var(--ink-700)' }}>
                        {t.accountantName ?? '—'}
                      </td>
                      <td className="px-5 py-4" style={{ color: 'var(--ink-700)' }}>
                        {t.sellerName ?? '—'}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => onSelect(t)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-bold whitespace-nowrap cursor-pointer"
                          style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
                        >
                          Abrir <ArrowRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={Math.floor(skip / TAKE) + 1}
              totalPages={totalPages}
              total={total}
              skip={skip}
              take={TAKE}
              itemCount={items.length}
              onPrev={() => onSearch(q, Math.max(0, skip - TAKE))}
              onNext={() => onSearch(q, skip + TAKE < total ? skip + TAKE : skip)}
            />
          </>
        )}
      </Card>
    </div>
  )
}
