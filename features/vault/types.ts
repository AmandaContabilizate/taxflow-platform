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

// statusComprobante del SAT: 1 = Vigente, 0 = Cancelado.
export const CFDI_STATUS_VIGENTE = 1
