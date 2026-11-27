'use client'

import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { removeManualIncome } from '@/features/declarations/actions/removeManualIncome.action'
import { invalidateDeclarationData, useManualIncomes } from '@/features/declarations/hooks/useDeclarationQueries'
import type { ManualIncome } from '@/features/declarations/types'
import { MONO } from '../constants'
import { fmtDate, money } from '../declaraciones/parts'
import { Modal } from '../modal'
import { Btn, Card } from '../ui'
import { AgregarIngresoManualModal, TASAS } from './agregar-ingreso-manual-modal'
import { InlineNotice, SimpleTable, cellClass, cellMoneyClass, cellMoneyStyle } from './parts-612'

function QuitarIngreso({ declarationId, income }: { declarationId: number; income: ManualIncome }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const close = () => {
    setOpen(false)
    setError(null)
  }

  const remove = async () => {
    setRemoving(true)
    setError(null)
    try {
      const res = await removeManualIncome(declarationId, income.id)
      if (!res.success) return setError(res.error.message)
      close()
      void invalidateDeclarationData(queryClient, declarationId)
    } catch {
      setError('No se pudo quitar el ingreso. Intenta de nuevo.')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 -mx-1 px-1 py-0.5 rounded text-[10.5px] font-semibold transition-colors hover:bg-[var(--ink-50)]"
        style={{ color: 'var(--danger-ink)' }}
      >
        <Trash2 size={11} /> Quitar
      </button>
      <Modal
        isOpen={open}
        onClose={close}
        title="Quitar ingreso sin CFDI"
        maxWidth={440}
        footer={
          <div className="flex justify-end gap-2">
            <Btn kind="ghost" size="sm" onClick={close}>Cancelar</Btn>
            <Btn size="sm" onClick={remove} disabled={removing}>
              {removing && <Loader2 size={14} className="animate-spin" />} Quitar
            </Btn>
          </div>
        }
      >
        <div className="flex flex-col gap-3 text-[13px]" style={{ color: 'var(--ink-700)' }}>
          <p>El ingreso dejará de contar al recalcular.</p>
          {error && <InlineNotice kind="error">{error}</InlineNotice>}
        </div>
      </Modal>
    </>
  )
}

export function IngresosManualesPanel({
  declarationId,
  regimeSatCode,
  consulta,
  puedeEditar,
  periodo,
}: {
  declarationId: number
  regimeSatCode: string | null | undefined
  consulta: boolean
  puedeEditar: boolean
  periodo: string
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
        <h3 className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>Ingresos sin CFDI</h3>
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
              <td className={cellClass}>
                {r.counterpartyName ?? (r.counterpartyRfc ? '' : '—')}
                {r.counterpartyRfc && <code className="block" style={MONO}>{r.counterpartyRfc}</code>}
              </td>
              <td className={cellClass}>{r.concept}</td>
              {es625 && <td className={cellClass}>{r.category625 ?? '—'}</td>}
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
        />
      )}
    </Card>
  )
}
