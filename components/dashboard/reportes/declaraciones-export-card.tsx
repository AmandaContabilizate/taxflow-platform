'use client'

import { AlertCircle, CheckCircle, Download, FileSpreadsheet, Loader2, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { exportDeclarationsReport } from '@/features/declarations/actions/exportDeclarationsReport.action'
import { getEquipoOperaciones } from '@/features/operations/actions/getEquipoOperaciones.action'
import { getTaxRegimes, type TaxRegime } from '@/features/taxpayers/actions/getTaxRegimes.action'
import { downloadFile } from '@/lib/common/downloadFile'
import { useHasPermission } from '../permissions'
import { Btn, Card } from '../ui'

interface DeclaracionesExportCardProps {
  initialYear: number
  initialMonth: number
}

const MESES = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
]

const STATUS_OPTIONS = [
  { id: 1, label: 'Pendiente' },
  { id: 2, label: 'En proceso' },
  { id: 3, label: 'Presentada' },
  { id: 4, label: 'Rechazada' },
  { id: 5, label: 'Cancelada' },
]

const CIEC_OPTIONS = [
  { value: '1', label: 'CIEC Válida' },
  { value: '2', label: 'CIEC Inválida' },
  { value: '0', label: 'Sin CIEC Registrada' },
]

const ASSIGN_ACCOUNTANT_CLAIM = 'AssignAccountant'

