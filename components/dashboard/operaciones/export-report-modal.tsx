'use client'

import { AlertCircle, Download, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { exportDeclarationsReport } from '@/features/declarations/actions/exportDeclarationsReport.action'
import { getEquipoOperaciones } from '@/features/operations/actions/getEquipoOperaciones.action'
import { getTaxRegimes, type TaxRegime } from '@/features/taxpayers/actions/getTaxRegimes.action'
import { downloadFile } from '@/lib/common/downloadFile'
import { Modal } from '../modal'
import { useHasPermission } from '../permissions'
import { Btn } from '../ui'
import { MESES, selectStyle } from './purchased-declarations'

/** Habilita el filtro "Contador asignado" y `accountantUserId` en el back. */
const ASSIGN_ACCOUNTANT_CLAIM = 'AssignAccountant'

/** Etiqueta del régimen para el select: "625 · Plataformas Tecnológicas". */
const regimeLabel = (r: TaxRegime) => [r.satCode, r.name].filter(Boolean).join(' · ') || `Régimen ${r.id}`

const CIEC_OPTIONS: { value: 0 | 1 | 2; label: string }[] = [
  { value: 1, label: 'CIEC válida' },
  { value: 2, label: 'CIEC inválida' },
  { value: 0, label: 'CIEC no registrada' },
]

export interface ExportInitialFilters {
  search?: string
  fiscalYear?: number
  month?: number
  taxRegimeId?: number
  statusId?: number
}

export interface StatusOption {
  id: number
  label: string
}

interface Filters {
  search: string
  fiscalYear: string
  month: string
  taxRegimeId: string
  statusId: string
  ciecState: string
  accountantUserId: string
}

const emptyFilters = (initial: ExportInitialFilters): Filters => ({
  search: initial.search ?? '',
  fiscalYear: initial.fiscalYear ? String(initial.fiscalYear) : '',
  month: initial.month ? String(initial.month) : '',
  taxRegimeId: initial.taxRegimeId ? String(initial.taxRegimeId) : '',
  statusId: initial.statusId ? String(initial.statusId) : '',
  ciecState: '',
  accountantUserId: '',
})

/**
 * Modal de exportación, compartido por las tres vistas (kind lo impone la
 * pantalla, no es un filtro editable aquí). Ver E3/E4 del requerimiento.
 */
export function ExportReportModal({
  isOpen,
  onClose,
  kind,
  initial,
  statusOptions,
}: {
  isOpen: boolean
  onClose: () => void
  kind: 1 | 2 | undefined
  initial: ExportInitialFilters
  /** Estatus visibles en la página actual; nivel 1 no expone statusId y llega vacío. */
  statusOptions: StatusOption[]
}) {
  const canFilterAccountant = useHasPermission(ASSIGN_ACCOUNTANT_CLAIM)

  const [filters, setFilters] = useState<Filters>(() => emptyFilters(initial))
  const [regimes, setRegimes] = useState<TaxRegime[]>([])
  const [accountants, setAccountants] = useState<{ userId: string; nombre: string }[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [noResults, setNoResults] = useState(false)

  // Precarga con lo que el contador ya tenía aplicado en la pantalla cada vez que se abre.
  useEffect(() => {
    if (!isOpen) return
    setFilters(emptyFilters(initial))
    setError(null)
    setNoResults(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || regimes.length) return
    void (async () => {
      const res = await getTaxRegimes()
      if (res.success) setRegimes(res.value)
    })()
  }, [isOpen, regimes.length])

  useEffect(() => {
    if (!isOpen || !canFilterAccountant || accountants.length) return
    const now = new Date()
    void (async () => {
      const res = await getEquipoOperaciones(now.getFullYear(), now.getMonth() + 1)
      if (res.success) setAccountants(res.value.miembros.map((m) => ({ userId: m.userId, nombre: m.nombre })))
    })()
  }, [isOpen, canFilterAccountant, accountants.length])

  const set = <K extends keyof Filters>(key: K, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }))

  async function handleExport() {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    setNoResults(false)
    const res = await exportDeclarationsReport({
      kind,
      search: filters.search.trim() || undefined,
      fiscalYear: filters.fiscalYear ? Number(filters.fiscalYear) : undefined,
      month: filters.month ? Number(filters.month) : undefined,
      taxRegimeId: filters.taxRegimeId ? Number(filters.taxRegimeId) : undefined,
      statusId: filters.statusId ? Number(filters.statusId) : undefined,
      ciecState: filters.ciecState !== '' ? (Number(filters.ciecState) as 0 | 1 | 2) : undefined,
      accountantUserId: canFilterAccountant ? filters.accountantUserId || undefined : undefined,
    })
    setSubmitting(false)
    if (!res.success) {
      if (res.error.code === 'EXPORT_NO_RESULTS') setNoResults(true)
      else setError(res.error.message)
      return
    }
    downloadFile(res.value)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Exportar reporte">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-bold" style={{ color: 'var(--ink-700)' }}>Ejercicio</span>
            <input
              type="number"
              placeholder="Todos"
              value={filters.fiscalYear}
              onChange={(e) => set('fiscalYear', e.target.value)}
              className="px-3 py-2 rounded-lg text-[12.5px] font-semibold"
              style={selectStyle}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-bold" style={{ color: 'var(--ink-700)' }}>Mes</span>
            <select
              value={filters.month}
              onChange={(e) => set('month', e.target.value)}
              className="px-3 py-2 rounded-lg text-[12.5px] font-semibold"
              style={selectStyle}
            >
              <option value="">Todos</option>
              {MESES.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-bold" style={{ color: 'var(--ink-700)' }}>Régimen</span>
            <select
              value={filters.taxRegimeId}
              onChange={(e) => set('taxRegimeId', e.target.value)}
              className="px-3 py-2 rounded-lg text-[12.5px] font-semibold"
              style={selectStyle}
            >
              <option value="">Todos</option>
              {regimes.map((r) => (
                <option key={r.id} value={r.id}>{regimeLabel(r)}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-bold" style={{ color: 'var(--ink-700)' }}>Estatus</span>
            <select
              value={filters.statusId}
              onChange={(e) => set('statusId', e.target.value)}
              className="px-3 py-2 rounded-lg text-[12.5px] font-semibold"
              style={selectStyle}
              disabled={statusOptions.length === 0}
            >
              <option value="">Todos</option>
              {statusOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-bold" style={{ color: 'var(--ink-700)' }}>Estado de CIEC</span>
            <select
              value={filters.ciecState}
              onChange={(e) => set('ciecState', e.target.value)}
              className="px-3 py-2 rounded-lg text-[12.5px] font-semibold"
              style={selectStyle}
            >
              <option value="">Todos</option>
              {CIEC_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>

          {canFilterAccountant && (
            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-bold" style={{ color: 'var(--ink-700)' }}>Contador asignado</span>
              <select
                value={filters.accountantUserId}
                onChange={(e) => set('accountantUserId', e.target.value)}
                className="px-3 py-2 rounded-lg text-[12.5px] font-semibold"
                style={selectStyle}
              >
                <option value="">Todos</option>
                {accountants.map((a) => (
                  <option key={a.userId} value={a.userId}>{a.nombre}</option>
                ))}
              </select>
            </label>
          )}
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-[12px] font-bold" style={{ color: 'var(--ink-700)' }}>Búsqueda (RFC o razón social)</span>
          <input
            type="text"
            placeholder="Todos"
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            className="px-3 py-2 rounded-lg text-[12.5px] font-semibold"
            style={selectStyle}
          />
        </label>

        {noResults && (
          <div
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[12.5px] font-semibold"
            style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)' }}
          >
            <AlertCircle size={16} /> Ningún registro cumple los filtros seleccionados.
          </div>
        )}

        {error && (
          <div
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[12.5px] font-semibold"
            style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
          >
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <Btn kind="brand" onClick={handleExport} disabled={submitting} block>
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Generando…
            </>
          ) : (
            <>
              <Download size={16} /> Exportar
            </>
          )}
        </Btn>
      </div>
    </Modal>
  )
}
