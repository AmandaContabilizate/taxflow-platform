'use client'

import { useEffect, useState } from 'react'
import { Stethoscope, FileText, FilePlus, FolderLock, FilePlus2, Gem, ArrowRight } from 'lucide-react'
import { useHasRfc, useRfcStore } from '@/features/taxpayers/stores/rfcStore'
import { getFiscalScore } from '@/features/declarations/actions/getFiscalScore.action'
import { MONO } from '../constants'
import type { GoFn } from '../types'
import { Card, HelpBox } from '../ui'
import { NeedsSatConnect } from './needs-sat-connect'
import type { FiscalScore } from '@/features/declarations/types'

interface Props {
  go: GoFn
}

export function VistaFiscalScreen({ go }: Props) {
  const { hasRfc, loading } = useHasRfc()
  const { selectedRfcInfo, selectedRfc } = useRfcStore()
  const [score, setScore] = useState<FiscalScore | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!selectedRfc) return
    let cancelled = false
    setLoadingData(true)
    void (async () => {
      try {
        const scoreRes = await getFiscalScore(selectedRfc)
        if (!cancelled) {
          setScore(scoreRes.success ? scoreRes.value : null)
          setLoadingData(false)
        }
      } catch (e) {
        if (!cancelled) {
          setLoadingData(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedRfc])

  if (loading) return null
  if (!hasRfc) return <NeedsSatConnect go={go} feature="acceder a tu vista fiscal" />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Columna izquierda */}
        <div className="flex-1 flex flex-col gap-6">
          {selectedRfcInfo && (
            <div className="rounded-3xl p-6 lg:p-7 flex items-start justify-between" style={{ background: 'var(--hero-brand-soft)', border: '1px solid var(--brand-200)' }}>
              <div className="flex-1">
                <div className="text-[11px] font-extrabold uppercase tracking-wider mb-2" style={{ color: 'var(--brand-700)' }}>
                  Tu régimen fiscal
                </div>
                <div className="text-[32px] font-extrabold tracking-tight" style={{ color: 'var(--ink-900)' }}>
                  {selectedRfcInfo.legalName}
                </div>
                <div className="text-[13.5px] mt-2 mb-1" style={{ color: 'var(--ink-600)' }}>
                  {(selectedRfcInfo as any).regimen && (
                    <div>{(selectedRfcInfo as any).regimen}</div>
                  )}
                </div>
                <div className="text-[13.5px]" style={{ ...MONO, color: 'var(--ink-600)' }}>
                  {selectedRfcInfo.rfc}
                </div>
              </div>
              {selectedRfcInfo.status69B && (
                <div className="text-[12px] font-semibold px-3 py-1.5 rounded-full" style={{ background: 'var(--brand-50)', color: 'var(--brand-700)' }}>
                  ✓ Todo en orden
                </div>
              )}
            </div>
          )}

          <HelpBox>
            Tu vida fiscal centralizada. Accede a todas tus herramientas de gestión fiscal desde un solo lugar.
          </HelpBox>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <button
                onClick={() => go('diagnostico')}
                className="w-full p-6 text-left hover:opacity-80 transition"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'var(--brand-50)', color: 'var(--brand-700)' }}>
                  <Stethoscope size={24} />
                </div>
                <div className="font-bold text-[15px]" style={{ color: 'var(--ink-900)' }}>
                  Diagnóstico
                </div>
                <div className="text-[13px] mt-1" style={{ color: 'var(--ink-500)' }}>
                  Tu situación fiscal
                </div>
              </button>
            </Card>

            <Card>
              <button
                onClick={() => go('declaraciones')}
                className="w-full p-6 text-left hover:opacity-80 transition"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'var(--amber-soft)', color: '#7B5312' }}>
                  <FileText size={24} />
                </div>
                <div className="font-bold text-[15px]" style={{ color: 'var(--ink-900)' }}>
                  Declaraciones
                </div>
                <div className="text-[13px] mt-1" style={{ color: 'var(--ink-500)' }}>
                  Tus impuestos del mes
                </div>
              </button>
            </Card>

            <Card>
              <button
                onClick={() => go('facturas')}
                className="w-full p-6 text-left hover:opacity-80 transition"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: '#1e293b', color: '#fff' }}>
                  <FilePlus size={24} />
                </div>
                <div className="font-bold text-[15px]" style={{ color: 'var(--ink-900)' }}>
                  Facturación
                </div>
                <div className="text-[13px] mt-1" style={{ color: 'var(--ink-500)' }}>
                  Emite y revisa facturas
                </div>
              </button>
            </Card>

            <Card>
              <button
                onClick={() => go('documentos')}
                className="w-full p-6 text-left hover:opacity-80 transition"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'var(--sky-soft)', color: '#1C4C96' }}>
                  <FolderLock size={24} />
                </div>
                <div className="font-bold text-[15px]" style={{ color: 'var(--ink-900)' }}>
                  Bóveda
                </div>
                <div className="text-[13px] mt-1" style={{ color: 'var(--ink-500)' }}>
                  Tu bóveda digital de CFDI
                </div>
              </button>
            </Card>

            <Card>
              <button
                onClick={() => go('tramites')}
                className="w-full p-6 text-left hover:opacity-80 transition"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'var(--coral-soft)', color: '#9E3A15' }}>
                  <FilePlus2 size={24} />
                </div>
                <div className="font-bold text-[15px]" style={{ color: 'var(--ink-900)' }}>
                  Trámites
                </div>
                <div className="text-[13px] mt-1" style={{ color: 'var(--ink-500)' }}>
                  Servicios extra
                </div>
              </button>
            </Card>

            <Card>
              <button
                onClick={() => go('plan')}
                className="w-full p-6 text-left hover:opacity-80 transition"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'var(--violet-soft)', color: '#5A4DCC' }}>
                  <Gem size={24} />
                </div>
                <div className="font-bold text-[15px]" style={{ color: 'var(--ink-900)' }}>
                  Mi plan
                </div>
                <div className="text-[13px] mt-1" style={{ color: 'var(--ink-500)' }}>
                  Tu suscripción
                </div>
              </button>
            </Card>
          </div>
        </div>

        {/* Columna derecha - Score Fiscal */}
        {score && !loadingData && (
          <div className="w-full lg:w-[360px] flex-shrink-0">
            <div
              className="rounded-3xl p-6 lg:p-7 text-white"
              style={{ background: 'linear-gradient(155deg,#1E1952 0%,#15113F 100%)', boxShadow: 'var(--sh-ink)' }}
            >
              {selectedRfcInfo?.status69B && (
                <div className="text-[12px] font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 mb-4" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981' }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
                  SAT sincronizado
                </div>
              )}

              <div className="flex items-start gap-4 mb-6">
                <div className="relative w-24 h-24 flex-shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#10DA92"
                      strokeWidth="8"
                      strokeDasharray={`${(score.score / 100) * 282.7} 282.7`}
                      strokeLinecap="round"
                      style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-[28px] font-extrabold">{Math.round(score.score)}</div>
                    <div className="text-[10px]">/100</div>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    Tu score fiscal
                  </div>
                  <div className="text-[24px] font-extrabold tracking-tight">
                    {score.score >= 75 ? 'Muy bueno' : score.score >= 50 ? 'Bueno' : score.score >= 25 ? 'Regular' : 'Crítico'}
                  </div>
                  <div className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    {score.pending > 0 ? `Suma +19 pts regularizando ${score.pending} declaraciones pendientes.` : 'Todo está en orden'}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }} className="pt-4">
                <div className="text-[11px] font-extrabold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Tu acción de hoy
                </div>
                <div className="text-[16px] font-extrabold mb-1">
                  {score.pending > 0 ? 'Regulariza tus declaraciones pendientes' : 'Todo en orden'}
                </div>
                <div className="text-[13px] mb-4" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {score.pending > 0 ? `Tienes ${score.pending} de ${score.total} declaraciones sin presentar.` : 'No hay acciones pendientes'}
                </div>
                {score.pending > 0 && (
                  <button
                    onClick={() => go('declaraciones')}
                    className="w-full px-4 py-2.5 rounded-full font-bold text-[14px] flex items-center justify-center gap-2 transition hover:opacity-90"
                    style={{ background: '#fff', color: 'var(--ink-900)' }}
                  >
                    Ver detalle
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
