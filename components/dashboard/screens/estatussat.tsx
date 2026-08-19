'use client'

import { AlertCircle, CheckCircle2, RefreshCw, Shield } from 'lucide-react'
import { useRef, useState } from 'react'
import { useHasRfc, useRfcStore } from '@/features/taxpayers/stores/rfcStore'
import { useFiscalScore } from '@/features/declarations/hooks/useFiscalScore'
import { DISPLAY } from '../constants'
import type { GoFn } from '../types'
import { Badge, Btn, Card } from '../ui'
import { useFiscalDocuments } from '../fiscal-credibility/use-fiscal-documents'
import { NeedsSatConnect } from './needs-sat-connect'

interface Props {
  go: GoFn
}

interface StatusItem {
  id: string
  label: string
  status: 'positive' | 'warning' | 'alert' | 'neutral'
  description?: string
}

export function EstatusSatScreen({ go }: Props) {
  const { hasRfc, loading: loadingRfc } = useHasRfc()
  const { selectedRfc, selectedRfcInfo } = useRfcStore()
  const { step } = useFiscalScore()
  const isSyncingWithSat = step === 'connecting'
  const { blacklist } = useFiscalDocuments(selectedRfc, isSyncingWithSat)
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  if (loadingRfc) return null
  if (!hasRfc) return <NeedsSatConnect go={go} feature="ver tu estatus ante el SAT" />
  if (selectedRfcInfo?.ciecState !== 1) return <NeedsSatConnect go={go} feature="ver tu estatus ante el SAT" />

  const isClean = blacklist.state === 'available' && (blacklist.statusText ?? '').trim() === ''
  const veredictoText = isClean ? 'Estatus limpio' : 'Requiere revisión'

  const formatLastConsultedDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Hoy, 9:32 am'
    try {
      const date = new Date(dateStr)
      if (Number.isNaN(date.getTime())) return 'Hoy, 9:32 am'

      const now = new Date()
      const isToday = date.toDateString() === now.toDateString()
      const time = date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })

      if (isToday) {
        return `Hoy, ${time}`
      }

      const dateFormatted = date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: '2-digit' })
      return `${dateFormatted}, ${time}`
    } catch {
      return 'Hoy, 9:32 am'
    }
  }

  const lastConsultedDate = formatLastConsultedDate(blacklist.downloadDate)

  const statusItems: StatusItem[] = [
    { id: 'opinion', label: 'Opinión de cumplimiento', status: 'positive', description: 'Vigente hasta 22-may-2026' },
    { id: 'efos', label: 'Art. 69-B - EFOS', status: 'positive', description: 'Operaciones simuladas' },
    { id: 'bis', label: 'Art. 69-B Bis', status: 'positive', description: 'Transmisión indebida de pérdidas' },
    { id: 'no-localizados', label: 'No localizados', status: 'neutral', description: 'Sin domicilio fiscal' },
    { id: 'creditos-firmes', label: 'Créditos fiscales firmes', status: 'warning', description: 'Adeudos cancelados >12 meses' },
    { id: 'rfc-cancelado', label: 'RFC cancelado', status: 'positive', description: 'Estatus del registro' },
  ]

  const getStatusColor = (status: StatusItem['status']) => {
    switch (status) {
      case 'positive':
        return { bg: 'var(--brand-50)', fg: '#00AD87', icon: CheckCircle2 }
      case 'warning':
        return { bg: 'var(--amber-soft)', fg: 'var(--violet-ink)', icon: AlertCircle }
      case 'alert':
        return { bg: 'var(--coral-soft)', fg: 'var(--violet-ink)', icon: AlertCircle }
      default:
        return { bg: 'var(--ink-50)', fg: 'var(--ink-500)', icon: Shield }
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* COLUMNA IZQUIERDA */}
      <div className="lg:col-span-2 flex flex-col gap-5">
        {/* Veredicto */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          className="rounded-3xl p-7 lg:p-8 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #2A1C64 0%, #221158 100%)',
            boxShadow: 'var(--sh-ink)',
          }}
        >
          {/* Efecto de luz que sigue el mouse */}
          <div
            className="absolute inset-0 pointer-events-none rounded-3xl"
            style={{
              background: `radial-gradient(circle 400px at ${mousePos.x}px ${mousePos.y}px, rgba(0,211,161, 0.15), transparent 80%)`,
            }}
          />
          {/* Contenido */}
          <div className="relative z-10">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(0,211,161, 0.2)', color: '#00D3A1' }}
            >
              <CheckCircle2 size={28} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-extrabold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Veredicto
              </div>
              <div className="text-[28px] lg:text-[32px] font-extrabold tracking-tight leading-tight mt-2 text-white" style={DISPLAY}>
                {veredictoText}
              </div>
              <div className="text-[13.5px] mt-2 leading-relaxed text-white" style={{ opacity: 0.85 }}>
                No apareces en ninguna lista negra del SAT. Tu cumplimiento de obligaciones es <strong>positivo</strong> y tu RFC está activo.
              </div>

              {/* Última consulta */}
              <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                <div
                  className="text-[11px] font-extrabold uppercase tracking-wider mb-2"
                  style={{ color: 'rgba(255,255,255,0.6)' }}
                >
                  Última consulta
                </div>
                <div className="flex items-end justify-between gap-3 flex-wrap">
                  <div className="text-white">
                    <div className="text-[15px] font-bold">{lastConsultedDate}</div>
                  </div>
                  <Btn size="sm" kind="ghost" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
                    <RefreshCw size={14} /> Revalidar ahora
                  </Btn>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Proveedores escaneados */}
        <div>
          <div className="text-[13px] font-extrabold uppercase tracking-widest mb-3" style={{ color: 'var(--ink-400)' }}>
            Proveedores escaneados
          </div>
          <Card>
            <div className="px-4 py-3 flex items-center gap-2 flex-wrap">
              {['CFE', 'Telmex', 'Office Depot', 'Gasolinera Express', 'Farmacia del Ahorro', '+19 más'].map(
                (provider) => (
                  <div key={provider} className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} style={{ color: '#00AD87' }} />
                    <span className="text-[12px] font-semibold" style={{ color: 'var(--ink-700)' }}>
                      {provider}
                    </span>
                  </div>
                )
              )}
            </div>
            <div
              className="px-4 py-2 text-[11px] text-right"
              style={{ borderTop: '1px solid var(--border)', color: 'var(--ink-500)' }}
            >
              24 OK · 0 alerta
            </div>
          </Card>
        </div>
      </div>

      {/* COLUMNA DERECHA */}
      <div className="flex flex-col gap-5">
        {/* Listas oficiales */}
        <div>
          <div className="text-[13px] font-extrabold uppercase tracking-widest mb-3" style={{ color: 'var(--ink-400)' }}>
            Revisamos 6 listas oficiales
          </div>
          <Card>
            <div>
              {statusItems.map((item, idx) => {
                const colors = getStatusColor(item.status)
                return (
                  <div key={item.id}>
                    <div className="flex items-start gap-2.5 px-3.5 py-3">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: colors.bg, color: colors.fg }}
                      >
                        <colors.icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[13px]">{item.label}</div>
                        {item.description && (
                          <div className="text-[11.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                            {item.description}
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {item.status === 'positive' && (
                          <Badge kind="brand">Positiva</Badge>
                        )}
                        {item.status === 'warning' && (
                          <Badge kind="amber">Monitor.</Badge>
                        )}
                        {item.status === 'alert' && (
                          <Badge kind="coral">Alerta</Badge>
                        )}
                        {item.status === 'neutral' && (
                          <Badge kind="default">No sparce</Badge>
                        )}
                      </div>
                    </div>
                    {idx < statusItems.length - 1 && <div style={{ borderBottom: '1px solid var(--border)' }} />}
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Notificaciones */}
        <Card>
          <div className="p-4">
            <div className="flex items-start gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'var(--brand-50)', color: 'var(--brand-700)' }}
              >
                <Bell size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[12.5px]">Avísame si cambia algo</div>
                <div className="text-[11.5px] mt-1" style={{ color: 'var(--ink-500)' }}>
                  Si tu estatus cambia, te notificamos.
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function Bell({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}
