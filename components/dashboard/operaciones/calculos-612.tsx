'use client'

import { memo, useMemo } from 'react'
import { useFixedAssets } from '@/features/fixed-assets/hooks/useFixedAssets'
import { useIvaFavorBalances } from '@/features/iva-favor-balances/hooks/useIvaFavorBalances'
import type { DeclarationCalculations } from '@/features/operations/types'
import { Card } from '../ui'
import { read612 } from './calc-612'
import {
  AmountRow,
  PanelHeader612,
  SectionLabel,
  SimpleTable,
  cellClass,
  cellMoneyClass,
  cellMoneyStyle,
  fmtFecha,
  fmtMoney,
  fmtPercent,
  periodoLabel,
} from './parts-612'

const MONTO_COLS = new Set([4, 5, 6])
const DEP_COLS = new Set([1, 2, 3, 4, 5, 6])

/**
 * Cálculo del pago provisional del 612. Solo lectura: las cifras salen del clasificador y se
 * corrigen con Recalcular (activos fijos y saldos a favor se ajustan en sus pestañas).
 */
export const Calculos612 = memo(function Calculos612({
  calc,
  declarationId,
  rfc,
  nameMonth,
  consulta,
}: {
  calc: DeclarationCalculations | null
  declarationId: number
  rfc: string
  nameMonth: string | null
  consulta: boolean
}) {
  const c = useMemo(() => read612(calc), [calc])
  const { iva, isr } = c

  // El origen de cada saldo y el nombre de cada activo viven en sus propios EP. En modo
  // consulta no se piden: la pantalla muestra los montos sin el detalle.
  const balancesQ = useIvaFavorBalances(declarationId, rfc, !consulta && iva.saldosAplicados.length > 0)
  const { query: assetsQ } = useFixedAssets(declarationId, consulta || c.depreciaciones.length === 0 ? '' : rfc)
  const balanceById = useMemo(
    () => new Map((balancesQ.query.data ?? []).map((b) => [b.id, b])),
    [balancesQ.query.data],
  )
  const assetById = useMemo(() => new Map((assetsQ.data ?? []).map((a) => [a.id, a])), [assetsQ.data])

  const ivaDelPeriodo =
    iva.ivaCobrado != null && iva.ivaAcreditable != null
      ? iva.ivaCobrado - iva.ivaAcreditable - (iva.ivaRetenido ?? 0)
      : null
  const ivaEsFavor = (iva.ivaFavor ?? 0) > 0 && (iva.ivaCargo ?? 0) === 0
  const mostrar8 = iva.actos8 != null && iva.actos8 !== 0

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2 items-start">
        <Card>
          <PanelHeader612 title="IVA" subtitle={nameMonth} />
          <SectionLabel>Actividades del periodo</SectionLabel>
          <AmountRow label="Actividades gravadas al 16 %" value={fmtMoney(iva.actos16)} />
          {mostrar8 && <AmountRow label="Actividades gravadas al 8 %" value={fmtMoney(iva.actos8)} />}
          <AmountRow label="Actividades gravadas al 0 %" value={fmtMoney(iva.actos0)} />
          <AmountRow label="Actividades exentas" value={fmtMoney(iva.exentos)} last />

          <SectionLabel>Determinación del IVA</SectionLabel>
          <AmountRow label="IVA cobrado" value={fmtMoney(iva.ivaCobrado)} />
          <AmountRow label="IVA de los gastos" hint="Antes de aplicar la proporción" value={fmtMoney(iva.ivaGastos)} />
          <AmountRow
            label="Proporción de IVA acreditable"
            hint="(16 % + 8 % + 0 %) ÷ (16 % + 8 % + 0 % + exentos), art. 5 LIVA"
            value={fmtPercent(iva.proporcion)}
          />
          <AmountRow
            label="IVA no acreditable"
            hint="Se suma a las deducciones de ISR"
            value={fmtMoney(iva.ivaNoAcreditable)}
          />
          <AmountRow label="IVA acreditable" value={fmtMoney(iva.ivaAcreditable)} />
          <AmountRow label="IVA retenido" value={fmtMoney(iva.ivaRetenido)} />
          <AmountRow
            label="IVA del periodo"
            hint="Cobrado − acreditable − retenido"
            value={fmtMoney(ivaDelPeriodo)}
            last
          />

          <SectionLabel>Saldos a favor</SectionLabel>
          <AmountRow
            label="Saldos a favor aplicados"
            hint="De meses anteriores, del más antiguo al más reciente, sin pasar del IVA a cargo"
            value={fmtMoney(iva.saldoAplicadoTotal)}
          />
          <AmountRow label="Remanente de los saldos aplicados" value={fmtMoney(iva.remanente)} />
          <AmountRow
            label="Saldo a favor generado este mes"
            hint="Se guarda como saldo nuevo con origen en esta declaración"
            value={fmtMoney(iva.saldoGenerado)}
            last
          />
          <AmountRow
            label={ivaEsFavor ? 'IVA a favor' : 'IVA a cargo'}
            value={fmtMoney(ivaEsFavor ? iva.ivaFavor : iva.ivaCargo)}
            total
            last
          />
        </Card>

        <Card>
          <PanelHeader612 title="ISR" subtitle={nameMonth} />
          <SectionLabel>Ingresos y deducciones</SectionLabel>
          <AmountRow label="Ingresos del mes" value={fmtMoney(isr.ingresosMes)} />
          <AmountRow label="Ingresos acumulados" value={fmtMoney(isr.ingresosAcumulados)} />
          <AmountRow label="Gastos del mes" value={fmtMoney(isr.gastosMes)} />
          <AmountRow label="Gastos acumulados" value={fmtMoney(isr.gastosAcumulados)} />
          <AmountRow label="Depreciación del mes" value={fmtMoney(isr.depreciacionMes)} />
          <AmountRow label="Depreciación acumulada del ejercicio" value={fmtMoney(isr.depreciacionAcumulada)} />
          <AmountRow label="Pérdidas fiscales" value={fmtMoney(isr.perdidasFiscales)} last />

          <SectionLabel>Tarifa</SectionLabel>
          <AmountRow
            label="Base gravable"
            hint="Ingresos acumulados − gastos acumulados − depreciación − pérdidas"
            value={fmtMoney(isr.baseGravable)}
          />
          <AmountRow label="Límite inferior" value={fmtMoney(isr.limiteInferior)} />
          <AmountRow label="Excedente del límite inferior" value={fmtMoney(isr.excedente)} />
          <AmountRow label="% sobre el excedente" value={fmtPercent(isr.porcentaje)} />
          <AmountRow label="Cuota fija" value={fmtMoney(isr.cuotaFija)} />
          <AmountRow label="ISR causado" value={fmtMoney(isr.isrCausado)} last />

          <SectionLabel>Acreditamientos</SectionLabel>
          <AmountRow label="ISR retenido del mes" value={fmtMoney(isr.isrRetenidoMes)} />
          <AmountRow label="ISR retenido de meses anteriores" value={fmtMoney(isr.isrRetenidoAnterior)} />
          <AmountRow label="Pagos provisionales anteriores" value={fmtMoney(isr.pagosProvisionales)} last />
          <AmountRow
            label="ISR a cargo"
            hint="Si el resultado es negativo se declara en cero"
            value={fmtMoney(isr.isrCargo)}
            total
            last
          />
        </Card>
      </div>

      {iva.saldosAplicados.length > 0 && (
        <Card>
          <PanelHeader612
            title="Saldos a favor aplicados en esta declaración"
            subtitle="El origen sale del historial de la pestaña Saldos a favor"
          />
          <SimpleTable
            headers={['Periodo de origen', 'Folio de operación', 'Tipo', 'Presentada', 'Monto original', 'Aplicado', 'Remanente']}
            align={MONTO_COLS}
          >
            {iva.saldosAplicados.map((s, i) => {
              const b = s.id != null ? balanceById.get(s.id) : undefined
              return (
                <tr key={s.id ?? `s-${i}`} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className={cellClass} style={{ color: 'var(--ink-900)' }}>
                    {b ? periodoLabel(b.originFiscalYear, b.originMonth) : s.id != null ? `Saldo #${s.id}` : '—'}
                  </td>
                  <td className={cellClass} style={cellMoneyStyle}>{b?.operationNumber || '—'}</td>
                  <td className={cellClass} style={{ color: 'var(--ink-700)' }}>{b?.declarationType || '—'}</td>
                  <td className={cellClass} style={{ color: 'var(--ink-700)' }}>{fmtFecha(b?.presentedDate)}</td>
                  <td className={cellMoneyClass} style={cellMoneyStyle}>{fmtMoney(b?.originalAmount)}</td>
                  <td className={`${cellMoneyClass} font-bold`} style={cellMoneyStyle}>{fmtMoney(s.aplicado)}</td>
                  <td className={cellMoneyClass} style={cellMoneyStyle}>{fmtMoney(s.remanente)}</td>
                </tr>
              )
            })}
          </SimpleTable>
        </Card>
      )}

      {c.depreciaciones.length > 0 && (
        <Card>
          <PanelHeader612
            title="Depreciación de activos fijos"
            subtitle="Activos confirmados; se dan de alta y corrigen en la pestaña Gastos"
          />
          <SimpleTable
            headers={['Activo', 'Monto deducible', 'Tasa anual', 'Del mes', 'Acumulada del ejercicio', 'Acumulada total', 'Pendiente']}
            align={DEP_COLS}
          >
            {c.depreciaciones.map((d, i) => {
              const a = d.fixedAssetId != null ? assetById.get(d.fixedAssetId) : undefined
              return (
                <tr key={d.fixedAssetId ?? `d-${i}`} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className={cellClass} style={{ color: 'var(--ink-900)' }}>
                    {a?.description || a?.assetTypeName || (d.fixedAssetId != null ? `Activo #${d.fixedAssetId}` : '—')}
                  </td>
                  <td className={cellMoneyClass} style={cellMoneyStyle}>{fmtMoney(d.montoDeducible)}</td>
                  <td className={cellMoneyClass} style={cellMoneyStyle}>{fmtPercent(d.tasa)}</td>
                  <td className={`${cellMoneyClass} font-bold`} style={cellMoneyStyle}>{fmtMoney(d.delMes)}</td>
                  <td className={cellMoneyClass} style={cellMoneyStyle}>{fmtMoney(d.acumuladaEjercicio)}</td>
                  <td className={cellMoneyClass} style={cellMoneyStyle}>{fmtMoney(d.acumuladaTotal)}</td>
                  <td className={cellMoneyClass} style={cellMoneyStyle}>{fmtMoney(d.pendiente)}</td>
                </tr>
              )
            })}
          </SimpleTable>
        </Card>
      )}
    </div>
  )
})
