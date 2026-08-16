'use client'

import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRfcStore } from '@/features/taxpayers/stores/rfcStore'
import type { Result } from '@/lib/common'
import { DISPLAY } from '../constants'
import { Card, ErrorState } from '../ui'

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export function monthYear(fiscalYear: number, month: number): string {
  return `${MONTHS[month - 1] ?? ''} ${fiscalYear}`.trim()
}

export function fmtDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

type Fetcher<T> = (rfc: string) => Promise<Result<T, { message: string }>>

export type Async<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; message: string }

// Carga un recurso ligado al RFC activo. El fetcher debe ser estable (acción a nivel módulo).
export function useRfcResource<T>(fetcher: Fetcher<T>): Async<T> {
  const { selectedRfc } = useRfcStore()
  const [state, setState] = useState<Async<T>>({ status: 'loading' })

  useEffect(() => {
    if (!selectedRfc) return
    let cancelled = false
    setState({ status: 'loading' })
    void (async () => {
      const res = await fetcher(selectedRfc)
      if (cancelled) return
      setState(
        res.success
          ? { status: 'ready', data: res.value }
          : { status: 'error', message: res.error.message },
      )
    })()
    return () => {
      cancelled = true
    }
  }, [selectedRfc, fetcher])

  return state
}

export function TabLoading({ label }: { label: string }) {
  return (
    <Card>
      <div className="px-5 py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
        <Loader2 size={18} className="animate-spin" /> {label}
      </div>
    </Card>
  )
}

export function TabError({ message }: { message: string }) {
  return (
    <Card>
      <ErrorState message={message} />
    </Card>
  )
}

export function TabEmpty({ message }: { message: string }) {
  return (
    <Card>
      <div className="text-center py-10">
        <div style={{ color: 'var(--ink-500)' }}>{message}</div>
      </div>
    </Card>
  )
}

// Tile para heroes de fondo oscuro (texto blanco).
export function HeroTile({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className="rounded-2xl p-3"
      style={{
        background: highlight ? 'rgba(255,214,107,0.18)' : 'rgba(255,255,255,0.10)',
        border: highlight ? '1px solid rgba(255,214,107,0.45)' : '1px solid rgba(255,255,255,0.18)',
      }}
    >
      <div className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.75)' }}>
        {label}
      </div>
      <div className="text-[18px] font-extrabold mt-1" style={DISPLAY}>
        {value}
      </div>
    </div>
  )
}
