'use client'

import { AlertCircle, Clock, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRfcStore } from '@/features/taxpayers/stores/rfcStore'
import type { CiecBlockStatus } from '../sat-connection.utils'
import { DISPLAY } from '../constants'
import { Btn, CiecUpdateModal } from '../ui'
import type { GoFn } from '../types'

interface Props {
  go: GoFn
  state: CiecBlockStatus
}

const MODAL_SHOWN_KEY = 'ciec-invalid-modal-shown'

const COPY: Record<CiecBlockStatus, { icon: typeof AlertCircle; title: string; body: string }> = {
  unverified: {
    icon: Clock,
    title: 'Estamos validando tu CIEC',
    body: 'Tu contraseña CIEC (SAT) se está validando y esto puede tardar un poco. No es algo que tengas que arreglar: en cuanto termine, esta sección se desbloquea sola.',
  },
  invalid: {
    icon: AlertCircle,
    title: 'Tu CIEC es inválida',
    body: 'El SAT rechazó tu contraseña CIEC. Actualízala para poder seguir usando esta sección.',
  },
}

/** Bloqueo por CiecState 0/2 en las pantallas que exigen conexión vigente (D1). */
export function CiecBlockedScreen({ go, state }: Props) {
  const { selectedRfc } = useRfcStore()
  const [modalOpen, setModalOpen] = useState(false)
  const { icon: Icon, title, body } = COPY[state]

  // D4: el modal empuja una vez por sesión; el resto del tiempo insiste el banner fijo.
  useEffect(() => {
    if (state !== 'invalid') return
    try {
      if (sessionStorage.getItem(MODAL_SHOWN_KEY)) return
      sessionStorage.setItem(MODAL_SHOWN_KEY, '1')
    } catch {
      // almacenamiento no disponible: igual abrimos el modal esta vez
    }
    setModalOpen(true)
  }, [state])

  return (
    <div className="flex flex-col gap-5 w-full">
      <div
        className="rounded-3xl p-6 lg:p-8 w-full"
        style={{ background: 'var(--hero-info)', border: '1px solid var(--hero-info-border)' }}
      >
        <div className="max-w-2xl">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'var(--hero-info-icon-bg)' }}
          >
            <Icon color="#fff" size={24} />
          </div>
          <div className="text-[26px] lg:text-[32px] font-extrabold tracking-tight leading-tight mt-3" style={DISPLAY}>
            {title}
          </div>
          <div className="text-[14px] mt-2 leading-relaxed" style={{ color: 'var(--ink-700)' }}>
            {body}
          </div>
          {state === 'invalid' && (
            <div className="mt-5">
              <Btn kind="brand" size="lg" onClick={() => setModalOpen(true)}>
                <Zap size={18} /> Actualizar mi CIEC
              </Btn>
            </div>
          )}
        </div>
      </div>

      {state === 'invalid' && selectedRfc && (
        <CiecUpdateModal isOpen={modalOpen} onClose={() => setModalOpen(false)} rfc={selectedRfc} />
      )}
    </div>
  )
}
