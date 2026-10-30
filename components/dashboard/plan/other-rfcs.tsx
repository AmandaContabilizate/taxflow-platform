'use client'

import { Building2 } from 'lucide-react'
import { formatMXN, periodLabel, type PlanAccountBase } from '@/features/account/types'
import { DISPLAY, MONO } from '../constants'
import { Badge, Card, Divider } from '../ui'

interface Props {
  cuentas: PlanAccountBase[]
  onSelect: (rfc: string) => void
}

export function OtherRfcs({ cuentas, onSelect }: Props) {
  if (cuentas.length === 0) return null

  return (
    <div>
      <div className="text-[18px] font-bold mb-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
        Tus otros RFC
      </div>
      <div className="text-[13.5px] mb-4" style={{ color: 'var(--ink-500)' }}>
        Cambia de RFC para administrar su plan.
      </div>

      <Card>
        <div>
          {cuentas.map((cuenta, i) => {
            const { plan } = cuenta
            const period = periodLabel(plan.billingPeriod ?? undefined)

            return (
              <div key={cuenta.rfc}>
                <button
                  onClick={() => onSelect(cuenta.rfc)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition hover:opacity-80"
                >
                  <div
                    className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--ink-50)', color: 'var(--ink-700)' }}
                  >
                    <Building2 size={17} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold truncate" style={{ color: 'var(--ink-900)' }}>
                      {cuenta.legalName ?? cuenta.rfc}
                    </div>
                    <div className="text-[12px] mt-0.5" style={{ ...MONO, color: 'var(--ink-500)' }}>
                      {cuenta.rfc}
                    </div>
                    <div className="text-[12px] mt-1" style={{ color: 'var(--ink-500)' }}>
                      {plan.hasPlan
                        ? [plan.planName ?? 'Con plan', period].filter(Boolean).join(' · ')
                        : 'Sin plan activo'}
                      {cuenta.compras.length > 0 &&
                        ` · ${cuenta.compras.length} ${cuenta.compras.length === 1 ? 'compra' : 'compras'}`}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <Badge kind={plan.hasPlan ? 'brand' : 'default'}>
                      {plan.hasPlan ? plan.status ?? 'Activo' : 'Sin plan'}
                    </Badge>
                    {plan.nextChargeAmount != null && (
                      <span className="text-[12px] font-bold" style={{ ...MONO, color: 'var(--ink-700)' }}>
                        {formatMXN(plan.nextChargeAmount)}
                      </span>
                    )}
                  </div>
                </button>
                {i < cuentas.length - 1 && <Divider />}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
