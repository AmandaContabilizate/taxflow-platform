'use client'

import { UserPlus, Loader2, Check, TrendingUp } from 'lucide-react'
import { RFCSelector } from './rfc-selector'
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
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(245, 176, 55, 0.1)', color: '#7B5312' }}>
            <Loader2 size={16} className="animate-spin" />
            <span className="text-[12px] font-medium whitespace-nowrap">
              {step === 'connecting' ? 'Conectando con el SAT…' : step === 'checking' ? 'Comprobando con el SAT…' : 'Diagnóstico en proceso…'}
            </span>
          </div>
        ) : null}

        {/* Mensaje de éxito cuando termina */}
        {score && !score.isReconciling && step === 'ready' && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl h-10 animate-in fade-in slide-in-from-left-4 duration-300" style={{ background: 'white', border: '1px solid #e5e7eb', whiteSpace: 'nowrap', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
            <TrendingUp size={16} style={{ color: '#10B981', flexShrink: 0 }} />
            <div className="text-[12px] font-bold" style={{ color: '#059669' }}>
              Diagnóstico actualizado
            </div>
            <Check size={16} style={{ color: '#0369a1', flexShrink: 0, strokeWidth: 3 }} />
          </div>
        )}

        <RFCSelector />
      </div>

      {/* Botón agregar RFC */}
      <button
        onClick={() => go?.('estatus-sat')}
        className="rounded-full flex items-center justify-center transition-all duration-200 hover:shadow-lg"
        style={{
          width: '44px',
          height: '44px',
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(229, 231, 235, 0.8)',
          color: '#10B981',
          backdropFilter: 'blur(10px)',
        }}
        title="Agregar RFC"
      >
        <UserPlus size={22} />
      </button>
    </div>
  )
}
