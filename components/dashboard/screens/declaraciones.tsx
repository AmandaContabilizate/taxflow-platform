'use client'

import { useState } from 'react'
import { useHasRfc } from '@/features/taxpayers/stores/rfcStore'
import { AnualesTab } from '../declaraciones/anuales-tab'
import { FuturoTab } from '../declaraciones/futuro-tab'
import { RegularizacionesTab } from '../declaraciones/regularizaciones-tab'
import type { GoFn } from '../types'
import { HelpBox, Tabs, VideoSlot } from '../ui'
import { NeedsSatConnect } from './needs-sat-connect'

interface Props {
  go: GoFn
}

type TabKey = 'regularizaciones' | 'futuro' | 'anuales'

const TAB_LABELS: Record<TabKey, string> = {
  regularizaciones: 'Regularizaciones',
  futuro: 'Plan a futuro',
  anuales: 'Anuales',
}

const TAB_VIDEOS: Record<TabKey, [string, string][]> = {
  regularizaciones: [
    ['¿Cómo funcionan las regularizaciones?', '3 min'],
    ['¿Qué pasa si no presento a tiempo?', '2 min'],
  ],
  futuro: [
    ['¿Qué es una declaración mensual?', '3 min'],
    ['¿Cómo autorizo mi declaración?', '2 min'],
  ],
  anuales: [
    ['La declaración anual, explicada', '4 min'],
    ['¿Me toca pagar o me devuelven?', '3 min'],
  ],
}

const ORDER: TabKey[] = ['regularizaciones', 'futuro', 'anuales']

export function DeclaracionesScreen({ go }: Props) {
  const { hasRfc, loading } = useHasRfc()
  const [tab, setTab] = useState<TabKey>('regularizaciones')

  if (loading) return null
  if (!hasRfc) return <NeedsSatConnect go={go} feature="ver tus declaraciones" />

  return (
    <div className="flex flex-col gap-5">
      <HelpBox>
        <strong>Tus declaraciones, organizadas por momento.</strong> Resuelve el pasado, ten claridad del futuro y no
        olvides la anual. Todo lo prepara tu contador, tú solo autorizas.
      </HelpBox>

      <Tabs items={ORDER.map((k) => TAB_LABELS[k])} active={ORDER.indexOf(tab)} onChange={(i) => setTab(ORDER[i])} />

      {tab === 'regularizaciones' && <RegularizacionesTab />}
      {tab === 'futuro' && <FuturoTab />}
      {tab === 'anuales' && <AnualesTab />}

      <div>
        <div className="text-[16px] font-bold mb-3" style={{ color: 'var(--ink-700)' }}>
          ¿Necesitas entender mejor?
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TAB_VIDEOS[tab].map(([title, duration]) => (
            <VideoSlot key={title} title={title} duration={duration} />
          ))}
        </div>
      </div>
    </div>
  )
}
