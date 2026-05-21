'use client'

import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  ShieldCheck,
  Upload,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { getComplianceOpinion } from '@/features/taxpayers/actions/getComplianceOpinion.action'
import { getRfcStatus } from '@/features/taxpayers/actions/getRfcStatus.action'
import { getTaxCertificate, type PdfDocument, } from '@/features/taxpayers/actions/getTaxCertificate.action'
import { useRfcStore } from '@/features/taxpayers/stores/rfcStore'
import { DISPLAY } from './constants'
import type { GoFn } from './types'
import { Btn } from './ui'

type DocState = 'loading' | 'available' | 'missing' | 'rfc-not-found' | 'error'

interface DocInfo {
  state: DocState
  errorMessage?: string
}

function classifyError(statusCode: number, message: string): DocState {
  if (statusCode === 404) return 'missing'
  if (/taxpayer with rfc .* not found/i.test(message) || /rfc .* not found/i.test(message)) {
    return 'rfc-not-found'
  }
  return 'error'
}

function downloadPdf(doc: PdfDocument) {
  const byteChars = atob(doc.base64)
  const bytes = new Uint8Array(byteChars.length)
  for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i)
  const blob = new Blob([bytes], { type: doc.contentType || 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = doc.filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

interface Props {
  go: GoFn
}

export function FiscalCredibility({ go }: Props) {
  const { selectedRfc } = useRfcStore()

  const [csf, setCsf] = useState<DocInfo>({ state: 'loading' })
  const [opinion, setOpinion] = useState<DocInfo>({ state: 'loading' })
  const [blacklist, setBlacklist] = useState<DocInfo>({ state: 'loading' })
  const [downloading, setDownloading] = useState<null | 'csf' | 'opinion'>(null)

  useEffect(() => {
    if (!selectedRfc) return
    let cancelled = false

    setCsf({ state: 'loading' })
    setOpinion({ state: 'loading' })
    setBlacklist({ state: 'loading' })

    void (async () => {
      const [csfRes, opRes, statusRes] = await Promise.all([
        getTaxCertificate(selectedRfc),
        getComplianceOpinion(selectedRfc),
        getRfcStatus(selectedRfc),
      ])
      if (cancelled) return
      setCsf(
        csfRes.success
          ? { state: 'available' }
          : { state: classifyError(csfRes.error.statusCode, csfRes.error.message), errorMessage: csfRes.error.message },
      )
      setOpinion(
        opRes.success
          ? { state: 'available' }
          : { state: classifyError(opRes.error.statusCode, opRes.error.message), errorMessage: opRes.error.message },
      )
      setBlacklist(
        statusRes.success
          ? { state: 'available' }
          : { state: classifyError(statusRes.error.statusCode, statusRes.error.message), errorMessage: statusRes.error.message },
      )
    })()

    return () => {
      cancelled = true
    }
  }, [selectedRfc])

  const handleDownloadCsf = useCallback(async () => {
    if (!selectedRfc) return
    setDownloading('csf')
    const res = await getTaxCertificate(selectedRfc)
    setDownloading(null)
    if (res.success) downloadPdf(res.value)
  }, [selectedRfc])

  const handleDownloadOpinion = useCallback(async () => {
    if (!selectedRfc) return
    setDownloading('opinion')
    const res = await getComplianceOpinion(selectedRfc)
    setDownloading(null)
    if (res.success) downloadPdf(res.value)
  }, [selectedRfc])

  const csfMissing = csf.state === 'missing'
  const csfErrored = csf.state === 'error'
  const rfcNotFound =
    csf.state === 'rfc-not-found' ||
    opinion.state === 'rfc-not-found' ||
    blacklist.state === 'rfc-not-found'
  const allBlocked = csfMissing

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-1">
        <div>
          <div className="text-[20px] font-extrabold" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
            Tu credibilidad fiscal
          </div>
          <div className="text-[13.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
            Los documentos oficiales que te respaldan
          </div>
        </div>
        {csfMissing && (
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-bold"
            style={{
              background: 'var(--hero-info)',
              color: 'var(--ink-700)',
              border: '1px solid var(--hero-info-border)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-500)' }} />
            Falta tu CSF
          </div>
        )}
        {csfErrored && (
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-bold"
            style={{
              background: 'var(--hero-amber)',
              color: '#7B5312',
              border: '1px solid var(--hero-amber-border)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#B8862C' }} />
            Servicio en pruebas
          </div>
        )}
        {rfcNotFound && !csfMissing && !csfErrored && (
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-bold"
            style={{
              background: 'var(--coral-soft)',
              color: '#9E3A15',
              border: '1px solid var(--coral-soft-border, rgba(158,58,21,0.18))',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#9E3A15' }} />
            RFC no encontrado
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <CsfCard
          state={csf.state}
          downloading={downloading === 'csf'}
          onConnect={() => go('estatus-sat')}
          onUpload={() => go('documentos')}
          onDownload={handleDownloadCsf}
        />
        <ComplianceCard
          state={opinion.state}
          blocked={allBlocked}
          downloading={downloading === 'opinion'}
          onDownload={handleDownloadOpinion}
          onConnect={() => go('estatus-sat')}
        />
        <BlacklistCard
          state={blacklist.state}
          blocked={allBlocked}
          onConnect={() => go('estatus-sat')}
        />
      </div>
    </div>
  )
}

interface DocCardShellProps {
  highlighted?: boolean
  blocked?: boolean
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  eyebrow: string
  title: string
  desc: string
  children?: React.ReactNode
  badge?: React.ReactNode
}

function DocCardShell({
  highlighted,
  blocked,
  icon,
  iconBg,
  iconColor,
  eyebrow,
  title,
  desc,
  children,
  badge,
}: DocCardShellProps) {
  return (
    <div
      className="rounded-3xl p-5 flex flex-col gap-3 relative overflow-hidden"
      style={{
        background: highlighted ? 'var(--hero-info)' : 'var(--card)',
        border: `1px solid ${highlighted ? 'var(--hero-info-border)' : 'var(--border)'
          }`,
        boxShadow: highlighted ? 'none' : 'var(--sh-1)',
        opacity: blocked ? 0.85 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>
        {badge}
      </div>
      <div>
        <div
          className="text-[11px] tracking-widest uppercase font-extrabold mb-1"
          style={{ color: 'var(--ink-500)' }}
        >
          {eyebrow}
        </div>
        <div
          className="font-extrabold text-[18px] leading-tight"
          style={{ ...DISPLAY, color: 'var(--ink-900)' }}
        >
          {title}
        </div>
        <div className="text-[13px] mt-2 leading-relaxed" style={{ color: 'var(--ink-700)' }}>
          {desc}
        </div>
      </div>
      {children && <div className="mt-2">{children}</div>}
    </div>
  )
}

function BlockedBadge() {
  return (
    <span
      className="text-[10px] tracking-widest uppercase font-extrabold px-2 py-1 rounded-md"
      style={{ background: 'var(--ink-50)', color: 'var(--ink-500)' }}
    >
      Bloqueado
    </span>
  )
}

function ReadyBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] tracking-widest uppercase font-extrabold px-2 py-1 rounded-md"
      style={{ background: 'var(--brand-50)', color: 'var(--brand-700)' }}
    >
      <CheckCircle2 size={12} /> Lista
    </span>
  )
}

function TestingBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] tracking-widest uppercase font-extrabold px-2 py-1 rounded-md"
      style={{ background: 'var(--hero-amber)', color: '#7B5312' }}
    >
      En pruebas
    </span>
  )
}

function NotFoundBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] tracking-widest uppercase font-extrabold px-2 py-1 rounded-md"
      style={{ background: 'var(--coral-soft)', color: '#9E3A15' }}
    >
      RFC no encontrado
    </span>
  )
}

