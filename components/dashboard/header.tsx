'use client'

import { UserPlus, Loader2, Check, TrendingUp } from 'lucide-react'
import { RFCSelector } from './rfc-selector'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { useFiscalScore } from '@/features/declarations/hooks/useFiscalScore'
import type { GoFn } from './types'

interface DashboardHeaderProps {
  go?: GoFn
}

export function DashboardHeader({ go }: DashboardHeaderProps) {
  const { score, step } = useFiscalScore()

  return (
    <div className="flex items-center justify-between gap-4 w-full">
      {/* Selector RFC */}
      <div className="flex items-center gap-3">
        {/* Indicador de diagnóstico en proceso */}
        {score?.isReconciling || step === 'connecting' || step === 'checking' ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(115,57,253, 0.1)', color: 'var(--violet-ink)' }}>
            <Loader2 size={16} className="animate-spin" />
            <span className="text-[12px] font-medium whitespace-nowrap">
              {step === 'connecting' ? 'Conectando con el SAT…' : step === 'checking' ? 'Comprobando con el SAT…' : 'Diagnóstico en proceso…'}
            </span>
          </div>
        ) : null}

        {/* Mensaje de éxito cuando termina */}
        {score && !score.isReconciling && step === 'ready' && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl h-10 animate-in fade-in slide-in-from-left-4 duration-300" style={{ background: 'white', border: '1px solid #E7E4F4', whiteSpace: 'nowrap', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
            <TrendingUp size={16} style={{ color: '#00AD87', flexShrink: 0 }} />
            <div className="text-[12px] font-bold" style={{ color: '#00AD87' }}>
              Diagnóstico actualizado
            </div>
            <Check size={16} style={{ color: 'var(--violet-ink)', flexShrink: 0, strokeWidth: 3 }} />
          </div>
        )}

        <RFCSelector />
      </div>

      {/* Acciones del Header: Notificaciones y Agregar RFC */}
      <div className="flex items-center gap-2">
        <NotificationBell />

        <button
          onClick={() => go?.('estatus-sat')}
          className="rounded-full flex items-center justify-center transition-all duration-200 hover:shadow-lg"
          style={{
            width: '44px',
            height: '44px',
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(231,228,244, 0.8)',
            color: '#00AD87',
            backdropFilter: 'blur(10px)',
          }}
          title="Agregar RFC"
        >
          <UserPlus size={22} />
        </button>
      </div>
    </div>
  )
}
