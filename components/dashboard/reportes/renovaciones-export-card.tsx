'use client'

import { AlertCircle, CheckCircle, Download, FileSpreadsheet, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { exportCoverageRenewals } from '@/features/operations/actions/exportCoverageRenewals.action'
import { getTaxRegimes, type TaxRegime } from '@/features/taxpayers/actions/getTaxRegimes.action'
import { downloadFile } from '@/lib/common/downloadFile'
import { Btn, Card } from '../ui'

const MARGEN_OPTIONS = [
  { value: 0, label: 'Vencen este mes o ya vencidos (<= 0 meses)' },
  { value: 1, label: 'Próximo mes o menos (<= 1 mes)' },
  { value: 2, label: 'Próximos 2 meses o menos (<= 2 meses)' },
  { value: 3, label: 'Próximo trimestre (<= 3 meses)' },
  { value: 6, label: 'Próximo semestre (<= 6 meses)' },
  { value: -1, label: 'Todas las compras a futuro (Sin filtro de margen)' },
]

export function RenovacionesExportCard() {
  const [margen, setMargen] = useState<number>(2)
  const [regimen, setRegimen] = useState<string>('')
  const [search, setSearch] = useState<string>('')

  const [regimes, setRegimes] = useState<TaxRegime[]>([])
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

  async function handleExport() {
    if (loading) return
    setLoading(true)
    setFeedback(null)

    const res = await exportCoverageRenewals({
      margen: margen === -1 ? undefined : margen,
      regimen: regimen.trim() || undefined,
      search: search.trim() || undefined,
    })

    setLoading(false)

    if (!res.success) {
      setFeedback({ type: 'error', msg: res.error.message || 'Error al exportar reporte de renovaciones.' })
      return
    }

    downloadFile(res.value)
    setFeedback({
      type: 'success',
      msg: `¡Reporte ${res.value.filename} generado y descargado con éxito!`,
    })
  }

  return (
    <Card className="p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between gap-4 border-b pb-5 mb-5" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(115, 57, 253, 0.1)', color: 'var(--violet-ink)' }}
          >
            <RefreshCw size={22} />
          </div>
          <div>
            <h3 className="text-[16px] font-black" style={{ color: 'var(--ink-900)' }}>
              Reporte de Clientes por Renovar (Cobertura Fiscal)
            </h3>
            <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
              Clientes cuyo último mes de declaraciones compradas a futuro ya casi termina o ya venció, agrupado por régimen.
            </p>
          </div>
        </div>

        <span
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-extrabold uppercase"
          style={{ background: 'var(--muted)', color: 'var(--violet-ink)' }}
        >
          <Sparkles size={13} />
          Gerencia SAC / Comercial
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-bold" style={{ color: 'var(--ink-700)' }}>Margen de Cobertura</span>
          <select
            value={margen}
            onChange={(e) => setMargen(Number(e.target.value))}
            className="px-3.5 py-2 rounded-xl text-[13px] font-medium"
            style={selectStyle}
          >
            {MARGEN_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-bold" style={{ color: 'var(--ink-700)' }}>Régimen Fiscal</span>
          <select
            value={regimen}
            onChange={(e) => setRegimen(e.target.value)}
            className="px-3.5 py-2 rounded-xl text-[13px] font-medium"
            style={selectStyle}
          >
            <option value="">Todos los regímenes</option>
            <option value="Multirégimen">Multirégimen</option>
            {regimes.map((r) => (
              <option key={r.id} value={r.satCode || r.name}>
                {r.satCode ? `${r.satCode} · ` : ''}{r.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-bold" style={{ color: 'var(--ink-700)' }}>Búsqueda (RFC o Nombre)</span>
          <input
            type="text"
            placeholder="Opcional: RFC, nombre o correo..."
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
          {loading ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
          <span>{loading ? 'Generando Excel...' : 'Descargar Reporte SAC (.xlsx)'}</span>
        </Btn>
      </div>
    </Card>
  )
}
