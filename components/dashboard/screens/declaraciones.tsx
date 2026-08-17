'use client'

import { useState } from 'react'
import { useHasRfc, useRfcStore } from '@/features/taxpayers/stores/rfcStore'
import type { DeclarationSubject } from '@/features/operations/types'
import { AnualesTab } from '../declaraciones/anuales-tab'
import { FuturoTab } from '../declaraciones/futuro-tab'
import { RegularizacionesTab } from '../declaraciones/regularizaciones-tab'
import { TodasTab } from '../declaraciones/todas-tab'
import { DeclarationDetail } from '../operaciones/declaration-detail'
import type { GoFn } from '../types'
import { HelpBox, Tabs, VideoSlot } from '../ui'
import { NeedsSatConnect } from './needs-sat-connect'

interface CurrentUser {
  userId: string
  fullName: string
}

interface Props {
  go: GoFn
  currentUser: CurrentUser
}

type TabKey = 'todas' | 'regularizaciones' | 'futuro' | 'anuales'

const TAB_LABELS: Record<TabKey, string> = {
  todas: 'Todas',
  regularizaciones: 'Regularizaciones',
  futuro: 'Plan a futuro',
  anuales: 'Anuales',
}

const TAB_VIDEOS: Record<TabKey, [string, string][]> = {
  todas: [],
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

// "Todas" va primera en la barra de tabs, pero la pestaña seleccionada por
// defecto sigue siendo "Regularizaciones" (ver useState más abajo).
const ORDER: TabKey[] = ['todas', 'regularizaciones', 'futuro', 'anuales']

export function DeclaracionesScreen({ go, currentUser }: Props) {
  const { hasRfc, loading } = useHasRfc()
  const { selectedRfcInfo } = useRfcStore()
  const [tab, setTab] = useState<TabKey>('regularizaciones')
  const [detail, setDetail] = useState<DeclarationSubject | null>(null)

  if (loading) return null
  if (!hasRfc) return <NeedsSatConnect go={go} feature="ver tus declaraciones" />
  if (selectedRfcInfo?.ciecState !== 1) return <NeedsSatConnect go={go} feature="ver tus declaraciones" />

  if (detail) {
    return (
      <DeclarationDetail
        declaration={detail}
        onBack={() => setDetail(null)}
        viewerRole="contribuyente"
        currentUser={currentUser}
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <HelpBox>
        <strong>Tus declaraciones, organizadas por momento.</strong> Resuelve el pasado, ten claridad del futuro y no
        olvides la anual. Todo lo prepara tu contador, tú solo autorizas.
      </HelpBox>

      <Tabs items={ORDER.map((k) => TAB_LABELS[k])} active={ORDER.indexOf(tab)} onChange={(i) => setTab(ORDER[i])} />

      {tab === 'todas' && <TodasTab onViewDetail={setDetail} currentUser={currentUser} />}
      {tab === 'regularizaciones' && <RegularizacionesTab />}
      {tab === 'futuro' && <FuturoTab />}
      {tab === 'anuales' && <AnualesTab />}

      {TAB_VIDEOS[tab].length > 0 && (
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
      )}
    </div>
  )
}
