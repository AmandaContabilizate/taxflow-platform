'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { removeManualIncome } from '@/features/declarations/actions/removeManualIncome.action'
import { invalidateDeclarationData, useManualIncomes } from '@/features/declarations/hooks/useDeclarationQueries'
import type { ManualIncome } from '@/features/declarations/types'
import { DISPLAY, MONO } from '../constants'
import { fmtDate, money } from '../declaraciones/parts'
import { Btn, Card } from '../ui'
import { ConfirmarQuitar } from './confirmar-quitar'
import { AgregarIngresoManualModal } from './agregar-ingreso-manual-modal'
import { TASAS } from './ingreso-manual-form'
import { InlineNotice, SimpleTable, cellClass, cellMoneyClass, cellMoneyStyle } from './parts-612'

function QuitarIngreso({ declarationId, income }: { declarationId: number; income: ManualIncome }) {
  const queryClient = useQueryClient()

  const onConfirm = async () => {
    const res = await removeManualIncome(declarationId, income.id)
    if (!res.success) return res.error.message
    await invalidateDeclarationData(queryClient, declarationId)
    return null
  }

  return (
    <ConfirmarQuitar title="Quitar ingreso sin CFDI" onConfirm={onConfirm}>
      El ingreso dejará de contar al recalcular.
    </ConfirmarQuitar>
  )
}

export function IngresosManualesPanel({
  declarationId,
  regimeSatCode,
  consulta,
  puedeEditar,
  periodo,
  fiscalYear,
  periodValueId,
}: {
  declarationId: number
  regimeSatCode: string | null | undefined
  consulta: boolean
  puedeEditar: boolean
  periodo: string
  fiscalYear: number
  periodValueId: number
}) {
  const { data, isPending, error } = useManualIncomes(declarationId, consulta)
  const [adding, setAdding] = useState(false)
  const es625 = regimeSatCode === '625'
  const rows = data ?? []
  const sum = (pick: (r: ManualIncome) => number) => rows.reduce((acc, r) => acc + pick(r), 0)
  const headers = [
    'Fecha',
    'Contraparte',
    'Concepto',
    ...(es625 ? ['Tipo de servicio'] : []),
    'Subtotal',
    'IVA',
    'Total',
    'Capturó',
    ...(puedeEditar ? [''] : []),
  ]
  const moneyCols = new Set([headers.indexOf('Subtotal'), headers.indexOf('IVA'), headers.indexOf('Total')])

  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-[15px] font-extrabold" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>Ingresos sin CFDI</h3>
        {puedeEditar && (
          <Btn kind="ghost" size="sm" onClick={() => setAdding(true)}>
            <Plus size={14} /> Agregar ingreso
          </Btn>
        )}
      </div>
      {isPending ? (
        <p className="text-[13px]" style={{ color: 'var(--ink-500)' }}>Cargando ingresos…</p>
      ) : error ? (
        <InlineNotice kind="error">{error.message}</InlineNotice>
      ) : rows.length === 0 ? (
        <p className="text-[13px]" style={{ color: 'var(--ink-500)' }}>Sin ingresos capturados a mano.</p>
      ) : (
        <SimpleTable headers={headers} align={moneyCols}>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}>
              <td className={`${cellClass} whitespace-nowrap`}>{fmtDate(r.incomeDate)}</td>
              <td className={cellClass}>{r.counterparty ?? '—'}</td>
              <td className={cellClass}>{r.concept}</td>
              {es625 && <td className={cellClass}>{r.classificationName ?? '—'}</td>}
              <td className={cellMoneyClass} style={cellMoneyStyle}>{money(r.subtotal)}</td>
              <td className={cellMoneyClass} style={cellMoneyStyle}>
                {money(r.transferredIva)}
                <span className="block text-[10.5px]" style={{ color: 'var(--ink-500)' }}>
                  {TASAS.find((t) => t.value === r.ivaRate)?.label ?? r.ivaRate}
                </span>
              </td>
              <td className={cellMoneyClass} style={cellMoneyStyle}>{money(r.total)}</td>
              <td className={cellClass}>
                {r.createdByName ?? '—'}
                <span className="block text-[10.5px]" style={{ color: 'var(--ink-500)' }}>{fmtDate(r.createdAt)}</span>
              </td>
              {puedeEditar && <td className={cellClass}><QuitarIngreso declarationId={declarationId} income={r} /></td>}
            </tr>
          ))}
          <tr style={{ borderTop: '2px solid var(--border)' }}>
            <td className={`${cellClass} font-extrabold`} colSpan={es625 ? 4 : 3}>Suma</td>
            <td className={cellMoneyClass} style={cellMoneyStyle}>{money(sum((r) => r.subtotal))}</td>
            <td className={cellMoneyClass} style={cellMoneyStyle}>{money(sum((r) => r.transferredIva))}</td>
            <td className={cellMoneyClass} style={cellMoneyStyle}>{money(sum((r) => r.total))}</td>
            <td className={cellClass} colSpan={puedeEditar ? 2 : 1} />
          </tr>
        </SimpleTable>
      )}
      {puedeEditar && (
        <AgregarIngresoManualModal
          open={adding}
          onClose={() => setAdding(false)}
          declarationId={declarationId}
          es625={es625}
          periodo={periodo}
          fiscalYear={fiscalYear}
          periodValueId={periodValueId}
        />
      )}
    </Card>
  )
}
