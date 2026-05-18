'use client'

import { useState, type CSSProperties } from 'react'
import { ChevronRight, PlayCircle } from 'lucide-react'
import { APRENDE_FILTERS, APRENDE_TIPS, DISPLAY, type AprendeKind } from '../constants'
import type { GoFn } from '../types'
import { Badge, type BadgeKind, Btn, HelpBox, Pill, Tabs, VideoSlot } from '../ui'

interface Props {
  go: GoFn
}

export function AprendeScreen({ go }: Props) {
  const [filter, setFilter] = useState(0)
  const filterName = APRENDE_FILTERS[filter]
  const tips = filter === 0 ? APRENDE_TIPS : APRENDE_TIPS.filter(t => t.cat === filterName)

  return (
    <div className="flex flex-col gap-6 max-w-[1040px]">
      <div
        className="rounded-3xl p-7 lg:p-8"
        style={{ background: 'var(--hero-ink-soft)', border: '1px solid var(--border)' }}
      >
        <Pill kind="ink">Hecho para ti</Pill>
        <div
          className="text-[26px] lg:text-[32px] font-extrabold tracking-tight leading-tight mt-4 max-w-[640px]"
          style={DISPLAY}
        >
          3 cosas que conviene saber antes del 17
        </div>
        <div className="text-[14.5px] mt-3 leading-relaxed max-w-[560px]" style={{ color: 'var(--ink-700)' }}>
          Lecciones cortas, en lenguaje claro, pensadas para tu situación particular.
        </div>
        <div className="mt-5">
          <Btn kind="primary" size="lg" onClick={() => go('tip-detail')}>
            <PlayCircle size={18} /> Empezar lección · 4 min
          </Btn>
        </div>
      </div>

      <HelpBox>
        Cada lección dura entre 2 y 4 minutos. Puedes leerlas, verlas en video, o preguntar dudas a tu contador al
        final.
      </HelpBox>

      <div className="flex flex-wrap gap-2">
        <Tabs items={APRENDE_FILTERS} active={filter} onChange={setFilter} />
      </div>

      <div>
        <div className="text-[15px] font-bold mb-3" style={{ color: 'var(--ink-700)' }}>
          Lecciones disponibles
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tips.map(tip => (
            <button
              key={tip.id}
              onClick={() => go('tip-detail')}
              className="rounded-3xl p-5 text-left flex flex-col gap-3 transition hover:translate-y-[-2px]"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--sh-1)' }}
            >
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={iconBg(tip.kind)}>
                  <tip.icon size={20} />
                </div>
                <Badge kind={badgeKindFor(tip.kind)}>{tip.cat}</Badge>
              </div>
              <div>
                <div className="font-bold text-[15px] leading-tight">{tip.t}</div>
                <div className="text-[12.5px] mt-1.5 leading-relaxed" style={{ color: 'var(--ink-500)' }}>
                  {tip.d}
                </div>
              </div>
              <div
                className="text-[12.5px] font-bold flex items-center gap-1 mt-auto"
                style={{ color: 'var(--brand-700)' }}
              >
                Ver lección <ChevronRight size={13} />
              </div>
            </button>
          ))}
        </div>
        {tips.length === 0 && (
          <div
            className="rounded-2xl p-5 text-center text-[13.5px]"
            style={{ background: 'var(--ink-50)', color: 'var(--ink-500)' }}
          >
            No hay lecciones de esta categoría todavía. Pronto agregamos más.
          </div>
        )}
      </div>

      <div>
        <div className="text-[15px] font-bold mb-3" style={{ color: 'var(--ink-700)' }}>
          🎬 También en video
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <VideoSlot title="¿Qué impuestos pago si trabajo por mi cuenta?" duration="4 min" />
          <VideoSlot title="Cómo separar tus finanzas personales del negocio" duration="3 min" />
        </div>
      </div>
    </div>
  )
}

function iconBg(kind: AprendeKind): CSSProperties {
  const map: Record<AprendeKind, CSSProperties> = {
    brand: { background: 'var(--brand-50)', color: 'var(--brand-700)' },
    sky: { background: 'var(--sky-soft)', color: '#1C4C96' },
    amber: { background: 'var(--amber-soft)', color: '#7B5312' },
    violet: { background: 'var(--violet-soft)', color: '#403A8D' },
    coral: { background: 'var(--coral-soft)', color: '#9E3A15' },
  }
  return map[kind]
}

function badgeKindFor(kind: AprendeKind): BadgeKind {
  if (kind === 'brand') return 'brand'
  if (kind === 'amber') return 'amber'
  if (kind === 'coral') return 'coral'
  return 'default'
}
