'use client'

import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import { Fragment, memo, useMemo, useState } from 'react'
import { useSatFavorBalances } from '@/features/iva-favor-balances/hooks/useSatFavorBalances'
import type { CalculatedFavorBalance, SatFavorBalance } from '@/features/iva-favor-balances/types'
import { Badge, Card } from '../ui'
import {
  InlineNotice,
  PanelHeader612,
  SimpleTable,
  cellClass,
  cellMoneyClass,
  cellMoneyStyle,
  fmtFecha,
  fmtMoney,
  periodoLabel,
} from './parts-612'

const MONTO_COLS = new Set([5, 6, 7])

const KIND_LABEL: Record<string, string> = {
  Creditable: 'Acreditamiento',
  Compensation: 'Compensación',
}

/** Fila común: un saldo del SAT o uno de nuestro cálculo (mes sin acuse leído). */
interface Fila {
  key: string
  fiscalYear: number
  month: number
  declarationId: number | null
  operationNumber: string | null
  declarationType: string | null
  presentedDate: string | null
  originalAmount: number
  appliedAmount: number
  remainingAmount: number
  fuente: 'SAT' | 'Calculo'
  applications: SatFavorBalance['applications']
}

const deSat = (b: SatFavorBalance): Fila => ({
  key: `sat-${b.declarationId}`,
  fiscalYear: b.fiscalYear,
  month: b.month,
  declarationId: b.declarationId,
  operationNumber: b.operationNumber,
  declarationType: b.complementaryType ? `${b.declarationType ?? 'Complementaria'} · ${b.complementaryType}` : b.declarationType,
  presentedDate: b.presentedAt,
  originalAmount: Number(b.originalAmount) || 0,
  appliedAmount: Number(b.appliedAmount) || 0,
  remainingAmount: Number(b.remainingAmount) || 0,
  fuente: 'SAT',
  applications: b.applications ?? [],
})

const deCalculo = (b: CalculatedFavorBalance): Fila => ({
  key: `calc-${b.id}`,
  fiscalYear: b.originFiscalYear,
  month: b.originMonth,
  declarationId: b.originDeclarationId,
  operationNumber: b.operationNumber,
  declarationType: b.declarationType,
  presentedDate: b.presentedDate,
  originalAmount: Number(b.originalAmount) || 0,
  appliedAmount: Math.max(0, (Number(b.originalAmount) || 0) - (Number(b.remainingAmount) || 0)),
  remainingAmount: Number(b.remainingAmount) || 0,
  fuente: 'Calculo',
  applications: [],
})

/**
 * Saldos a favor de IVA que tiene disponibles esta declaración según los acuses del SAT (folio,
 * fecha, monto original, lo ya aplicado y en qué meses), más los de nuestro cálculo de meses que
 * todavía no tienen acuse leído. Son los mismos que recibe el clasificador al recalcular.
 */
