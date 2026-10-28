'use client'

import { ArrowLeft, Mail, RotateCcw, UserX } from 'lucide-react'
import type { CancellationTaxpayer, PrepaidBalance } from '@/features/cancellations/types'
import { DISPLAY, MONO } from '../constants'
import { useHasPermission } from '../permissions'
import { Card } from '../ui'
import {
  AccountStatusChip,
  CANCEL_TAXPAYER_CLAIM,
  REACTIVATE_CLAIM,
  dangerBtn,
  dangerBtnStyle,
  isDeactivated,
  secondaryBtn,
  secondaryBtnStyle,
} from './parts'

function EquipoChip({ nombre, rol }: { nombre: string | null; rol: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2 py-1 rounded-full"
      style={{
        background: nombre ? 'var(--ink-50)' : 'var(--amber-soft)',
        color: nombre ? 'var(--ink-700)' : 'var(--violet-ink)',
        border: '1px solid var(--border)',
      }}
    >
      {nombre ?? 'Sin asignar'}
      <span style={{ color: 'var(--ink-400)' }}>· {rol}</span>
    </span>
  )
}

/**
 * Ficha del contribuyente (recorte del encabezado del expediente): identidad, estatus de cuenta,
 * equipo y saldo prepagado informativo. Las acciones de cuenta dependen del claim y del estatus.
 */
export function TaxpayerHeader({
  taxpayer,
  prepaid,
  onBack,
  onCancelTaxpayer,
  onReactivateTaxpayer,
}: {
  taxpayer: CancellationTaxpayer
  prepaid: PrepaidBalance | null
  onBack: () => void
  onCancelTaxpayer: () => void
  onReactivateTaxpayer: () => void
}) {
  const canCancel = useHasPermission(CANCEL_TAXPAYER_CLAIM)
  const canReactivate = useHasPermission(REACTIVATE_CLAIM)
  const deactivated = isDeactivated(taxpayer.accountStatusId)
  const hard = taxpayer.accountStatusId === 3
  const initials = (taxpayer.legalName || taxpayer.rfc)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

  return (
    <Card>
      <div className="px-5 py-4 flex items-start gap-4 flex-wrap">
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver a la búsqueda"
          className="w-9 h-9 rounded-xl flex items-center justify-center transition hover:opacity-80 active:scale-[0.97] flex-shrink-0 cursor-pointer"
          style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
        >
          <ArrowLeft size={16} />
        </button>
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-[15px] font-extrabold"
          style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[18px] font-extrabold tracking-tight" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
              {taxpayer.legalName || taxpayer.rfc}
            </span>
            <AccountStatusChip accountStatusId={taxpayer.accountStatusId} deactivatedAt={taxpayer.deactivatedAt} />
          </div>
          <div className="flex items-center gap-3 flex-wrap mt-1.5 text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
            <code style={{ ...MONO, fontSize: '11.5px', color: 'var(--ink-700)' }}>{taxpayer.rfc}</code>
            {taxpayer.email && (
              <span className="inline-flex items-center gap-1">
                <Mail size={13} /> {taxpayer.email}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-2.5">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wide" style={{ color: 'var(--ink-400)' }}>
              Equipo
            </span>
            <EquipoChip nombre={taxpayer.sellerName} rol="Vendedor" />
            <EquipoChip nombre={taxpayer.accountantName} rol="Contador" />
          </div>
          {prepaid && (
            <div className="mt-2.5 text-[12px]" style={{ color: 'var(--ink-500)' }}>
              Saldo prepagado (informativo, el reembolso se decide fuera del sistema):{' '}
              <b style={{ color: 'var(--ink-700)' }}>{prepaid.assignedNotPresented}</b> asignadas sin presentar ·{' '}
              <b style={{ color: 'var(--ink-700)' }}>{prepaid.unassignedCredits}</b> créditos sin asignar
            </div>
          )}
        </div>
        <div className="flex items-start gap-2 flex-wrap">
          {canCancel && !deactivated && (
            <button type="button" onClick={onCancelTaxpayer} className={dangerBtn} style={dangerBtnStyle}>
              <UserX size={15} /> Cancelar cliente
            </button>
          )}
          {canReactivate && deactivated && !hard && (
            <button
              type="button"
              onClick={onReactivateTaxpayer}
              className={`${secondaryBtn} inline-flex items-center gap-2`}
              style={secondaryBtnStyle}
            >
              <RotateCcw size={15} /> Reactivar cliente
            </button>
          )}
        </div>
      </div>
    </Card>
  )
}
