'use client'

import { AlertCircle, FileText, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getAdditionalProcedures } from '@/features/account/actions/getAdditionalProcedures.action'
import {
  EMPTY_ADDITIONAL_PROCEDURES,
  formatMXN,
  type AdditionalProceduresCatalog,
  type Plan,
} from '@/features/account/types'
import { DISPLAY, MONO } from '../constants'
import type { GoFn } from '../types'
import { Btn, Card, Divider, HelpBox } from '../ui'

interface Props {
  go: GoFn
}

export function TramitesScreen({ go }: Props) {
  const [catalog, setCatalog] = useState<AdditionalProceduresCatalog>(EMPTY_ADDITIONAL_PROCEDURES)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const res = await getAdditionalProcedures()
      if (cancelled) return
      if (res.success) setCatalog(res.value)
      else setError(res.error.message)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const contratar = () => go('plan', { openPlanPicker: true })
  const { satProcedures, extraDeclarations } = catalog
  const isEmpty = satProcedures.length === 0 && extraDeclarations.length === 0

  return (
    <div className="flex flex-col gap-6 max-w-[1040px]">
      <HelpBox>
        Trámites y declaraciones <strong>extra</strong> que puedes contratar cuando los necesites. Elige uno y págalo de
        forma segura desde <em>Mi plan</em>.
      </HelpBox>

      {loading ? (
        <Card>
          <div className="px-5 py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando trámites…
          </div>
        </Card>
      ) : error ? (
        <Card>
          <div className="px-5 py-8 text-center flex flex-col items-center gap-2">
            <AlertCircle size={20} style={{ color: '#9E3A15' }} />
            <div className="text-[13.5px]" style={{ color: 'var(--ink-700)' }}>
              {error}
            </div>
          </div>
        </Card>
      ) : isEmpty ? (
        <Card>
          <div className="text-center py-10">
            <div style={{ color: 'var(--ink-500)' }}>No hay trámites disponibles por ahora</div>
          </div>
        </Card>
      ) : (
        <>
          {satProcedures.length > 0 && (
            <section>
              <SectionTitle
                title="Trámites con el SAT"
                subtitle="Nosotros los hacemos por ti, sin que tengas que ir a una oficina."
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {satProcedures.map((p) => (
                  <ProcedureCard key={p.id} plan={p} onContratar={contratar} />
                ))}
              </div>
            </section>
          )}

          {extraDeclarations.length > 0 && (
            <section>
              <SectionTitle
                title="Declaraciones extras"
                subtitle="Estas no vienen en tu plan mensual y se cobran por separado."
              />
              <Card>
                <div>
                  {extraDeclarations.map((p, i) => (
                    <div key={p.id}>
                      <ProcedureRow plan={p} onContratar={contratar} />
                      {i < extraDeclarations.length - 1 && <Divider />}
                    </div>
                  ))}
                </div>
              </Card>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <div className="text-[18px] font-bold mb-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
        {title}
      </div>
      <div className="text-[13.5px]" style={{ color: 'var(--ink-500)' }}>
        {subtitle}
      </div>
    </div>
  )
}

function ProcedureCard({ plan, onContratar }: { plan: Plan; onContratar: () => void }) {
  return (
    <div
      className="rounded-3xl p-5 flex flex-col gap-3"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--sh-1)' }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ background: 'var(--brand-50)', color: 'var(--brand-700)' }}
      >
        <FileText size={20} />
      </div>
      <div className="flex-1">
        <div className="font-bold text-[15px]">{plan.name}</div>
        {plan.shortDescription && (
          <div className="text-[12.5px] mt-1" style={{ color: 'var(--ink-500)' }}>
            {plan.shortDescription}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-[14.5px] font-extrabold" style={MONO}>
          {formatMXN(plan.price)}
        </span>
        <Btn size="sm" kind="brand" onClick={onContratar}>
          Contratar
        </Btn>
      </div>
    </div>
  )
}

function ProcedureRow({ plan, onContratar }: { plan: Plan; onContratar: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--coral-soft)', color: '#9E3A15' }}
      >
        <FileText size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-[14.5px]">{plan.name}</div>
        {plan.shortDescription && (
          <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
            {plan.shortDescription}
          </div>
        )}
      </div>
      <span className="text-[14.5px] font-extrabold mr-1" style={MONO}>
        {formatMXN(plan.price)}
      </span>
      <Btn size="sm" kind="brand" onClick={onContratar}>
        Contratar
      </Btn>
    </div>
  )
}
