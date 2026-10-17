import type { DeclarationCalculations } from '@/features/operations/types'
import { type Json, indexOf, norm, num, pick } from './calc-read'

/**
 * Lectura del cálculo del 612 (Actividad empresarial y profesional). El clasificador responde
 * `TotalesImpuestos.TotalIvaJson` / `TotalIsrJSon` con llaves en español; el back puede
 * guardarlas tal cual o traducirlas a las llaves en inglés del 626 (`subtotalIncome16`,
 * `ISR.retentionToPay`…). Se aceptan las dos: la primera que exista gana. Ningún campo es
 * obligatorio — lo que no venga queda `null` y la pantalla pinta "—".
 */

export interface SaldoAplicado612 {
  /** Id del `IvaFavorBalance`; con él se busca el origen en el historial de saldos. */
  id: number | null
  aplicado: number | null
  remanente: number | null
}

export interface DepreciacionActivo612 {
  fixedAssetId: number | null
  montoDeducible: number | null
  tasa: number | null
  delMes: number | null
  acumuladaEjercicio: number | null
  acumuladaTotal: number | null
  pendiente: number | null
}

export interface Calc612 {
  iva: {
    actos16: number | null
    actos8: number | null
    actos0: number | null
    exentos: number | null
    ivaCobrado: number | null
    ivaGastos: number | null
    proporcion: number | null
    ivaNoAcreditable: number | null
    ivaAcreditable: number | null
    ivaRetenido: number | null
    /** Lista con su origen cuando el back manda `SaldosAFavorAplicados`; si no, solo el total. */
    saldosAplicados: SaldoAplicado612[]
    saldoAplicadoTotal: number | null
    remanente: number | null
    saldoGenerado: number | null
    ivaCargo: number | null
    ivaFavor: number | null
  }
  isr: {
    ingresosMes: number | null
    ingresosAcumulados: number | null
    gastosMes: number | null
    gastosAcumulados: number | null
    depreciacionMes: number | null
    depreciacionAcumulada: number | null
    perdidasFiscales: number | null
    baseGravable: number | null
    limiteInferior: number | null
    excedente: number | null
    porcentaje: number | null
    cuotaFija: number | null
    isrCausado: number | null
    isrRetenidoMes: number | null
    isrRetenidoAnterior: number | null
    isrRetenidoTotal: number | null
    pagosProvisionales: number | null
    isrCargo: number | null
  }
  depreciaciones: DepreciacionActivo612[]
}

const asObject = (v: unknown): Json | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Json) : null

const asArray = (v: unknown): Json[] =>
  Array.isArray(v) ? v.filter((x): x is Json => !!x && typeof x === 'object' && !Array.isArray(x)) : []

function sumOrNull(...values: (number | null)[]): number | null {
  const present = values.filter((n): n is number => n != null)
  return present.length > 0 ? present.reduce((a, b) => a + b, 0) : null
}

/**
 * `TotalesImpuestos.Depreciaciones` no vive en el JSON de IVA ni en el de ISR: el back puede
 * injertarlo en cualquiera de los dos o mandarlo en la raíz de `/calculations`.
 */
function findDepreciaciones(calc: DeclarationCalculations | null, iva: Json | null, isr: Json | null): Json | null {
  for (const source of [isr, iva, calc as unknown as Json | null]) {
    const v = asObject(indexOf(source).get(norm('Depreciaciones')))
    if (v) return v
  }
  return null
}

function readBool(data: Json | null, keys: string[]): boolean | null {
  const v = pick(data, keys)
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase()
    if (s === 'true') return true
    if (s === 'false') return false
  }
  return null
}

