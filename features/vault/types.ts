// Tipos de la bóveda de CFDI (microservicio Procedures · vault/*).

export interface VaultError {
  statusCode: number
  message: string
}

// Respuesta de vault/issued-count · vault/received-count.
export interface VaultCountResponse {
  submittedDeclarations: number
}

// Respuesta de vault/total-income · vault/total-expenses.
// El backend a veces manda PascalCase (Value/Percent) y a veces camelCase
// (value/percent); soportamos ambas y normalizamos en la action.
export interface ComparateDecimalResponse {
  Value?: number
  Percent?: string
  value?: number
  percent?: string
}

export interface ComparateDecimal {
  value: number
  percent: string
}

export interface VaultInvoiceParty {
  rfc: string
  name: string
}

// Un CFDI (idéntico para emitidas y recibidas).
export interface VaultInvoice {
  id: number
  issuer: VaultInvoiceParty
  receiver: VaultInvoiceParty
  folio: string
  uuid: string
  date: string
  // Fecha de expedición del CFDI (Comprobante/@Fecha) y fecha de timbrado
  // (TimbreFiscalDigital/@FechaTimbrado) por separado — pueden diferir unos
  // días en facturas de Público en General timbradas ya iniciado el mes
  // siguiente al que resumen.
  invoiceDate: string
  stampDate: string
  statusComprobante: number
  tipoComprobante: number
  uso: string
  total: number
  link: string
}

// Respuesta de vault/issued-invoices · vault/received-invoices.
export interface VaultInvoicesResponse {
  submittedDeclarations: VaultInvoice[]
}

// Resumen agregado de las tarjetas superiores.
export interface VaultStats {
  issuedCount: number
  receivedCount: number
  totalIncome: ComparateDecimal
  totalExpenses: ComparateDecimal
}

// Reglas iguales a las de la app móvil (vault.actions.ts).
// StatusComprobante del back: Unknown = 0, Vigente = 1, Cancelled = 2.
const CFDI_STATUS_VIGENTE = 1
const CFDI_STATUS_CANCELADO = 2
const USOS_SIN_DEDUCCION = new Set(['S01', 'CP01', 'P01']) // sin efectos fiscales / pagos

export const isCfdiCancelled = (inv: VaultInvoice) => inv.statusComprobante === CFDI_STATUS_CANCELADO

// Solo lo vigente es deducible (el estatus desconocido tampoco) y nunca los usos sin deducción.
export function isCfdiDeducible(inv: VaultInvoice): boolean {
  if (inv.statusComprobante !== CFDI_STATUS_VIGENTE) return false
  return !USOS_SIN_DEDUCCION.has((inv.uso ?? '').toUpperCase())
}
