'use client'

import { Calendar, FileText, Key, Loader2, MapPin, RefreshCcw, Stamp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getAdditionalProcedures } from '@/features/account/actions/getAdditionalProcedures.action'
import {
  EMPTY_ADDITIONAL_PROCEDURES,
  formatMXN,
  resolvePlanFeatures,
  type AdditionalProceduresCatalog,
  type Plan,
} from '@/features/account/types'
import { useHasRfc, useRfcStore } from '@/features/taxpayers/stores/rfcStore'
import { DISPLAY, MONO } from '../constants'
import type { GoFn } from '../types'
import { Btn, Card, Divider, HelpBox } from '../ui'
import { NeedsSatConnect } from './needs-sat-connect'

const KEY_ICONS: Array<[RegExp, LucideIcon]> = [
  [/domicilio/i, MapPin],
  [/cita/i, Calendar],
  [/sello|csd|firma/i, Key],
  [/regimen|régimen|actualiza/i, RefreshCcw],
  [/opinion|opinión|constancia/i, Stamp],
]

function iconFor(plan: Plan): LucideIcon {
  const haystack = `${plan.key} ${plan.name}`
  for (const [pattern, Icon] of KEY_ICONS) {
    if (pattern.test(haystack)) return Icon
  }
  return FileText
}

const ROW_ACCENTS = [
  { bg: 'var(--coral-soft)', fg: 'var(--violet-ink)' },
  { bg: 'var(--brand-50)', fg: 'var(--brand-700)' },
  { bg: 'var(--amber-soft)', fg: 'var(--violet-ink)' },
]

function description(plan: Plan): string | null {
  if (plan.shortDescription) return plan.shortDescription
  const [first] = resolvePlanFeatures(plan)
  return first ?? null
}

interface TramitesScreenProps {
  /** Manda a "Mi plan" y abre el modal de planes y pago. */
  onContratar: () => void
  go: GoFn
}

export function TramitesScreen({ onContratar, go }: TramitesScreenProps) {
  const { hasRfc, loading: loadingRfc } = useHasRfc()
  const { selectedRfcInfo } = useRfcStore()
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

  if (loadingRfc) return null
  if (!hasRfc) return <NeedsSatConnect go={go} feature="ver trámites adicionales" />
  if (selectedRfcInfo?.ciecState !== 1) return <NeedsSatConnect go={go} feature="ver trámites adicionales" />

  const { satProcedures, extraDeclarations } = catalog
  const isEmpty = !loading && satProcedures.length === 0 && extraDeclarations.length === 0

  return (
    <div className="flex flex-col gap-6">
      <HelpBox>
        Aquí están los trámites <strong>extra</strong> que puedes contratar cuando los necesites. Ninguno viene incluido
        en tu plan: se contratan y pagan por separado.
      </HelpBox>

      {loading && (
        <div className="flex items-center gap-2 text-[14px] py-6" style={{ color: 'var(--ink-500)' }}>
          <Loader2 size={18} className="animate-spin" /> Cargando trámites disponibles…
        </div>
      )}

      {error && (
        <div
          className="text-[13px] font-semibold px-4 py-2.5 rounded-xl"
          style={{ background: 'var(--coral-soft)', color: 'var(--violet-ink)' }}
        >
          {error}
        </div>
      )}

      {isEmpty && !error && (
        <div
          className="rounded-3xl p-6 text-[13.5px]"
          style={{ background: 'var(--card-muted)', border: '1px solid var(--border)', color: 'var(--ink-500)' }}
        >
          Por ahora no hay trámites adicionales disponibles.
        </div>
      )}

      {satProcedures.length > 0 && (
        <div>
          <div className="text-[18px] font-bold mb-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
            Trámites con el SAT
          </div>
          <div className="text-[13.5px] mb-4" style={{ color: 'var(--ink-500)' }}>
            Nosotros los hacemos por ti, sin que tengas que ir a una oficina.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {satProcedures.map((plan) => {
              const Icon = iconFor(plan)
              const desc = description(plan)
              return (
                <div
                  key={plan.id}
                  className="rounded-3xl p-5 flex flex-col gap-3"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--sh-1)' }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--brand-50)', color: 'var(--brand-700)' }}
                  >
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-[15px]">{plan.name}</div>
                    {desc && (
                      <div className="text-[12.5px] mt-1" style={{ color: 'var(--ink-500)' }}>
                        {desc}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-3 mt-auto pt-1">
                    <span className="text-[14.5px] font-extrabold" style={MONO}>
                      {formatMXN(plan.price)}
                      <span className="text-[11.5px] font-semibold ml-1" style={{ color: 'var(--ink-500)' }}>
                        {plan.currency}
                      </span>
                    </span>
                    <Btn size="sm" kind="ghost" onClick={onContratar}>
                      Solicitar
                    </Btn>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {extraDeclarations.length > 0 && (
        <div>
          <div className="text-[18px] font-bold mb-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
            Declaraciones extras
          </div>
          <div className="text-[13.5px] mb-4" style={{ color: 'var(--ink-500)' }}>
            Estas no vienen en tu plan mensual y se cobran por separado.
          </div>
          <Card>
            <div>
              {extraDeclarations.map((plan, i, arr) => {
                const accent = ROW_ACCENTS[i % ROW_ACCENTS.length]
                const desc = description(plan)
                return (
                  <div key={plan.id}>
                    <div className="flex items-center gap-3 px-4 py-4">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ background: accent.bg, color: accent.fg }}
                      >
                        <FileText size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[14.5px]">{plan.name}</div>
                        {desc && (
                          <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                            {desc}
                          </div>
                        )}
                      </div>
                      <span className="text-[14.5px] font-extrabold mr-1" style={MONO}>
                        {formatMXN(plan.price)}
                      </span>
                      <Btn size="sm" kind="ghost" onClick={onContratar}>
                        Contratar
                      </Btn>
                    </div>
                    {i < arr.length - 1 && <Divider />}
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {!loading && !isEmpty && (
        <div className="rounded-3xl p-5" style={{ background: 'var(--card-muted)', border: '1px solid var(--border)' }}>
          <div className="text-[13px] leading-relaxed" style={{ color: 'var(--ink-500)' }}>
            Todos los precios incluyen IVA. Ningún trámite de esta lista está incluido en tu plan; se contrata aparte
            desde <strong>Mi plan</strong>.
          </div>
        </div>
      )}
    </div>
  )
}
