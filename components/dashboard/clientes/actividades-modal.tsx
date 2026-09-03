'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Check, Loader2 } from 'lucide-react'
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

/** Etiqueta corta para el encabezado de columna; el nombre completo del régimen va en el tooltip. */
function shortRegimeName(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('plataformas')) return 'Plataformas'
  if (n.includes('sueldos') || n.includes('salarios')) return 'Sueldos'
  if (n.includes('simplificado de confianza')) return 'RESICO'
  if (n.includes('arrendamiento')) return 'Arrendamiento'
  if (n.includes('empresariales y profesionales')) return 'Emp. y prof.'
  if (n.includes('incorporaci')) return 'RIF'
  if (n.includes('sin obligaciones')) return 'Sin obligaciones'
  if (n.includes('intereses')) return 'Intereses'
  if (n.includes('dividendos')) return 'Dividendos'
  if (n.includes('enajenaci')) return 'Enajenación'
  const stripped = name.replace(/^r[ée]gimen (de |de las |de los |del )?/i, '')
  const words = stripped.split(' ').filter(Boolean)
  return words.length <= 2 ? stripped : words.slice(0, 2).join(' ') + '…'
}

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

  // Matriz volteada: una fila por ACTIVIDAD, una columna por régimen. Con pocos regímenes y
  // varias actividades es la orientación compacta — y deja ver de un vistazo cuáles actividades
  // no cuentan en ningún régimen (van primero: son las que requieren decisión).
  const { regimeCols, activityRows, unassignedCount } = useMemo(() => {
    const regimes = new Map<number, string>()
    const acts = new Map<
      number,
      { description: string; cells: Map<number, RegimeActivityMatrixItem> }
    >()
    for (const item of matrix) {
      if (!regimes.has(item.regimeId)) regimes.set(item.regimeId, item.regimeName)
      let row = acts.get(item.activityId)
      if (!row) {
        row = { description: item.activityDescription, cells: new Map() }
        acts.set(item.activityId, row)
      }
      row.cells.set(item.regimeId, item)
    }
    const regimeCols = Array.from(regimes.entries()).map(([regimeId, regimeName]) => ({
      regimeId,
      regimeName,
    }))
    const activityRows = Array.from(acts.entries()).map(([activityId, r]) => ({
      activityId,
      description: r.description,
      cells: r.cells,
      assigned: Array.from(r.cells.values()).some((c) => c.isActive),
    }))
    activityRows.sort(
      (a, b) =>
        Number(a.assigned) - Number(b.assigned) ||
        a.description.localeCompare(b.description, 'es'),
    )
    return {
      regimeCols,
      activityRows,
      unassignedCount: activityRows.filter((r) => !r.assigned).length,
    }
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
      <DialogContent className="max-w-[640px]">
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
            Las actividades vienen de la última CSF leída o de la migración del sistema anterior.
            Activar o desactivar aquí decide qué actividad cuenta en cada régimen —{' '}
            <b>sobreescribe</b> lo detectado automáticamente.
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
        ) : activityRows.length === 0 ? (
          <div className="py-8 text-center text-[13px]" style={{ color: 'var(--ink-500)' }}>
            Este contribuyente no tiene regímenes con actividades registradas.
          </div>
        ) : (
          <div className="max-h-[46vh] overflow-y-auto overflow-x-auto pr-1">
            <div style={{ minWidth: regimeCols.length > 3 ? 320 + regimeCols.length * 92 : undefined }}>
              {/* Encabezado: actividad + una columna por régimen (nombre completo en tooltip) */}
              <div
                className="grid items-end gap-x-2 pb-1.5 sticky top-0 z-10"
                style={{
                  gridTemplateColumns: `minmax(0, 1fr) repeat(${regimeCols.length}, 84px)`,
                  background: 'var(--card)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div
                  className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider"
                  style={{ color: 'var(--ink-400)' }}
                >
                  Actividad
                  {unassignedCount > 0 && (
                    <span
                      className="px-1.5 py-px rounded-full text-[10.5px] font-bold normal-case tracking-normal"
                      style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)' }}
                    >
                      {unassignedCount} sin asignar
                    </span>
                  )}
                </div>
                {regimeCols.map((rc) => (
                  <div
                    key={rc.regimeId}
                    title={rc.regimeName}
                    className="text-center text-[11px] font-extrabold uppercase tracking-wider leading-tight cursor-default"
                    style={{ color: 'var(--ink-400)' }}
                  >
                    {shortRegimeName(rc.regimeName)}
                  </div>
                ))}
              </div>

              {activityRows.map((row) => (
                <div
                  key={row.activityId}
                  className="grid items-center gap-x-2 py-1.5"
                  style={{
                    gridTemplateColumns: `minmax(0, 1fr) repeat(${regimeCols.length}, 84px)`,
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div className="text-[13px] leading-snug py-1" style={{ color: 'var(--ink-900)' }}>
                    {row.description}
                    {!row.assigned && (
                      <span
                        className="ml-2 px-1.5 py-px rounded-full text-[10.5px] font-bold align-middle whitespace-nowrap"
                        style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)' }}
                      >
                        Sin asignar
                      </span>
                    )}
                  </div>
                  {regimeCols.map((rc) => {
                    const item = row.cells.get(rc.regimeId)
                    if (!item) return <div key={rc.regimeId} />
                    const key = `${item.regimeId}-${item.activityId}`
                    const busy = saving === key
                    return (
                      <div key={rc.regimeId} className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => toggle(item)}
                          disabled={busy || saving !== null}
                          role="switch"
                          aria-checked={item.isActive}
                          aria-label={`${row.description} — ${rc.regimeName}`}
                          className={`flex h-8 w-8 items-center justify-center rounded-full cursor-pointer active:scale-[0.92] disabled:cursor-wait ${
                            item.isActive ? 'text-white' : 'text-transparent hover:text-[var(--ink-300)]'
                          }`}
                          style={{
                            background: item.isActive ? 'var(--brand-500)' : 'var(--card)',
                            border: `1px solid ${item.isActive ? 'var(--brand-500)' : 'var(--border)'}`,
                            transition:
                              'background-color 150ms ease, border-color 150ms ease, color 150ms ease, transform 140ms cubic-bezier(0.23, 1, 0.32, 1)',
                          }}
                        >
                          {busy ? (
                            <Loader2 size={13} className="animate-spin" style={{ color: 'var(--ink-500)' }} />
                          ) : (
                            <Check size={14} strokeWidth={3} />
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
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