export function DeclaracionesExportCard({ initialYear, initialMonth }: DeclaracionesExportCardProps) {
  const canFilterAccountant = useHasPermission(ASSIGN_ACCOUNTANT_CLAIM)

  const [fiscalYear, setFiscalYear] = useState<string>(String(initialYear))
  const [month, setMonth] = useState<string>(String(initialMonth))
  const [kind, setKind] = useState<'all' | '1' | '2'>('all')
  const [taxRegimeId, setTaxRegimeId] = useState<string>('')
  const [statusId, setStatusId] = useState<string>('')
  const [ciecState, setCiecState] = useState<string>('')
  const [accountantUserId, setAccountantUserId] = useState<string>('')
  const [search, setSearch] = useState<string>('')

  const [regimes, setRegimes] = useState<TaxRegime[]>([])
  const [accountants, setAccountants] = useState<{ userId: string; nombre: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'empty'; msg: string } | null>(null)

  const selectStyle = {
    background: 'var(--muted)',
    border: '1px solid var(--border)',
    color: 'var(--ink-900)',
  }

  useEffect(() => {
    void (async () => {
      const res = await getTaxRegimes()
      if (res.success) setRegimes(res.value)
    })()
  }, [])

  useEffect(() => {
    if (!canFilterAccountant) return
    const now = new Date()
    void (async () => {
      const res = await getEquipoOperaciones(now.getFullYear(), now.getMonth() + 1)
      if (res.success) setAccountants(res.value.miembros.map((m) => ({ userId: m.userId, nombre: m.nombre })))
    })()
  }, [canFilterAccountant])

  async function handleExport() {
    if (loading) return
    setLoading(true)
    setFeedback(null)

    const res = await exportDeclarationsReport({
      fiscalYear: fiscalYear ? Number(fiscalYear) : undefined,
      month: month ? Number(month) : undefined,
      kind: kind === '1' ? 1 : kind === '2' ? 2 : undefined,
      taxRegimeId: taxRegimeId ? Number(taxRegimeId) : undefined,
      statusId: statusId ? Number(statusId) : undefined,
      ciecState: ciecState !== '' ? (Number(ciecState) as 0 | 1 | 2) : undefined,
      accountantUserId: canFilterAccountant && accountantUserId ? accountantUserId : undefined,
      search: search.trim() || undefined,
    })

    setLoading(false)

    if (!res.success) {
      if (res.error.code === 'EXPORT_NO_RESULTS') {
        setFeedback({ type: 'empty', msg: 'No se encontraron declaraciones con los filtros seleccionados.' })
      } else {
        setFeedback({ type: 'error', msg: res.error.message || 'Error al exportar el reporte.' })
      }
      return
    }

    downloadFile(res.value)
    setFeedback({ type: 'success', msg: `¡Reporte ${res.value.filename} generado y descargado con éxito!` })
  }

  return (
    <Card className="p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between gap-4 border-b pb-5 mb-5" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}
          >
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <h3 className="text-[16px] font-black" style={{ color: 'var(--ink-900)' }}>
              Reporte Maestro de Declaraciones Fiscales
            </h3>
            <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
              Exportación completa de obligaciones fiscales, estatus SAT, CIEC y contadores asignados.
            </p>
          </div>
        </div>

        <span
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-extrabold uppercase"
          style={{ background: 'var(--muted)', color: 'var(--ink-600)' }}
        >
          <Sparkles size={13} className="text-emerald-500" />
          Operaciones Fiscales
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-bold" style={{ color: 'var(--ink-700)' }}>Ejercicio</span>
          <input
            type="number"
            placeholder="Todos"
            value={fiscalYear}
            onChange={(e) => setFiscalYear(e.target.value)}
            className="px-3.5 py-2 rounded-xl text-[13px] font-medium"
            style={selectStyle}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-bold" style={{ color: 'var(--ink-700)' }}>Mes</span>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3.5 py-2 rounded-xl text-[13px] font-medium"
            style={selectStyle}
          >
            <option value="">Todos los meses</option>
            {MESES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-bold" style={{ color: 'var(--ink-700)' }}>Régimen Fiscal</span>
          <select
            value={taxRegimeId}
            onChange={(e) => setTaxRegimeId(e.target.value)}
            className="px-3.5 py-2 rounded-xl text-[13px] font-medium"
            style={selectStyle}
          >
            <option value="">Todos los regímenes</option>
            {regimes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.satCode ? `${r.satCode} · ` : ''}{r.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-bold" style={{ color: 'var(--ink-700)' }}>Estatus Declaración</span>
          <select
            value={statusId}
            onChange={(e) => setStatusId(e.target.value)}
            className="px-3.5 py-2 rounded-xl text-[13px] font-medium"
            style={selectStyle}
          >
            <option value="">Todos los estatus</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-bold" style={{ color: 'var(--ink-700)' }}>Estado de CIEC</span>
          <select
            value={ciecState}
            onChange={(e) => setCiecState(e.target.value)}
            className="px-3.5 py-2 rounded-xl text-[13px] font-medium"
            style={selectStyle}
          >
            <option value="">Todos los estados</option>
            {CIEC_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>

        {canFilterAccountant && (
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-bold" style={{ color: 'var(--ink-700)' }}>Contador Asignado</span>
            <select
              value={accountantUserId}
              onChange={(e) => setAccountantUserId(e.target.value)}
              className="px-3.5 py-2 rounded-xl text-[13px] font-medium"
              style={selectStyle}
            >
              <option value="">Todos los contadores</option>
              {accountants.map((a) => (
                <option key={a.userId} value={a.userId}>{a.nombre}</option>
              ))}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-bold" style={{ color: 'var(--ink-700)' }}>Tipo de Declaración</span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as 'all' | '1' | '2')}
            className="px-3.5 py-2 rounded-xl text-[13px] font-medium"
            style={selectStyle}
          >
            <option value="all">Todas (Regularizaciones y Futuras)</option>
            <option value="1">Solo Regularizaciones</option>
            <option value="2">Solo Declaraciones Futuras</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-bold" style={{ color: 'var(--ink-700)' }}>Búsqueda</span>
          <input
            type="text"
            placeholder="RFC o razón social..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3.5 py-2 rounded-xl text-[13px] font-medium"
            style={selectStyle}
          />
        </label>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2.5 p-3.5 rounded-2xl mb-4 text-[12.5px] font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : feedback.type === 'empty'
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle size={17} className="text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle size={17} className="flex-shrink-0" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <Btn onClick={handleExport} disabled={loading} size="sm">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          <span>{loading ? 'Generando Excel...' : 'Descargar Reporte Excel (.xlsx)'}</span>
        </Btn>
      </div>
    </Card>
  )
}
