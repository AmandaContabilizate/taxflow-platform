'use client'

import { AlertCircle, CheckCircle2, Shield } from 'lucide-react'
import { useRef, useState } from 'react'
import { useHasRfc, useRfcStore } from '@/features/taxpayers/stores/rfcStore'
import { useFiscalScore } from '@/features/declarations/hooks/useFiscalScore'
import { DISPLAY } from '../constants'
import type { GoFn } from '../types'
import { Badge, Card, CiecWarningBanner } from '../ui'
import { useFiscalDocuments } from '../fiscal-credibility/use-fiscal-documents'
import type { DocInfo } from '../fiscal-credibility/types'
import { getCiecBlockStatus, isConnectedByEfirmaOnly, isSatConnected } from '../sat-connection.utils'
import { CiecBlockedScreen } from './ciec-blocked'
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

/** Fecha ISO a "Hoy, 9:32 a.m." o "14 abr 26, 9:32 a.m."; null si no hay dato utilizable. */
function formatConsultedDate(dateStr?: string | null): string | null {
  if (!dateStr) return null
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return null
  const time = date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })
  if (date.toDateString() === new Date().toDateString()) return `Hoy, ${time}`
  const day = date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: '2-digit' })
  return `${day}, ${time}`
}

function opinionItem(opinion: DocInfo): StatusItem {
  const base = { id: 'opinion', label: 'Opinión de cumplimiento' }
  if (opinion.state === 'loading') return { ...base, status: 'neutral', description: 'Consultando…' }
  if (opinion.state === 'available' && opinion.hasFile === true) {
    return opinion.isStale
      ? { ...base, status: 'warning', description: 'Desactualizada' }
      : { ...base, status: 'positive', description: 'Vigente' }
  }
  if (opinion.state === 'missing' || (opinion.state === 'available' && opinion.hasFile === false)) {
    return { ...base, status: 'warning', description: 'Pendiente de descargar' }
  }
  return { ...base, status: 'neutral', description: 'No pudimos consultarla' }
}

function blacklistItem(id: string, label: string, description: string, blacklist: DocInfo): StatusItem {
  if (blacklist.state === 'loading') return { id, label, status: 'neutral', description: 'Consultando…' }
  const flag = blacklist.state === 'available' ? blacklist.inBlacklist : null
  if (flag === false) return { id, label, status: 'positive', description }
  if (flag === true) {
    const detail = (blacklist.statusText ?? '').trim()
    return { id, label, status: 'alert', description: detail ? `Aparece con estatus "${detail}"` : 'Tu RFC aparece en la lista' }
  }
  return { id, label, status: 'neutral', description: 'No pudimos consultarla' }
}

export function EstatusSatScreen({ go }: Props) {
  const { hasRfc, loading: loadingRfc } = useHasRfc()
  const { selectedRfc, selectedRfcInfo } = useRfcStore()
  const { step } = useFiscalScore()
  const isSyncingWithSat = step === 'connecting'
  const { csf, opinion, blacklist } = useFiscalDocuments(selectedRfc, isSyncingWithSat)
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
  const ciecBlock = getCiecBlockStatus(selectedRfcInfo)
  if (!isSatConnected(selectedRfcInfo) && !ciecBlock) return <NeedsSatConnect go={go} feature="ver tu estatus ante el SAT" />
  if (ciecBlock === 'invalid') return <CiecBlockedScreen go={go} state="invalid" />

  const blacklistFlag = blacklist.state === 'available' ? blacklist.inBlacklist : null
  const isClean = blacklistFlag === false
  const isFlagged = blacklistFlag === true
  const isChecking = blacklist.state === 'loading'

  const veredictoText = isChecking
    ? 'Consultando…'
    : isClean
      ? 'Estatus limpio'
      : isFlagged
        ? 'Requiere revisión'
        : 'Sin verificar'

  const veredictoDesc = isChecking
    ? 'Estamos consultando tu estatus ante el SAT.'
    : isClean
      ? 'Tu RFC no aparece en las listas del artículo 69-B del SAT.'
      : isFlagged
        ? 'Tu RFC aparece en las listas del artículo 69-B del SAT. Revisa tu situación.'
        : 'No pudimos consultar tu estatus en las listas del artículo 69-B del SAT.'

  const VeredictoIcon = isClean ? CheckCircle2 : isFlagged ? AlertCircle : Shield

  // Unica fecha real disponible: cuando bajamos la opinion o la constancia.
  const lastConsultedDate = formatConsultedDate(opinion.downloadDate ?? csf.downloadDate)

  const statusItems: StatusItem[] = [
    opinionItem(opinion),
    blacklistItem('efos', 'Art. 69-B - EFOS', 'Operaciones simuladas', blacklist),
    blacklistItem('bis', 'Art. 69-B Bis', 'Transmisión indebida de pérdidas', blacklist),
    {
      id: 'rfc',
      label: 'RFC',
      status: blacklist.state === 'available' ? 'positive' : 'neutral',
      description:
        blacklist.state === 'available'
          ? 'Estatus del registro'
          : blacklist.state === 'loading'
            ? 'Consultando…'
            : 'No pudimos consultarlo',
    },
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
    <div className="flex flex-col gap-6">
      {ciecBlock === 'unverified' && <CiecWarningBanner go={go} variant="unverified" />}
      {isConnectedByEfirmaOnly(selectedRfcInfo) && <CiecWarningBanner go={go} variant="efirma" />}
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
              style={
                isClean
                  ? { background: 'rgba(0,211,161, 0.2)', color: '#00D3A1' }
                  : { background: 'rgba(255,255,255, 0.12)', color: 'rgba(255,255,255,0.85)' }
              }
            >
              <VeredictoIcon size={28} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-extrabold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Veredicto
              </div>
              <div className="text-[28px] lg:text-[32px] font-extrabold tracking-tight leading-tight mt-2 text-white" style={DISPLAY}>
                {veredictoText}
              </div>
              <div className="text-[13.5px] mt-2 leading-relaxed text-white" style={{ opacity: 0.85 }}>
                {veredictoDesc}
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
                    <div className="text-[15px] font-bold">{lastConsultedDate ?? 'Sin consultas recientes'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>

      </div>

      {/* COLUMNA DERECHA */}
      <div className="flex flex-col gap-5">
        {/* Listas oficiales */}
        <div>
          <div className="text-[13px] font-extrabold uppercase tracking-widest mb-3" style={{ color: 'var(--ink-400)' }}>
            Revisamos {statusItems.length} listas oficiales
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
                          <Badge kind="amber">Revisar</Badge>
                        )}
                        {item.status === 'alert' && (
                          <Badge kind="coral">Alerta</Badge>
                        )}
                        {item.status === 'neutral' && (
                          <Badge kind="default">Sin dato</Badge>
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
