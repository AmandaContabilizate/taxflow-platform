'use client'

import { memo, useMemo } from 'react'
import { useFixedAssets } from '@/features/fixed-assets/hooks/useFixedAssets'
import { useIvaFavorBalances } from '@/features/iva-favor-balances/hooks/useIvaFavorBalances'
import type { DeclarationCalculations } from '@/features/operations/types'
import { MONO } from '../constants'
import { Badge, Card } from '../ui'
import { read612 } from './calc-612'
import {
  AmountRow,
  InlineNotice,
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
const DEP_COLS = new Set([1, 2, 3, 4, 5, 6, 7])
const IVA_ACT_COLS = new Set([2, 3])

const BAJA_LABEL: Record<string, string> = { Sold: 'Vendido', Lost: 'Perdido' }

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

  // `SaldosAFavorAplicados` ya trae el origen de cada saldo; el historial solo completa lo que
  // falte (folio o fecha que se capturaron después del cálculo). El nombre de cada activo vive
  // en su EP. En modo consulta no se piden: la pantalla muestra lo que trae el cálculo.
  const balancesQ = useIvaFavorBalances(declarationId, rfc, !consulta && iva.saldosAplicados.length > 0)
  const conActivos = c.depreciaciones.length > 0 || c.ivaCreditosActivos.length > 0
  const { query: assetsQ } = useFixedAssets(declarationId, consulta || !conActivos ? '' : rfc)
  const balanceById = useMemo(
    () => new Map((balancesQ.query.data ?? []).map((b) => [b.id, b])),
    [balancesQ.query.data],
  )
  const assetById = useMemo(() => new Map((assetsQ.data ?? []).map((a) => [a.id, a])), [assetsQ.data])
  const nombreActivo = (id: number | null, code?: string | null) => {
    const a = id != null ? assetById.get(id) : undefined
    return a?.description || a?.assetTypeName || code || (id != null ? `Activo #${id}` : '—')
  }
  const ivaActTotales = useMemo(
    () =>
      c.ivaCreditosActivos.reduce(
        (acc, x) => ({ acreditado: acc.acreditado + (x.ivaAcreditado ?? 0), excedente: acc.excedente + (x.ivaExcedenteTope ?? 0) }),
        { acreditado: 0, excedente: 0 },
      ),
    [c.ivaCreditosActivos],
  )

  const ivaDelPeriodo =
    iva.ivaCobrado != null && iva.ivaAcreditable != null
      ? iva.ivaCobrado - iva.ivaAcreditable - (iva.ivaRetenido ?? 0)
      : null
  const ivaEsFavor = (iva.ivaFavor ?? 0) > 0 && (iva.ivaCargo ?? 0) === 0
  const mostrar8 = iva.actos8 != null && iva.actos8 !== 0

  return (
    <div className="flex flex-col gap-4">
      {c.warnings.length > 0 && (
        <InlineNotice>
          <div className="font-bold mb-1">Avisos del cálculo</div>
          <ul className="list-disc pl-5 flex flex-col gap-0.5">
            {c.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </InlineNotice>
      )}
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
            hint="El de gastos normales se suma a las deducciones de ISR; el de activos fijos se pierde"
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
          <AmountRow
            label="Remanente de saldos a favor"
            hint="Lo que queda de todos los saldos anteriores después de esta declaración"
            value={fmtMoney(iva.remanente)}
          />
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
          <AmountRow
            label="Depreciación acumulada del ejercicio"
            hint={
              isr.depreciacionCapturada
                ? `Incluye ${fmtMoney(isr.depreciacionCapturada)} capturados fuera del sistema`
                : undefined
            }
            value={fmtMoney(isr.depreciacionAcumulada)}
          />
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
            subtitle="Del más antiguo al más reciente; el remanente es lo que le queda a cada saldo después de esta declaración"
          />
          <SimpleTable
            headers={['Periodo de origen', 'Folio de operación', 'Tipo', 'Presentada', 'Monto original', 'Aplicado', 'Remanente']}
            align={MONTO_COLS}
          >
            {iva.saldosAplicados.map((s, i) => {
              const b = s.id != null ? balanceById.get(s.id) : undefined
              const year = s.originFiscalYear ?? b?.originFiscalYear
              const month = s.originMonth ?? b?.originMonth
              return (
                <tr key={s.id ?? `s-${i}`} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className={cellClass} style={{ color: 'var(--ink-900)' }}>
                    {year && month ? periodoLabel(year, month) : s.id != null ? `Saldo #${s.id}` : '—'}
                  </td>
                  <td className={cellClass} style={cellMoneyStyle}>{s.operationNumber || b?.operationNumber || '—'}</td>
                  <td className={cellClass} style={{ color: 'var(--ink-700)' }}>
                    {s.declarationType || b?.declarationType || '—'}
                  </td>
                  <td className={cellClass} style={{ color: 'var(--ink-700)' }}>
                    {fmtFecha(s.presentedDate || b?.presentedDate)}
                  </td>
                  <td className={cellMoneyClass} style={cellMoneyStyle}>{fmtMoney(s.originalAmount ?? b?.originalAmount)}</td>
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
            subtitle="Activos confirmados, capturados sin factura y dados de baja en el ejercicio (estos, hasta el mes anterior a la baja); se dan de alta y corrigen en la pestaña Gastos"
          />
          <SimpleTable
            headers={[
              'Activo',
              'Monto deducible',
              'Tasa anual',
              'Meses en el ejercicio',
              'Del mes',
              'Acumulada del ejercicio',
              'Acumulada total',
              'Pendiente',
            ]}
            align={DEP_COLS}
          >
            {c.depreciaciones.map((d, i) => {
              const a = d.fixedAssetId != null ? assetById.get(d.fixedAssetId) : undefined
              const capturado = d.capturado ?? (a ? a.isCaptured === true || a.capture != null : null)
              const baja = d.disposalKind ? (BAJA_LABEL[d.disposalKind] ?? d.disposalKind) : null
              return (
                <tr key={d.fixedAssetId ?? `d-${i}`} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className={cellClass} style={{ color: 'var(--ink-900)' }}>
                    {nombreActivo(d.fixedAssetId, d.assetTypeCode)}
                    {(capturado || baja) && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {capturado && <Badge kind="sky">Capturado</Badge>}
                        {baja && <Badge kind={d.disposalKind === 'Sold' ? 'brand' : 'amber'}>{baja}</Badge>}
                      </div>
                    )}
                  </td>
                  <td className={cellMoneyClass} style={cellMoneyStyle}>{fmtMoney(d.montoDeducible)}</td>
                  <td className={cellMoneyClass} style={cellMoneyStyle}>{fmtPercent(d.tasa)}</td>
                  <td className={cellMoneyClass} style={cellMoneyStyle}>{d.mesesEjercicio ?? '—'}</td>
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

      {c.ivaCreditosActivos.length > 0 && (
        <Card>
          <PanelHeader612
            title="IVA de activos fijos"
            subtitle="IVA acreditado por CFDI (la I si es PUE; cada pago si es PPD). Lo que pasa del tope del activo (28,000 auto; 40,000 eléctrico) no se acredita y se pierde"
          />
          <SimpleTable headers={['Activo', 'CFDI', 'IVA acreditado', 'Excedente por tope']} align={IVA_ACT_COLS}>
            {c.ivaCreditosActivos.map((x, i) => (
              <tr key={`${x.fixedAssetId ?? 'a'}-${x.uuid ?? i}`} style={{ borderBottom: '1px solid var(--border)' }}>
                <td className={cellClass} style={{ color: 'var(--ink-900)' }}>
                  {nombreActivo(x.fixedAssetId)}
                </td>
                <td className={cellClass}>
                  {x.uuid ? (
                    <code title={x.uuid} style={{ ...MONO, fontSize: '11px', color: 'var(--ink-500)' }}>
                      {x.uuid.slice(0, 8)}…{x.uuid.slice(-4)}
                    </code>
                  ) : (
                    '—'
                  )}
                </td>
                <td className={`${cellMoneyClass} font-bold`} style={cellMoneyStyle}>{fmtMoney(x.ivaAcreditado)}</td>
                <td
                  className={cellMoneyClass}
                  style={{ ...cellMoneyStyle, ...((x.ivaExcedenteTope ?? 0) > 0 ? { color: 'var(--violet-ink)' } : {}) }}
                >
                  {fmtMoney(x.ivaExcedenteTope)}
                </td>
              </tr>
            ))}
            {c.ivaCreditosActivos.length > 1 && (
              <tr style={{ background: 'var(--muted)' }}>
                <td className={`${cellClass} font-extrabold`} colSpan={2} style={{ color: 'var(--ink-900)' }}>
                  Total
                </td>
                <td className={`${cellMoneyClass} font-bold`} style={cellMoneyStyle}>{fmtMoney(ivaActTotales.acreditado)}</td>
                <td className={`${cellMoneyClass} font-bold`} style={cellMoneyStyle}>{fmtMoney(ivaActTotales.excedente)}</td>
              </tr>
            )}
          </SimpleTable>
        </Card>
      )}
    </div>
  )
})
