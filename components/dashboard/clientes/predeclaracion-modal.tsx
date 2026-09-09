'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Download, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getPredeclaracion } from '@/features/operations/actions/getPredeclaracion.action'
import type { DeclarationGeneral } from '@/features/operations/types'
import { DISPLAY, MONO } from '../constants'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Declaración a mostrar; null cuando el modal está cerrado. */
  declarationId: number | null
}

const PRESENTADA_STATUS = [3, 5, 7, 8]

function fmtMoney(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  return v.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
}

/** Reporte de predeclaración (solo lectura) para SAC / Renovaciones. */
export function PredeclaracionModal({ open, onOpenChange, declarationId }: Props) {
  const [data, setData] = useState<DeclarationGeneral | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !declarationId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    setData(null)
    getPredeclaracion(declarationId).then((res) => {
      if (cancelled) return
      if (res.success) setData(res.value)
      else setError(res.error.message)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [open, declarationId])

  const presentada = data ? PRESENTADA_STATUS.includes(data.statusId) : false

  const montos: { label: string; value: number | null }[] = data
    ? [
        { label: 'Ingresos brutos', value: data.ingresosBrutos },
        { label: 'Gastos deducibles', value: data.gastosDeducibles },
        { label: 'ISR calculado', value: data.isrCalculado },
        { label: 'IVA a cargo', value: data.ivaCargo },
        { label: 'IVA a favor', value: data.ivaFavor },
      ]
    : []

  const pdfs: { label: string; url: string | null }[] = data
    ? [
        { label: 'Acuse de declaración', url: data.acknowledgmentPdfUrl },
        { label: 'Línea de captura', url: data.paymentLinePdfUrl },
        { label: 'Acuse de pago', url: data.paymentAcknowledgmentPdfUrl },
      ]
    : []
  const pdfsDisponibles = pdfs.filter((p) => p.url)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle style={DISPLAY}>Reporte de predeclaración</DialogTitle>
          <DialogDescription>
            {data && (
              <>
                {data.periodo} {data.fiscalYear} ·{' '}
                {data.regimeSatCode ? `${data.regimeSatCode} ${data.regimeName ?? ''}` : (data.regimeName ?? 'Sin régimen')} ·{' '}
                <code style={{ ...MONO, fontSize: '12px' }}>{data.rfc}</code>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={16} className="animate-spin" /> Cargando reporte…
          </div>
        ) : error ? (
          <div className="py-8 text-center flex flex-col items-center gap-2">
            <AlertCircle size={18} style={{ color: 'var(--violet-ink)' }} />
            <div className="text-[13px]" style={{ color: 'var(--ink-700)' }}>{error}</div>
          </div>
        ) : data ? (
          <div className="flex flex-col gap-4">
            {/* Estatus */}
            <div
              className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full text-[12.5px] font-bold"
              style={
                presentada
                  ? { background: 'var(--brand-100)', color: 'var(--brand-900)' }
                  : { background: 'var(--amber-soft)', color: 'var(--violet-ink)' }
              }
            >
              {data.statusDescription}
            </div>

            {/* Montos */}
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
              {montos.map((m) => (
                <div
                  key={m.label}
                  className="rounded-xl px-3.5 py-3"
                  style={{ background: 'var(--ink-50)', border: '1px solid var(--border)' }}
                >
                  <div className="text-[11.5px]" style={{ color: 'var(--ink-500)' }}>{m.label}</div>
                  <div className="text-[15px] font-extrabold mt-0.5" style={{ color: 'var(--ink-900)' }}>
                    {fmtMoney(m.value)}
                  </div>
                </div>
              ))}
            </div>

            {/* PDFs */}
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: 'var(--ink-400)' }}>
                Documentos
              </div>
              {pdfsDisponibles.length === 0 ? (
                <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
                  Aún no hay documentos disponibles para este periodo.
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {pdfsDisponibles.map((p) => (
                    <a
                      key={p.label}
                      href={p.url as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold transition hover:opacity-90"
                      style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--ink-900)' }}
                    >
                      <Download size={14} style={{ color: 'var(--brand-700)' }} /> {p.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