interface CsfCardProps {
  state: DocState
  downloading: boolean
  onConnect: () => void
  onUpload: () => void
  onDownload: () => void
}

function CsfCard({ state, downloading, onConnect, onUpload, onDownload }: CsfCardProps) {
  const available = state === 'available'
  const errored = state === 'error'
  const notFound = state === 'rfc-not-found'

  return (
    <DocCardShell
      highlighted={state === 'missing'}
      icon={available ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
      iconBg={
        available
          ? 'var(--brand-50)'
          : notFound
            ? 'var(--coral-soft)'
            : errored
              ? 'var(--hero-amber-icon-bg)'
              : 'var(--hero-info-icon-bg)'
      }
      iconColor={
        available ? 'var(--brand-700)' : notFound ? '#9E3A15' : errored ? '#7B5312' : '#fff'
      }
      eyebrow="Constancia de Situación Fiscal"
      title={
        state === 'loading'
          ? 'Buscando…'
          : available
            ? 'La tenemos lista'
            : notFound
              ? 'No encontramos este RFC'
              : errored
                ? 'Servicio en pruebas'
                : 'Aún no la tenemos'
      }
      desc={
        available
          ? 'Tu Constancia de Situación Fiscal está vigente y disponible para descargar.'
          : notFound
            ? 'Este RFC no está registrado en tu cuenta. Verifica que sea el correcto o regístralo primero.'
            : errored
              ? 'Estamos validando este flujo con el SAT en ambiente de pruebas. Vuelve a intentarlo en unos minutos.'
              : 'Conecta tu RFC con CIEC o e.firma para que descarguemos automáticamente tu CSF y activemos el resto del análisis fiscal.'
      }
      badge={
        available ? <ReadyBadge /> : notFound ? <NotFoundBadge /> : errored ? <TestingBadge /> : undefined
      }
    >
      {state === 'loading' ? (
        <div
          className="inline-flex items-center gap-2 text-[13px] font-bold"
          style={{ color: 'var(--ink-500)' }}
        >
          <Loader2 size={16} className="animate-spin" /> Cargando…
        </div>
      ) : available ? (
        <Btn kind="brand" onClick={onDownload} disabled={downloading} block>
          {downloading ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Descargando…
            </>
          ) : (
            <>
              <Download size={18} /> Descargar CSF
            </>
          )}
        </Btn>
      ) : errored || notFound ? null : (
        <div className="flex gap-2 flex-wrap">
          <Btn kind="brand" onClick={onConnect}>
            <Zap size={18} /> Conectar al SAT
          </Btn>
          <Btn kind="ghost" onClick={onUpload}>
            <Upload size={16} /> Subir PDF
          </Btn>
        </div>
      )}
    </DocCardShell>
  )
}

