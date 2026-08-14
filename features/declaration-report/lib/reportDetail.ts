import type {
  Money,
  ReportDetailBlock,
  ReportDetailRow,
  ReportRowEmphasis,
} from '../types'

/**
 * `ivaDetail` / `isrDetail` llegan sin tipar: son `RawIvaJson` / `RawIsrJson` de
 * `Declarations.DeclarationSummary`, o sea la respuesta cruda del clasificador,
 * cuya forma cambia por régimen (625 anida serviceGround/serviceLodging/
 * serviceAlienation; 605 manda llaves planas en español). Aquí se normalizan a
 * bloques/renglones ya etiquetados en español, ignorando lo que no sea numérico
 * para que un JSON con llaves nuevas no rompa la pantalla.
 */

const LABELS: Record<string, string> = {
  // ISR 605 — tarifa progresiva
  ingresos_acumulables: 'Ingresos acumulables',
  deducciones_personales: 'Deducciones personales',
  base_gravable: 'Base gravable',
  limite_inferior: 'Límite inferior',
  excedente: 'Excedente del límite inferior',
  tasa: 'Tasa',
  resultado: 'Impuesto marginal',
  cuota_fija: 'Cuota fija',
  isr_conforme_tarifa_anual: 'ISR conforme a tarifa',
  subsidio_empleo: 'Subsidio para el empleo',
  isr_retenido: 'ISR retenido',
  impuesto_a_favor_del_ejercicio: 'ISR a favor',
  impuesto_a_cargo_del_ejercicio: 'ISR a cargo',

  // 625 — ingresos por origen
  totalpassengerplataform: 'Ingresos intermediarios · pasajeros',
  totaldealerplataform: 'Ingresos intermediarios · entrega de bienes',
  totallodgingplataform: 'Ingresos intermediarios · hospedaje',
  totalalienationplataform: 'Ingresos intermediarios · enajenación',
  totallendingplataform: 'Ingresos intermediarios · prestación de servicios',
  totalforintermediaries: 'Ingresos mediante intermediarios',
  totalpassengersforusers: 'Ingresos directos · pasajeros',
  totaldealerforusers: 'Ingresos directos · entrega de bienes',
  totalalienationforusers: 'Ingresos directos · enajenación',
  totallendingforusers: 'Ingresos directos · prestación de servicios',
  totalforusers: 'Ingresos mediante usuario',
  totalservice: 'Ingresos totales',
  totalincomes: 'Ingresos totales',

  // 625 — cálculo
  'optioniva.porcentage': 'Tasa',
  'isr.porcentage': 'Tasa',
  'isr.isrcaused': 'ISR causado',
  ivacaused: 'IVA causado',
  ivaexpensetotal: 'IVA de gastos (acreditable)',
  retentionplataform: 'Retenciones por plataforma',
  totalretained: 'Retenciones por plataformas',
  ivatodeclared: 'IVA del periodo',
  ivaperiodsprevius: 'IVA a acreditar de periodos anteriores',
  totaliva: 'IVA a cargo',
  totalisr: 'ISR a cargo',
}

/** Llaves que el clasificador siempre manda en 0 como placeholder. */
const HIDDEN = new Set([
  'subtotalservicedealerclasified',
  'subtotalservicepassengersclasified',
  'subtotalservicelodgingclasified',
  'subtotalservicealineationclasified',
  'subtotalservicelendingclasified',
  'totalservicepassengersfinal',
  'totalservicedealerfinal',
  'totalservicelodgingfinal',
  'totalservicealienationfinal',
  'totalservicelendingfinal',
])

/** Objetos que no merecen bloque propio: sus escalares suben al bloque padre. */
const INLINE_OBJECTS = new Set(['isr', 'optioniva'])

const SERVICE_TITLES: Record<string, string> = {
  serviceground: 'Servicio terrestre y entrega de bienes',
  servicelodging: 'Prestación de servicios de hospedaje',
  servicealienation: 'Enajenación de bienes y prestación de servicios',
}

const PERCENT_KEYS = new Set(['tasa', 'optioniva.porcentage', 'isr.porcentage'])

const SUBTOTAL_KEYS = new Set([
  'totalservice',
  'totalincomes',
  'ivatodeclared',
  'ingresos_acumulables',
  'base_gravable',
  'isr_conforme_tarifa_anual',
])

const TOTAL_KEYS = new Set([
  'totaliva',
  'totalisr',
  'impuesto_a_cargo_del_ejercicio',
  'impuesto_a_favor_del_ejercicio',
])

const ORDER = [
  'ingresos_acumulables',
  'deducciones_personales',
  'base_gravable',
  'limite_inferior',
  'excedente',
  'tasa',
  'resultado',
  'cuota_fija',
  'isr_conforme_tarifa_anual',
  'subsidio_empleo',
  'isr_retenido',
  'impuesto_a_favor_del_ejercicio',
  'impuesto_a_cargo_del_ejercicio',
  'totalpassengerplataform',
  'totaldealerplataform',
  'totallodgingplataform',
  'totalalienationplataform',
  'totallendingplataform',
  'totalforintermediaries',
  'totalpassengersforusers',
  'totaldealerforusers',
  'totalalienationforusers',
  'totallendingforusers',
  'totalforusers',
  'totalservice',
  'totalincomes',
  'optioniva.porcentage',
  'isr.porcentage',
  'ivacaused',
  'isr.isrcaused',
  'ivaexpensetotal',
  'retentionplataform',
  'totalretained',
  'ivatodeclared',
  'ivaperiodsprevius',
  'totaliva',
  'totalisr',
]

export function toNumber(value: Money): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

const MXN = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
})

