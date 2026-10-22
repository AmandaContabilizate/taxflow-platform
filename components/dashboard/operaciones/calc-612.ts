import type { DeclarationCalculations } from '@/features/operations/types'
import { type Json, indexOf, norm, num, pick } from './calc-read'

/**
 * Lectura del cálculo del 612 (Actividad empresarial y profesional) desde
 * `GET declarations/{id}/calculations` (Reports):
 *
 * - `iva` = `TotalesImpuestos.TotalIvaJson` del clasificador COMPLETO (llaves en español:
 *   `ProporcionIva`, `IvaNoAcreditable`, `SaldosAFavorAplicados`, `SaldoAFavorGenerado`…) más las
 *   llaves de compatibilidad del 626 (`totalIVA` con signo, `subtotalIncome16`…) que el back solo
 *   agrega si el 612 no trae la suya.
 * - `isr` = `TotalesImpuestos.TotalIsrJSon` completo + `Depreciaciones` + `Warnings` (el back los
 *   injerta en este bloque) + compatibilidad del 626 (`incomesSubtotalAutorized`, `ISR.*`).
 *
 * Contrato del clasificador: `clasificador-python/docs/calculo_612.md`. Algunos montos llegan
 * como string ("1234.50"): `num` los convierte. Lo que no venga queda `null` → "—".
 */

/** `TotalIvaJson.SaldosAFavorAplicados[]`: solo los que se aplicaron, en el orden en que se aplicaron. */
export interface SaldoAplicado612 {
  /** Id del `IvaFavorBalance`. */
  id: number | null
  aplicado: number | null
  /** `RemanenteDespues`: lo que le queda al saldo después de esta declaración. */
  remanente: number | null
  originFiscalYear: number | null
  originMonth: number | null
  operationNumber: string | null
  declarationType: string | null
  presentedDate: string | null
  originalAmount: number | null
}

/** `TotalesImpuestos.Depreciaciones.Detalle[]`. */
export interface DepreciacionActivo612 {
  fixedAssetId: number | null
  assetTypeCode: string | null
  montoDeducible: number | null
  tasa: number | null
  delMes: number | null
  acumuladaEjercicio: number | null
  acumuladaTotal: number | null
  pendiente: number | null
  /** §11 (opcionales con un clasificador viejo): activo capturado sin factura (R7). */
  capturado: boolean | null
  /** `Sold` | `Lost` si el activo se dio de baja (R8); se deprecia hasta el mes anterior. */
  disposalKind: string | null
  /** Meses que se depreció en el ejercicio. */
  mesesEjercicio: number | null
}

/** `FixedAssetIvaCredits[]` (R3): IVA de un activo acreditado por CFDI y lo que pasó del tope. */
export interface IvaCreditoActivo612 {
  fixedAssetId: number | null
  uuid: string | null
  ivaAcreditado: number | null
  ivaExcedenteTope: number | null
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
    saldosAplicados: SaldoAplicado612[]
    saldoAplicadoTotal: number | null
    /** `SaldoAFavorPendiente`: remanente de todos los saldos después de aplicar. */
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
    /** `TotalIsrJSon.DepreciacionAcumulada` = la del ejercicio de los activos + la capturada. */
    depreciacionAcumulada: number | null
    /** `Depreciaciones.AcumuladaCapturada`: depreciación que el sistema no tiene. */
    depreciacionCapturada: number | null
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
  /** `FixedAssetIvaCredits`; vacío si el back no lo manda. */
  ivaCreditosActivos: IvaCreditoActivo612[]
  /** `Warnings` del clasificador (IA que falló o no se consultó, activo sin tasa). */
  warnings: string[]
}

const asObject = (v: unknown): Json | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Json) : null

const asArray = (v: unknown): Json[] =>
  Array.isArray(v) ? v.filter((x): x is Json => !!x && typeof x === 'object' && !Array.isArray(x)) : []

