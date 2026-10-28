import type { AvailableRfc } from '@/features/taxpayers/actions/getAvailableRfcs.action'
import type { FiscalScore, Regularizations, RegularizationMonth } from '@/features/declarations/types'
import type { CanRunDiagnostico } from '../types'

/**
 * Escenarios simulados de la pantalla Diagnóstico del cliente (screens/diagnostico.tsx) para
 * revisarla y capturarla sin datos reales. SOLO desarrollo: los consume getDiagnosticoMock,
 * que exige NODE_ENV=development + cookie diag_mock. Página: /dev/diagnostico?escenario=<id>.
 */
export interface DiagnosticoMock {
  titulo: string
  rfcs: AvailableRfc[]
  score: FiscalScore
  canRun: CanRunDiagnostico
  regs: Regularizations
  income: number
  bills: number
  invoices: number
}

const RFC = 'XAXX010101000'

const rfcConectado: AvailableRfc = {
  rfc: RFC,
  legalName: 'CONTRIBUYENTE DE PRUEBA',
  status69B: null,
  ciecState: 1,
  hasActiveDigitalIdentity: false,
  hasSatPassword: true,
  hasTaxCertificate: true,
  taxCertificateVerified: true,
}

function score(p: Partial<FiscalScore>): FiscalScore {
  const total = p.total ?? 12
  const presented = p.presented ?? total
  return {
    rfc: RFC,
    total,
    presented,
    pending: total - presented,
    score: total === 0 ? 100 : Math.round((presented / total) * 10000) / 100,
    breakdown: [],
    hasCsfData: true,
    isReconciling: false,
    pendingVerificationCount: 0,
    ...p,
  }
}

function canRun(p: Partial<CanRunDiagnostico>): CanRunDiagnostico {
  return {
    tienePendientes: true,
    credencialValida: true,
    yaCorriendo: false,
    puedeEjecutar: true,
    proximaVentanaUtc: null,
    ...p,
  }
}

function mes(fiscalYear: number, month: number, statusLabel: string, i: number): RegularizationMonth {
  return {
    declarationId: 9000 + i,
    fiscalYear,
    month,
    periodValueId: 100 + month,
    statusId: 14,
    statusLabel,
    isContracted: false,
    badge: 'NoPresentada',
  }
}

function regs(months: RegularizationMonth[]): Regularizations {
  return {
    rfc: RFC,
    totalMonths: months.length,
    contractedCount: 0,
    toContractCount: months.length,
    advancePercent: 0,
    months,
  }
}

const sinRegs = regs([])
const numeros = { income: 48250.5, bills: 12730.25, invoices: 18 }

const enDosHoras = () => new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()

export const ESCENARIOS: Record<string, DiagnosticoMock> = {
  'sin-rfc': {
    titulo: 'Sin RFC conectado',
    rfcs: [],
    score: score({}),
    canRun: canRun({}),
    regs: sinRegs,
    ...numeros,
  },
  'ciec-invalida': {
    titulo: 'CIEC inválida (bloqueo)',
    rfcs: [{ ...rfcConectado, ciecState: 2 }],
    score: score({}),
    canRun: canRun({ credencialValida: false, puedeEjecutar: false }),
    regs: sinRegs,
    ...numeros,
  },
  conectando: {
    titulo: 'Descargando constancia (CSF)',
    rfcs: [{ ...rfcConectado, hasTaxCertificate: false, taxCertificateVerified: false }],
    score: score({ total: 0, hasCsfData: false, isReconciling: true }),
    canRun: canRun({ yaCorriendo: true, puedeEjecutar: false }),
    regs: sinRegs,
    income: 0,
    bills: 0,
    invoices: 0,
  },
  'buscando-obligaciones': {
    titulo: 'CSF leída, buscando obligaciones',
    rfcs: [rfcConectado],
    score: score({ total: 0, isReconciling: true }),
    canRun: canRun({ yaCorriendo: true, puedeEjecutar: false }),
    regs: sinRegs,
    ...numeros,
  },
  comprobando: {
    titulo: 'Validando declaraciones (8 de 14)',
    rfcs: [rfcConectado],
    score: score({ total: 8, presented: 6, isReconciling: true, pendingVerificationCount: 6 }),
    canRun: canRun({ yaCorriendo: true, puedeEjecutar: false }),
    regs: regs([mes(2026, 6, 'No presentada', 1), mes(2026, 7, 'No presentada', 2)]),
    ...numeros,
  },
  'en-curso-csf': {
    titulo: 'Diagnóstico en curso (relectura de CSF)',
    rfcs: [rfcConectado],
    score: score({ total: 12, presented: 10 }),
    canRun: canRun({ yaCorriendo: true, puedeEjecutar: false }),
    regs: regs([mes(2026, 8, 'No presentada', 1), mes(2026, 9, 'No presentada', 2)]),
    ...numeros,
  },
  'sin-declaraciones': {
    titulo: 'Conectado, sin declaraciones',
    rfcs: [rfcConectado],
    score: score({ total: 0 }),
    canRun: canRun({}),
    regs: sinRegs,
    income: 0,
    bills: 0,
    invoices: 0,
  },
  'con-adeudos': {
    titulo: 'Diagnóstico listo con adeudos',
    rfcs: [rfcConectado],
    score: score({ total: 12, presented: 4 }),
    canRun: canRun({}),
    regs: regs([
      mes(2026, 6, 'No presentada', 1),
      mes(2026, 7, 'No presentada', 2),
      mes(2026, 8, 'No presentada', 3),
      mes(2026, 9, 'No presentada', 4),
    ]),
    ...numeros,
  },
  'al-corriente': {
    titulo: 'Al corriente',
    rfcs: [rfcConectado],
    score: score({ total: 12, presented: 12 }),
    canRun: canRun({ tienePendientes: false, puedeEjecutar: false }),
    regs: sinRegs,
    ...numeros,
  },
  throttle: {
    titulo: 'Ya corrió hoy (throttle)',
    rfcs: [rfcConectado],
    score: score({ total: 12, presented: 9 }),
    canRun: canRun({ puedeEjecutar: false, proximaVentanaUtc: enDosHoras() }),
    regs: regs([mes(2026, 8, 'No presentada', 1), mes(2026, 9, 'No presentada', 2), mes(2026, 10, 'No presentada', 3)]),
    ...numeros,
  },
  'ciec-sin-verificar': {
    titulo: 'CIEC sin verificar (banner)',
    rfcs: [{ ...rfcConectado, ciecState: 0, hasSatPassword: true }],
    score: score({ total: 12, presented: 11 }),
    canRun: canRun({ credencialValida: false, puedeEjecutar: false }),
    regs: regs([mes(2026, 9, 'No presentada', 1)]),
    ...numeros,
  },
  'solo-efirma': {
    titulo: 'Conectado solo con e.firma (banner)',
    rfcs: [{ ...rfcConectado, ciecState: 2, hasActiveDigitalIdentity: true }],
    score: score({ total: 12, presented: 11 }),
    canRun: canRun({}),
    regs: regs([mes(2026, 9, 'No presentada', 1)]),
    ...numeros,
  },
}

export const DIAG_MOCK_COOKIE = 'diag_mock'
