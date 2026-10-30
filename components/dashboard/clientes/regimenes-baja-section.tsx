'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, AlertTriangle, Loader2, Plus, Search, Sparkles, X } from 'lucide-react'
import {
  getInactiveRegimeActivities,
  updateInactiveRegimeActivities,
} from '@/features/taxpayers/actions/regimeActivities.action'
import type { ActivityCatalogItem, InactiveRegimeActivities } from '@/features/taxpayers/types'

/** "2024-03-31" → "31 mar 2024" sin corrimiento de zona horaria (DateOnly del backend). */
function formatDay(value: string | null): string {
  if (!value) return '—'
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return value
  return new Date(y, m - 1, d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface DraftActivity {
  activityId: number
  description: string
  allowedByRegime: boolean
  autoAssigned: boolean
}

/**
 * Un régimen dado de baja: sus actividades se editan como borrador y se guardan completas
 * (el PUT reemplaza la lista de esa liga). Se puede elegir cualquier actividad del catálogo:
 * la CSF ya no la trae, es criterio del contador.
 */
function RegimeCard({
  rfc,
  regime,
  catalog,
  onSaved,
}: {
  rfc: string
  regime: InactiveRegimeActivities
  catalog: ActivityCatalogItem[]
  onSaved: () => void
}) {
  const allowedIds = useMemo(() => new Set(regime.allowedActivityIds), [regime.allowedActivityIds])
  const initial = useMemo<DraftActivity[]>(
    () => regime.activities.map((a) => ({ ...a })),
    [regime.activities],
  )
  const [draft, setDraft] = useState<DraftActivity[]>(initial)
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notAllowed, setNotAllowed] = useState<number[]>([])

  useEffect(() => setDraft(initial), [initial])

  const draftIds = new Set(draft.map((d) => d.activityId))
  const dirty =
    draft.length !== initial.length || draft.some((d) => !initial.some((i) => i.activityId === d.activityId))

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    const taken = new Set(draft.map((d) => d.activityId))
    return catalog.filter((c) => !taken.has(c.id) && c.description.toLowerCase().includes(q)).slice(0, 8)
  }, [query, catalog, draft])

  function add(activityId: number, description: string) {
    if (draftIds.has(activityId)) return
    setDraft((prev) => [
      ...prev,
      { activityId, description, allowedByRegime: allowedIds.has(activityId), autoAssigned: false },
    ])
    setQuery('')
  }

  async function save() {
    setSaving(true)
    setError(null)
    const res = await updateInactiveRegimeActivities(rfc, regime.taxPayerTaxRegimeId, draft.map((d) => d.activityId))
    setSaving(false)
    if (!res.success) {
      setError(res.error.message)
      return
    }
    setNotAllowed(res.value.notAllowedByRegime)
    onSaved()
  }

  const suggestions = regime.suggested.filter((s) => !draftIds.has(s.activityId))

  return (
    <div className="rounded-xl p-3.5 flex flex-col gap-3" style={{ border: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13.5px] font-bold leading-snug" style={{ color: 'var(--ink-900)' }}>
            {regime.regimeName}
          </div>
          <div className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
            Vigente del {formatDay(regime.startDate)} al {formatDay(regime.endDate)}
          </div>
        </div>
        {draft.length === 0 && (
          <span
            className="px-1.5 py-px rounded-full text-[10.5px] font-bold whitespace-nowrap"
            style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)' }}
          >
            Sin actividades
          </span>
        )}
      </div>

      {/* Actividades del borrador */}
      {draft.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {draft.map((d) => (
            <span
              key={d.activityId}
              className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-full text-[12px]"
              style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--ink-900)' }}
              title={d.allowedByRegime ? undefined : 'El catálogo no permite esta actividad para este régimen'}
            >
              {!d.allowedByRegime && <AlertTriangle size={12} style={{ color: 'var(--amber)' }} />}
              {d.autoAssigned && (
                <span title="Asignada automáticamente con el historial del SAT (IDC)">
                  <Sparkles size={12} style={{ color: 'var(--brand-500)' }} />
                </span>
              )}
              <span className="max-w-[360px] truncate">{d.description}</span>
              <button
                type="button"
                onClick={() => setDraft((prev) => prev.filter((p) => p.activityId !== d.activityId))}
                aria-label={`Quitar ${d.description}`}
                className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-[var(--border)]"
                style={{ color: 'var(--ink-500)' }}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Sugeridas por IDC */}
      {suggestions.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-400)' }}>
            Historial del SAT (IDC) en esas fechas
          </div>
          {suggestions.map((s) => (
            <div key={`${s.activityId}-${s.startDate}`} className="flex items-center justify-between gap-2 text-[12.5px]">
              <span className="min-w-0" style={{ color: 'var(--ink-700)' }}>
                {!s.allowedByRegime && (
                  <AlertTriangle
                    size={12}
                    className="inline mr-1 -mt-0.5"
                    style={{ color: 'var(--amber)' }}
                    aria-label="El catálogo no permite esta actividad para este régimen"
                  />
                )}
                {s.description}
                <span className="ml-1.5" style={{ color: 'var(--ink-400)' }}>
                  ({formatDay(s.startDate)} – {s.endDate ? formatDay(s.endDate) : 'vigente'})
                </span>
              </span>
              <button
                type="button"
                onClick={() => add(s.activityId, s.description)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11.5px] font-bold whitespace-nowrap"
                style={{ border: '1px solid var(--border-strong)', color: 'var(--ink-700)' }}
              >
                <Plus size={12} /> Agregar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Cualquier actividad del catálogo */}
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-400)' }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar en el catálogo de actividades…"
          className="w-full pl-8 pr-3 py-2 rounded-lg text-[12.5px]"
          style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
        />
        {results.length > 0 && (
          <div
            className="absolute z-20 left-0 right-0 mt-1 rounded-lg overflow-hidden shadow-lg max-h-[220px] overflow-y-auto"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            {results.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => add(r.id, r.description)}
                className="w-full text-left px-3 py-2 text-[12.5px] flex items-center gap-1.5 hover:bg-[var(--border)]"
                style={{ color: 'var(--ink-900)' }}
              >
                {!allowedIds.has(r.id) && <AlertTriangle size={12} style={{ color: 'var(--amber)' }} />}
                {r.description}
              </button>
            ))}
          </div>
        )}
      </div>

      {(error || notAllowed.length > 0) && (
        <div className="flex items-start gap-2 text-[12px] font-semibold" style={{ color: 'var(--violet-ink)' }}>
          <AlertCircle size={14} className="flex-shrink-0 mt-px" />
          {error ??
            `Guardado. ${notAllowed.length === 1 ? 'Una actividad no está permitida' : `${notAllowed.length} actividades no están permitidas`} para este régimen según el catálogo; revisa que sea correcto.`}
        </div>
      )}

      {dirty && (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDraft(initial)}
            disabled={saving}
            className="px-3 py-1.5 rounded-lg text-[12.5px] font-bold"
            style={{ border: '1px solid var(--border-strong)', color: 'var(--ink-700)' }}
          >
            Descartar
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || draft.length === 0}
            title={draft.length === 0 ? 'Debe quedar al menos una actividad' : undefined}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-bold text-white disabled:opacity-60"
            style={{ background: 'var(--brand-500)' }}
          >
            {saving && <Loader2 size={13} className="animate-spin" />} Guardar
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Regímenes dados de baja del contribuyente. Sus actividades las leen el clasificador y el posteo 626
 * para declarar los periodos previos a la baja; la CSF ya no las trae.
 */
export function RegimenesBajaSection({ rfc }: { rfc: string }) {
  const [regimes, setRegimes] = useState<InactiveRegimeActivities[]>([])
  const [catalog, setCatalog] = useState<ActivityCatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getInactiveRegimeActivities(rfc).then((res) => {
      if (cancelled) return
      if (res.success) {
        setRegimes(res.value.regimes)
        setCatalog(res.value.catalog)
      } else {
        setError(res.error.message)
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [rfc, reloadKey])

  if (loading) {
    return (
      <div className="py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
        <Loader2 size={16} className="animate-spin" /> Cargando regímenes dados de baja…
      </div>
    )
  }
  if (error) {
    return (
      <div className="py-8 text-center flex flex-col items-center gap-2">
        <AlertCircle size={18} style={{ color: 'var(--violet-ink)' }} />
        <div className="text-[13px]" style={{ color: 'var(--ink-700)' }}>{error}</div>
      </div>
    )
  }
  if (regimes.length === 0) {
    return (
      <div className="py-8 text-center text-[13px]" style={{ color: 'var(--ink-500)' }}>
        Este contribuyente no tiene regímenes dados de baja con fecha de baja.
      </div>
    )
  }

  return (
    <div className="max-h-[52vh] overflow-y-auto pr-1 flex flex-col gap-3">
      {regimes.map((r) => (
        <RegimeCard
          key={r.taxPayerTaxRegimeId}
          rfc={rfc}
          regime={r}
          catalog={catalog}
          onSaved={() => setReloadKey((k) => k + 1)}
        />
      ))}
    </div>
  )
}
