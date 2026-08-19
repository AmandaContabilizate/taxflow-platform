'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Loader2, Tag } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getRegimeActivities } from '@/features/taxpayers/actions/regimeActivities.action'
import { setRegimeActivityActive } from '@/features/taxpayers/actions/regimeActivities.action'
import type { ClientListItem, RegimeActivityMatrixItem } from '@/features/taxpayers/types'
import { DISPLAY, MONO } from '../constants'

interface ActividadesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Cliente cuyo régimen se administra; null cuando el modal está cerrado. */
  client: ClientListItem | null
}

/**
 * Actividades económicas por régimen del contribuyente (gerencia de contabilidad).
 * La matriz sale de la última CSF leída; activar/desactivar decide qué actividad
 * cuenta en cada régimen cuando hay más de uno activo.
 */
export function ActividadesModal({ open, onOpenChange, client }: ActividadesModalProps) {
  const [matrix, setMatrix] = useState<RegimeActivityMatrixItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** Par régimen-actividad que está guardando ahora mismo. */
  const [saving, setSaving] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !client) return
    let cancelled = false
    setLoading(true)
    setError(null)
    setSaveError(null)
    setMatrix([])
    getRegimeActivities(client.rfc).then((res) => {
      if (cancelled) return
      if (res.success) setMatrix(res.value)
      else setError(res.error.message)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [open, client])

  // Matriz agrupada por régimen, en el orden en que llega del backend.
  const regimenes = useMemo(() => {
    const map = new Map<number, { regimeName: string; items: RegimeActivityMatrixItem[] }>()
    for (const item of matrix) {
      const g = map.get(item.regimeId)
      if (g) g.items.push(item)
      else map.set(item.regimeId, { regimeName: item.regimeName, items: [item] })
    }
    return Array.from(map.entries()).map(([regimeId, g]) => ({ regimeId, ...g }))
  }, [matrix])

  async function toggle(item: RegimeActivityMatrixItem) {
    if (!client || saving) return
    const key = `${item.regimeId}-${item.activityId}`
    const next = !item.isActive
    setSaving(key)
    setSaveError(null)
    // Optimista: se revierte si el backend rechaza.
    setMatrix((prev) =>
      prev.map((m) =>
        m.regimeId === item.regimeId && m.activityId === item.activityId
          ? { ...m, isActive: next }
          : m,
      ),
    )
    const res = await setRegimeActivityActive(client.rfc, item.regimeId, item.activityId, next)
    setSaving(null)
    if (!res.success) {
      setMatrix((prev) =>
        prev.map((m) =>
          m.regimeId === item.regimeId && m.activityId === item.activityId
            ? { ...m, isActive: item.isActive }
            : m,
        ),
      )
      setSaveError(res.error.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle style={DISPLAY}>Actividades económicas</DialogTitle>
          <DialogDescription>
            {client && (
              <>
                {client.legalName} · <code style={{ ...MONO, fontSize: '12px' }}>{client.rfc}</code>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div
          className="flex items-start gap-2 p-3 rounded-xl text-[12.5px]"
          style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)' }}
        >
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          <span>
            Las actividades vienen de la última CSF leída. Activar o desactivar aquí decide qué
            actividad cuenta en cada régimen — <b>sobreescribe</b> lo detectado automáticamente.
          </span>
        </div>

        {loading ? (
          <div className="py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={16} className="animate-spin" /> Cargando actividades…
          </div>
        ) : error ? (
          <div className="py-8 text-center flex flex-col items-center gap-2">
            <AlertCircle size={18} style={{ color: 'var(--violet-ink)' }} />
            <div className="text-[13px]" style={{ color: 'var(--ink-700)' }}>{error}</div>
          </div>
        ) : regimenes.length === 0 ? (
          <div className="py-8 text-center text-[13px]" style={{ color: 'var(--ink-500)' }}>
            Este contribuyente no tiene regímenes con actividades registradas.
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-h-[46vh] overflow-y-auto pr-1">
            {regimenes.map((reg) => (
              <div key={reg.regimeId}>
                <div
                  className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider mb-1.5"
                  style={{ color: 'var(--ink-400)' }}
                >
                  <Tag size={11} /> {reg.regimeName}
                </div>
                <div className="flex flex-col gap-1">
                  {reg.items.map((item) => {
                    const key = `${item.regimeId}-${item.activityId}`
                    const busy = saving === key
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggle(item)}
                        disabled={busy || saving !== null}
                        role="switch"
                        aria-checked={item.isActive}
                        className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-left cursor-pointer active:scale-[0.99] disabled:cursor-wait"
                        style={{
                          background: item.isActive ? 'var(--hero-brand-soft)' : 'var(--ink-50)',
                          border: `1px solid ${item.isActive ? 'var(--brand-500)' : 'var(--border)'}`,
                          transition: 'background-color 150ms ease, border-color 150ms ease, transform 120ms cubic-bezier(0.23, 1, 0.32, 1)',
                        }}
                      >
                        <span className="text-[13px] leading-snug" style={{ color: 'var(--ink-900)' }}>
                          {item.activityDescription}
                        </span>
                        {busy ? (
                          <Loader2 size={14} className="animate-spin flex-shrink-0" style={{ color: 'var(--ink-500)' }} />
                        ) : (
                          <span
                            className="px-2 py-0.5 rounded-full text-[11px] font-bold flex-shrink-0"
                            style={
                              item.isActive
                                ? { background: 'var(--brand-100)', color: 'var(--brand-900)' }
                                : { background: 'var(--card)', color: 'var(--ink-500)', border: '1px solid var(--border)' }
                            }
                          >
                            {item.isActive ? 'Activa' : 'Inactiva'}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {saveError && (
          <div className="flex items-center gap-2 text-[12.5px] font-semibold" style={{ color: 'var(--violet-ink)' }}>
            <AlertCircle size={14} /> {saveError}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