const str = (data: Json | null, keys: string[]): string | null => {
  const v = pick(data, keys)
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

function sumOrNull(...values: (number | null)[]): number | null {
  const present = values.filter((n): n is number => n != null)
  return present.length > 0 ? present.reduce((a, b) => a + b, 0) : null
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
    num(iva, ['TotalIvaCobradoDelPeriodo']) ??
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
    id: num(s, ['Id']),
    aplicado: num(s, ['Aplicado']),
    remanente: num(s, ['RemanenteDespues']),
    originFiscalYear: num(s, ['OriginFiscalYear']),
    originMonth: num(s, ['OriginMonth']),
    operationNumber: str(s, ['OperationNumber']),
    declarationType: str(s, ['DeclarationType']),
    presentedDate: str(s, ['PresentedDate']),
    originalAmount: num(s, ['OriginalAmount']),
  }))
  // `SaldoAFavorAplicado` = Σ SaldosAFavorAplicados[].Aplicado. Sin historial de saldos
  // (`IvaFavorBalances` = null en el payload) es lo acreditado de meses anteriores.
  const saldoAplicadoTotal =
    num(iva, ['SaldoAFavorAplicado']) ??
    (saldosAplicados.length > 0
      ? sumOrNull(...saldosAplicados.map((s) => s.aplicado))
      : num(iva, ['IvaAFavorDePeriodosAnteriores', 'IVAMonthsPrev']))
  const remanente = num(iva, ['SaldoAFavorPendiente'])

  // El clasificador manda `TotalIva` en valor absoluto (string) y el signo en `IsAFavor`; la
  // compatibilidad del 626 (`totalIVA`) lo trae con signo (negativo = a favor). Las dos llaves
  // normalizan igual, así que se toma el valor absoluto y el signo sale de `IsAFavor`.
  const totalIva = num(iva, ['TotalIva'])
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

  const deps = asObject(indexOf(isr).get(norm('Depreciaciones')))
  const depreciaciones: DepreciacionActivo612[] = asArray(pick(deps, ['Detalle'])).map((d) => ({
    fixedAssetId: num(d, ['FixedAssetId']),
    assetTypeCode: str(d, ['AssetTypeCode']),
    montoDeducible: num(d, ['MontoDeducible']),
    tasa: num(d, ['Tasa']),
    delMes: num(d, ['DelMes']),
    acumuladaEjercicio: num(d, ['AcumuladaEjercicio']),
    acumuladaTotal: num(d, ['AcumuladaTotal']),
    pendiente: num(d, ['Pendiente']),
    capturado: readBool(d, ['Capturado']),
    disposalKind: str(d, ['DisposalKind']),
    mesesEjercicio: num(d, ['MesesDepreciadosEjercicio']),
  }))

  // R3: el back puede injertarlo en el bloque de IVA (lo natural), en el de ISR o dentro de
  // `Depreciaciones`. Se busca en ese orden; si no viene, la tabla no se pinta.
  const ivaCreditosActivos: IvaCreditoActivo612[] = asArray(
    pick(iva, ['FixedAssetIvaCredits']) ?? pick(isr, ['FixedAssetIvaCredits']) ?? pick(deps, ['FixedAssetIvaCredits']),
  ).map((c) => ({
    fixedAssetId: num(c, ['FixedAssetId']),
    uuid: str(c, ['Uuid']),
    ivaAcreditado: num(c, ['IvaAcreditado']),
    ivaExcedenteTope: num(c, ['IvaExcedenteTope']),
  }))

  // El 612 no manda el retenido de meses anteriores por separado: `IsrDeRetenciones` es el
  // acumulado (previos + del periodo).
  const isrRetenidoMes = num(isr, ['IsrRetenidoDelPeriodo'])
  const isrRetenidoTotal = num(isr, ['IsrDeRetenciones'])
  const isrRetenidoAnterior =
    isrRetenidoTotal != null && isrRetenidoMes != null ? isrRetenidoTotal - isrRetenidoMes : null

  const rawWarnings = pick(isr, ['Warnings'])
  const warnings = (Array.isArray(rawWarnings) ? rawWarnings : []).filter(
    (w): w is string => typeof w === 'string' && w.trim() !== '',
  )

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
      ingresosMes: num(isr, ['IngresosDelPeriodo', 'incomesSubtotalAutorized']),
      ingresosAcumulados: num(isr, ['IngresosAcumulados']),
      // Sin los activos fijos y con el IVA no acreditable. La compatibilidad
      // `expensesSubtotalAutorized` es `TotalesExpensesJson.Subtotal`, que no lleva el IVA no
      // acreditable: no sirve de respaldo.
      gastosMes: num(isr, ['ComprasYGastosDelPeriodo']),
      gastosAcumulados: num(isr, ['DeduccionesAcumuladas']),
      depreciacionMes: num(deps, ['DelMes']),
      depreciacionAcumulada:
        num(isr, ['DepreciacionAcumulada']) ??
        sumOrNull(num(deps, ['AcumuladaEjercicio']), num(deps, ['AcumuladaCapturada'])),
      depreciacionCapturada: num(deps, ['AcumuladaCapturada']),
      perdidasFiscales: num(isr, ['PerdidasFiscales']),
      baseGravable: num(isr, ['BaseGravable']),
      limiteInferior: num(isr, ['LimiteInferior']),
      excedente: num(isr, ['Excedente']),
      // Fracción (0.3 = 30 %). `ISR.porcentage` de la compatibilidad sale en 0 en el 612.
      porcentaje: num(isr, ['Porcentaje']),
      cuotaFija: num(isr, ['CuotaFija']),
      isrCausado: num(isr, ['ImpuestosAntesDeRetenciones', 'ISR.taxeBeforeRetentions']),
      isrRetenidoMes,
      isrRetenidoAnterior,
      isrRetenidoTotal,
      pagosProvisionales: num(isr, ['PagosProvisionalesAnteriores']),
      isrCargo: num(isr, ['TotalISR', 'ISR.retentionToPay']),
    },
    depreciaciones,
    ivaCreditosActivos,
    warnings,
  }
}