export function formatMoney(value: Money): string {
  const n = toNumber(value)
  return n === null ? '—' : MXN.format(n)
}

/** Los saldos a favor llegan negativos en algunos renglones: se marcan con −. */
export function formatSignedMoney(value: Money): string {
  const n = toNumber(value)
  if (n === null) return '—'
  return n < 0 ? `−${MXN.format(Math.abs(n))}` : MXN.format(n)
}

/**
 * El clasificador mezcla fracción (`optionIva.porcentage: 0.16`) y porcentaje
 * ya escalado (`ISR.porcentage: 2.1`) en llaves distintas.
 */
export function formatPercent(value: Money): string {
  const n = toNumber(value)
  if (n === null) return '—'
  return `${(n <= 1 ? n * 100 : n).toFixed(2)}%`
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Solo se pintan llaves cuyo valor sea número o string numérico. */
function asAmount(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function prettify(key: string): string {
  const spaced = key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
    .toLowerCase()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

function emphasisFor(key: string): ReportRowEmphasis {
  if (TOTAL_KEYS.has(key)) return 'total'
  if (SUBTOTAL_KEYS.has(key)) return 'sub'
  return 'normal'
}

interface Entry {
  key: string
  amount: number
}

function collectEntries(source: Record<string, unknown>, prefix = ''): Entry[] {
  const entries: Entry[] = []

  for (const [rawKey, value] of Object.entries(source)) {
    const key = prefix ? `${prefix}.${rawKey.toLowerCase()}` : rawKey.toLowerCase()

    if (HIDDEN.has(key)) continue

    if (isPlainObject(value)) {
      if (!prefix && INLINE_OBJECTS.has(key)) {
        entries.push(...collectEntries(value, key))
      }
      continue
    }

    const amount = asAmount(value)
    if (amount === null) continue

    entries.push({ key, amount })
  }

  return entries
}

/**
 * Un total en 0 al lado de su contraparte con saldo es ruido ("ISR a favor
 * $0.00" junto a "ISR a cargo $10.29"): se oculta.
 */
function dropEmptyCounterpart(entries: Entry[]): Entry[] {
  const pairs: [string, string][] = [
    ['impuesto_a_favor_del_ejercicio', 'impuesto_a_cargo_del_ejercicio'],
  ]
  const byKey = new Map(entries.map((e) => [e.key, e.amount]))

  return entries.filter((entry) => {
    for (const pair of pairs) {
      if (!pair.includes(entry.key)) continue
      const other = pair[0] === entry.key ? pair[1] : pair[0]
      const otherAmount = byKey.get(other)
      if (entry.amount === 0 && otherAmount !== undefined && otherAmount !== 0) {
        return false
      }
    }
    return true
  })
}

function toRow(entry: Entry): ReportDetailRow {
  const label = LABELS[entry.key] ?? prettify(entry.key.split('.').pop() ?? entry.key)
  const format = PERCENT_KEYS.has(entry.key) ? 'percent' : 'money'

  // totalIva negativo significa saldo a favor que arrastra al periodo siguiente.
  if (entry.key === 'totaliva' && entry.amount < 0) {
    return {
      label: 'IVA a favor',
      amount: Math.abs(entry.amount),
      format: 'money',
      emphasis: 'total',
      tone: 'positive',
    }
  }

  const tone =
    entry.key === 'impuesto_a_favor_del_ejercicio' && entry.amount > 0
      ? 'positive'
      : 'neutral'

  return { label, amount: entry.amount, format, emphasis: emphasisFor(entry.key), tone }
}

function sortEntries(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => {
    const ia = ORDER.indexOf(a.key)
    const ib = ORDER.indexOf(b.key)
    return (ia === -1 ? ORDER.length : ia) - (ib === -1 ? ORDER.length : ib)
  })
}

function buildRows(source: Record<string, unknown>): ReportDetailRow[] {
  return sortEntries(dropEmptyCounterpart(collectEntries(source))).map(toRow)
}

/** Chip del bloque raíz de IVA: si el total es negativo, el periodo cierra a favor. */
function ivaTag(source: Record<string, unknown>): string | null {
  const total = asAmount(source.totalIva)
  if (total === null) return null
  return total < 0 ? 'A favor' : 'A cargo'
}

/**
 * Convierte `ivaDetail`/`isrDetail` en bloques pintables. Devuelve `[]` cuando el
 * régimen no maneja ese impuesto o el JSON venía corrupto (el backend lo degrada
 * a null sin tumbar el reporte).
 */
export function buildDetailBlocks(
  detail: unknown,
  kind: 'iva' | 'isr',
): ReportDetailBlock[] {
  if (!isPlainObject(detail)) return []

  const blocks: ReportDetailBlock[] = []
  const rootRows = buildRows(detail)

  if (rootRows.length > 0) {
    blocks.push({
      key: kind,
      title: kind === 'iva' ? 'IVA' : 'ISR',
      tag: kind === 'iva' ? ivaTag(detail) : null,
      rows: rootRows,
    })
  }

  for (const [rawKey, value] of Object.entries(detail)) {
    const key = rawKey.toLowerCase()
    if (!isPlainObject(value) || INLINE_OBJECTS.has(key)) continue

    const rows = buildRows(value)
    // El clasificador manda siempre los tres servicios del 625; el que no tuvo
    // movimiento llega en ceros y no aporta nada al desglose.
    if (rows.length === 0 || rows.every((row) => toNumber(row.amount) === 0)) continue

    blocks.push({
      key: `${kind}.${key}`,
      title: SERVICE_TITLES[key] ?? prettify(rawKey),
      tag: kind === 'iva' ? 'IVA' : 'ISR',
      rows,
    })
  }

  return blocks
}