export function read612(calc: DeclarationCalculations | null): Calc612 {
  const iva = (calc?.iva ?? null) as Json | null
  const isr = (calc?.isr ?? null) as Json | null

  const ivaCobrado =
    num(iva, ['TotalIvaCobradoDelPeriodo', 'ivaCobrado']) ??
    sumOrNull(
      num(iva, ['IVACobradoDelPeriodoALaTasaDel16', 'totalTaxe16']),
      num(iva, ['IVACobradoDelPeriodoALaTasaDel8', 'totalTaxe8']),
    )
  const ivaGastos = num(iva, ['IvaAcreditableAntesDeProporcion'])
  const ivaAcreditable = num(iva, ['IVAAcreditableDelPeriodo', 'totalIvaCreditable'])
  const ivaNoAcreditable =
    num(iva, ['IvaNoAcreditable']) ??
    (ivaGastos != null && ivaAcreditable != null && ivaGastos >= ivaAcreditable ? ivaGastos - ivaAcreditable : null)

  const saldosAplicados: SaldoAplicado612[] = asArray(pick(iva, ['SaldosAFavorAplicados'])).map((s) => ({
    id: num(s, ['Id', 'IvaFavorBalanceId', 'BalanceId']),
    aplicado: num(s, ['Aplicado', 'Amount', 'AppliedAmount']),
    remanente: num(s, ['Remanente', 'RemainingAmount']),
  }))
  const saldoAplicadoTotal =
    saldosAplicados.length > 0
      ? sumOrNull(...saldosAplicados.map((s) => s.aplicado))
      : num(iva, ['SaldoAFavorAplicado', 'IvaAFavorDePeriodosAnteriores', 'IVAMonthsPrev'])
  const remanente =
    saldosAplicados.length > 0 && saldosAplicados.some((s) => s.remanente != null)
      ? sumOrNull(...saldosAplicados.map((s) => s.remanente))
      : num(iva, ['SaldoAFavorPendiente'])

  // El clasificador manda el total en valor absoluto y el signo en `IsAFavor`; la traducción
  // del back al estilo 626 lo guarda con signo (negativo = a favor).
  const totalIva = num(iva, ['TotalIva', 'totalIVA'])
  const ivaEsFavor = readBool(iva, ['IsAFavor'])
  let ivaCargo: number | null = null
  let ivaFavor: number | null = null
  if (totalIva != null) {
    if (ivaEsFavor != null) {
      ivaCargo = ivaEsFavor ? 0 : Math.abs(totalIva)
      ivaFavor = ivaEsFavor ? Math.abs(totalIva) : 0
    } else {
      ivaCargo = Math.max(totalIva, 0)
      ivaFavor = Math.max(-totalIva, 0)
    }
  }

  const deps = findDepreciaciones(calc, iva, isr)
  const depreciaciones: DepreciacionActivo612[] = asArray(pick(deps, ['Detalle'])).map((d) => ({
    fixedAssetId: num(d, ['FixedAssetId', 'Id']),
    montoDeducible: num(d, ['MontoDeducible']),
    tasa: num(d, ['Tasa']),
    delMes: num(d, ['DelMes']),
    acumuladaEjercicio: num(d, ['AcumuladaEjercicio']),
    acumuladaTotal: num(d, ['AcumuladaTotal']),
    pendiente: num(d, ['Pendiente']),
  }))

  const isrRetenidoMes = num(isr, ['IsrRetenidoDelPeriodo'])
  const isrRetenidoTotal = num(isr, ['IsrDeRetenciones', 'ISR.isrRetentions'])
  const isrRetenidoAnterior =
    num(isr, ['IsrRetenidoAnterior', 'IsrRetenidoPreviosAcumulados', 'IsrRetenidoDePeriodosAnteriores']) ??
    (isrRetenidoTotal != null && isrRetenidoMes != null ? isrRetenidoTotal - isrRetenidoMes : null)

  return {
    iva: {
      actos16: num(iva, ['ActividadesGravadasALaTasaDel16', 'subtotalIncome16']),
      actos8: num(iva, ['ActividadesGravadasALaTasaDel8', 'subtotalIncome8']),
      actos0: num(iva, ['ActividadesGravadasALaTasaDel0', 'subtotalIncome0']),
      exentos: num(iva, ['ActividadesExentas', 'subtotalIncomeExento']),
      ivaCobrado,
      ivaGastos,
      proporcion: num(iva, ['ProporcionIva']),
      ivaNoAcreditable,
      ivaAcreditable,
      ivaRetenido: num(iva, ['IvaRetenido', 'totalIvaRetained']),
      saldosAplicados,
      saldoAplicadoTotal,
      remanente,
      saldoGenerado: num(iva, ['SaldoAFavorGenerado']),
      ivaCargo,
      ivaFavor,
    },
    isr: {
      ingresosMes: num(isr, ['IngresosDelPeriodo', 'IngresosDelMes', 'incomesSubtotalAutorized']),
      ingresosAcumulados: num(isr, ['IngresosAcumulados', 'incomesAccumulatedsTotal']),
      gastosMes: num(isr, ['ComprasYGastosDelPeriodo', 'expensesSubtotalAutorized']),
      gastosAcumulados: num(isr, ['DeduccionesAcumuladas', 'expensesAccumulatedsTotal']),
      depreciacionMes: num(deps, ['DelMes']) ?? num(isr, ['DepreciacionDelMes']),
      depreciacionAcumulada: num(deps, ['AcumuladaEjercicio']) ?? num(isr, ['DepreciacionAcumulada']),
      perdidasFiscales: num(isr, ['PerdidasFiscales']),
      baseGravable: num(isr, ['BaseGravable']),
      limiteInferior: num(isr, ['LimiteInferior', 'ISR.lowerLimit']),
      excedente: num(isr, ['Excedente']),
      porcentaje: num(isr, ['Porcentaje', 'Tasa', 'ISR.porcentage']),
      cuotaFija: num(isr, ['CuotaFija', 'ISR.fixedFee']),
      isrCausado: num(isr, ['ImpuestosAntesDeRetenciones', 'IsrCausado', 'ISR.taxeBeforeRetentions']),
      isrRetenidoMes,
      isrRetenidoAnterior,
      isrRetenidoTotal,
      pagosProvisionales: num(isr, ['PagosProvisionalesAnteriores', 'PagosProvisionalesPrevios']),
      isrCargo: num(isr, ['TotalISR', 'ISR.retentionToPay']),
    },
    depreciaciones,
  }
}