export const SaldosFavorSatCard = memo(function SaldosFavorSatCard({ declarationId }: { declarationId: number }) {
  const query = useSatFavorBalances(declarationId)
  const filas = useMemo(() => {
    const d = query.data
    if (!d) return []
    return [...d.iva.map(deSat), ...d.calculated.map(deCalculo)].sort(
      (a, b) => a.fiscalYear * 100 + a.month - (b.fiscalYear * 100 + b.month) || (a.fuente === 'SAT' ? -1 : 1),
    )
  }, [query.data])
  const total = useMemo(() => filas.reduce((acc, f) => acc + f.remainingAmount, 0), [filas])
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set())
  const toggle = (k: string) =>
    setAbiertos((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })

  return (
    <Card>
      <PanelHeader612
        title="Saldos a favor de IVA según el SAT"
        subtitle={
          query.isSuccess
            ? `${filas.length} saldo${filas.length === 1 ? '' : 's'} disponible${filas.length === 1 ? '' : 's'} para ${periodoLabel(query.data.fiscalYear, query.data.month)} · remanente ${fmtMoney(total)}`
            : 'Leídos de los acuses; se aplican del más antiguo al más reciente, sin pasar del IVA a cargo'
        }
      />
      {query.isPending ? (
        <div className="flex items-center gap-2 px-5 py-6 text-[13px]" style={{ color: 'var(--ink-500)' }}>
          <Loader2 size={16} className="animate-spin" /> Cargando saldos del SAT…
        </div>
      ) : query.isError ? (
        <div className="p-5">
          <InlineNotice kind="error">{query.error.message}</InlineNotice>
        </div>
      ) : filas.length === 0 ? (
        <div className="px-5 py-6 text-[13px]" style={{ color: 'var(--ink-500)' }}>
          Los acuses leídos no muestran saldos a favor de IVA con remanente antes de este periodo.
        </div>
      ) : (
        <SimpleTable
          headers={['', 'Periodo de origen', 'Folio de operación', 'Tipo', 'Presentada', 'Monto original', 'Aplicado', 'Remanente', 'Fuente']}
          align={MONTO_COLS}
        >
          {filas.map((f) => {
            const conDetalle = f.applications.length > 0
            const abierto = abiertos.has(f.key)
            return (
              <Fragment key={f.key}>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className={cellClass}>
                    <button
                      type="button"
                      onClick={() => toggle(f.key)}
                      disabled={!conDetalle}
                      title={conDetalle ? 'Ver en qué meses se aplicó' : 'Ningún acuse lo ha aplicado'}
                      className="p-1 rounded disabled:opacity-40"
                      style={{ color: 'var(--ink-700)' }}
                    >
                      {abierto ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  </td>
                  <td className={cellClass} style={{ color: 'var(--ink-900)' }}>
                    <div className="font-semibold">{periodoLabel(f.fiscalYear, f.month)}</div>
                    {f.declarationId != null && (
                      <div className="text-[11.5px]" style={{ color: 'var(--ink-500)' }}>
                        Declaración #{f.declarationId}
                      </div>
                    )}
                  </td>
                  <td className={cellClass} style={cellMoneyStyle}>{f.operationNumber || '—'}</td>
                  <td className={cellClass} style={{ color: 'var(--ink-700)' }}>{f.declarationType || '—'}</td>
                  <td className={`${cellClass} whitespace-nowrap`} style={{ color: 'var(--ink-700)' }}>
                    {fmtFecha(f.presentedDate)}
                  </td>
                  <td className={cellMoneyClass} style={cellMoneyStyle}>{fmtMoney(f.originalAmount)}</td>
                  <td className={cellMoneyClass} style={cellMoneyStyle}>{fmtMoney(f.appliedAmount)}</td>
                  <td className={`${cellMoneyClass} font-bold`} style={cellMoneyStyle}>{fmtMoney(f.remainingAmount)}</td>
                  <td className={cellClass}>
                    {f.fuente === 'SAT' ? (
                      <Badge kind="brand">Acuse SAT</Badge>
                    ) : (
                      <span title="El mes todavía no tiene acuse leído: se usa lo que calculamos">
                        <Badge kind="amber">Cálculo sin acuse</Badge>
                      </span>
                    )}
                  </td>
                </tr>
                {abierto && conDetalle && (
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
                    <td />
                    <td colSpan={8} className="px-3 py-2.5">
                      <div className="flex flex-col gap-1">
                        {f.applications.map((a, i) => (
                          <div key={`${a.declarationId}-${i}`} className="flex items-center gap-3 text-[12px] flex-wrap">
                            <span className="font-semibold" style={{ color: 'var(--ink-900)' }}>
                              {periodoLabel(a.fiscalYear, a.month)}
                            </span>
                            <span style={{ color: 'var(--ink-500)' }}>
                              Declaración #{a.declarationId}
                              {a.operationNumber ? ` · folio ${a.operationNumber}` : ''}
                            </span>
                            <span style={cellMoneyStyle}>{fmtMoney(a.amount)}</span>
                            <Badge>{KIND_LABEL[a.kind] ?? a.kind}</Badge>
                            {a.declarationId === declarationId && <Badge kind="sky">Esta declaración</Badge>}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </SimpleTable>
      )}
    </Card>
  )
})