interface ComplianceCardProps {
  state: DocState
  blocked: boolean
  downloading: boolean
  onDownload: () => void
  onConnect: () => void
}

function ComplianceCard({
  state,
  blocked,
  downloading,
  onDownload,
  onConnect,
}: ComplianceCardProps) {
  const available = state === 'available' && !blocked
  const errored = state === 'error' && !blocked
  const notFound = state === 'rfc-not-found' && !blocked

  return (
    <DocCardShell
      blocked={blocked}
      icon={<FileText size={22} />}
      iconBg="var(--ink-50)"
      iconColor="var(--ink-500)"
      eyebrow="Opinión de cumplimiento"
      title={
        blocked
          ? 'Falta tu CSF'
          : state === 'loading'
            ? 'Buscando…'
            : available
              ? 'Lista para descargar'
              : notFound
                ? 'No encontramos este RFC'
                : errored
                  ? 'Servicio en pruebas'
                  : 'Aún no disponible'
      }
      desc={
        blocked
          ? 'Necesitamos tu CSF para poder consultar tu opinión de cumplimiento ante el SAT.'
          : available
            ? 'Documento oficial del SAT que confirma que estás al corriente con tus obligaciones.'
            : notFound
              ? 'Este RFC no está registrado en tu cuenta. Verifica que sea el correcto o regístralo primero.'
              : errored
                ? 'Estamos validando este flujo con el SAT en ambiente de pruebas. Vuelve a intentarlo más tarde.'
                : 'Estamos consultando con el SAT. Te avisamos cuando esté disponible.'
      }
      badge={
        blocked
          ? <BlockedBadge />
          : available
            ? <ReadyBadge />
            : notFound
              ? <NotFoundBadge />
              : errored
                ? <TestingBadge />
                : undefined
      }
    >
      {blocked ? (
        <Btn kind="ghost" onClick={onConnect} block>
          <Zap size={16} /> Conectar al SAT
        </Btn>
      ) : state === 'loading' ? (
        <div
          className="inline-flex items-center gap-2 text-[13px] font-bold"
          style={{ color: 'var(--ink-500)' }}
        >
          <Loader2 size={16} className="animate-spin" /> Cargando…
        </div>
      ) : available ? (
        <Btn kind="primary" onClick={onDownload} disabled={downloading} block>
          {downloading ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Descargando…
            </>
          ) : (
            <>
              <Download size={18} /> Descargar PDF
            </>
          )}
        </Btn>
      ) : null}
    </DocCardShell>
  )
}

interface BlacklistCardProps {
  state: DocState
  blocked: boolean
  onConnect: () => void
}

function BlacklistCard({ state, blocked, onConnect }: BlacklistCardProps) {
  const available = state === 'available' && !blocked
  const errored = state === 'error' && !blocked
  const notFound = state === 'rfc-not-found' && !blocked

  return (
    <DocCardShell
      blocked={blocked}
      icon={<ShieldCheck size={22} />}
      iconBg="var(--ink-50)"
      iconColor="var(--ink-500)"
      eyebrow="Listas negras SAT"
      title={
        blocked
          ? 'Falta tu CSF'
          : state === 'loading'
            ? 'Verificando…'
            : available
              ? 'No apareces en listas'
              : notFound
                ? 'No encontramos este RFC'
                : errored
                  ? 'Servicio en pruebas'
                  : 'Sin información'
      }
      desc={
        blocked
          ? 'Necesitamos tu CSF para revisar si apareces en las listas del 69-B del SAT.'
          : available
            ? 'Tu RFC no aparece en las listas del artículo 69-B del SAT. Estás al corriente.'
            : notFound
              ? 'Este RFC no está registrado en tu cuenta. Verifica que sea el correcto o regístralo primero.'
              : errored
                ? 'Estamos validando este flujo con el SAT en ambiente de pruebas. Vuelve a intentarlo más tarde.'
                : 'Aún no podemos validar tu estatus en las listas negras del SAT.'
      }
      badge={
        blocked
          ? <BlockedBadge />
          : available
            ? <ReadyBadge />
            : notFound
              ? <NotFoundBadge />
              : errored
                ? <TestingBadge />
                : undefined
      }
    >
      {blocked && (
        <Btn kind="ghost" onClick={onConnect} block>
          <Zap size={16} /> Conectar al SAT
        </Btn>
      )}
    </DocCardShell>
  )
}
