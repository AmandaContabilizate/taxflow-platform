'use client'

import { FileUp, Loader2, Upload } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { addCompanyPersons } from '@/features/empresa/actions/managePersons.action'
import { type AddPersonsResult, type CompanyPersonInput, RELATION_TYPES, relationLabel } from '@/features/empresa/types'
import { Modal } from '../modal'
import { Badge } from '../ui'

interface Props {
  open: boolean
  partnershipId?: number
  onClose: () => void
  onSaved: (result: AddPersonsResult) => void
}

const MAX_ROWS = 500
const COLUMNS = 'nombre, correo, teléfono, RFC, tipo de relación, id interno, ciudad, estado'

const inputStyle = {
  background: 'var(--input)',
  border: '1px solid var(--border)',
  color: 'var(--foreground)',
} as const

function normalize(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

function parseRelation(raw: string | undefined): number {
  const v = (raw ?? '').trim()
  if (!v) return 6
  const n = Number(v)
  if (Number.isInteger(n) && n >= 1 && n <= 8) return n
  const match = RELATION_TYPES.find((r) => normalize(r.label) === normalize(v) || normalize(r.label).startsWith(normalize(v)))
  return match?.value ?? 6
}

function splitLine(line: string, delimiter: string): string[] {
  if (delimiter !== ',') return line.split(delimiter).map((c) => c.trim())
  // CSV con comillas: "López, María",correo@x.com,...
  const out: string[] = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') { cur += '"'; i++ } else quoted = !quoted
    } else if (ch === ',' && !quoted) {
      out.push(cur.trim()); cur = ''
    } else cur += ch
  }
  out.push(cur.trim())
  return out
}

/** Columnas fijas (fase 1, sin layouts): nombre, correo, teléfono, RFC, tipo de relación, id interno, ciudad, estado. */
export function parsePersonsText(text: string): { rows: CompanyPersonInput[]; skippedHeader: boolean } {
  const lines = text.split(/\r?\n/).map((l) => l.trimEnd()).filter((l) => l.trim().length > 0)
  if (lines.length === 0) return { rows: [], skippedHeader: false }
  const sample = lines[0]
  const delimiter = sample.includes('\t') ? '\t' : (sample.split(';').length > sample.split(',').length ? ';' : ',')
  const first = normalize(lines[0])
  const skippedHeader = first.includes('correo') || first.includes('email') || first.includes('nombre')
  const body = skippedHeader ? lines.slice(1) : lines
  const rows = body.map((line) => {
    const c = splitLine(line, delimiter)
    return {
      fullName: c[0] ?? '',
      email: (c[1] ?? '').toLowerCase(),
      phone: c[2] || null,
      rfcDeclared: c[3] ? c[3].toUpperCase() : null,
      relationType: parseRelation(c[4]),
      externalId: c[5] || null,
      city: c[6] || null,
      state: c[7] || null,
    }
  })
  return { rows, skippedHeader }
}

/** Carga masiva de personas: pegar filas o subir un CSV; vista previa antes de enviar; resultado por fila. */
export function CargaMasivaModal({ open, partnershipId, onClose, onSaved }: Props) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AddPersonsResult | null>(null)

  useEffect(() => {
    if (!open) return
    setText('')
    setError(null)
    setResult(null)
  }, [open])

  const parsed = useMemo(() => parsePersonsText(text), [text])

  if (!open) return null

  const onFile = async (file: File | null) => {
    if (!file) return
    const content = await file.text()
    setText(content)
  }

  const submit = async () => {
    if (parsed.rows.length === 0) return setError('Pega al menos una fila o sube un archivo.')
    if (parsed.rows.length > MAX_ROWS) return setError(`Máximo ${MAX_ROWS} personas por carga. Divide el archivo.`)
    setLoading(true)
    setError(null)
    try {
      const res = await addCompanyPersons(parsed.rows, partnershipId)
      if (!res.success) return setError(res.error.message)
      setResult(res.value)
      onSaved(res.value)
    } catch (e) {
      console.error('[CargaMasivaModal] addCompanyPersons falló:', e)
      setError('No pudimos procesar la carga. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const preview = parsed.rows.slice(0, 8)

  return (
    <Modal isOpen onClose={onClose} title="Carga masiva de personas" maxWidth={760}>
      {result ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Creadas" value={result.created} tone="ok" />
            <Stat label="Ya eran clientes" value={result.linkedExisting} tone="ok" />
            <Stat label="Omitidas" value={result.skipped} />
            <Stat label="Con error" value={result.failed} tone={result.failed > 0 ? 'warn' : undefined} />
          </div>
          {result.rows.some((r) => r.status === 'error' || r.status === 'omitida') && (
            <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full text-left text-[12.5px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Fila', 'Correo', 'Resultado', 'Detalle'].map((h) => (
                      <th key={h} className="py-2 px-3 text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.filter((r) => r.status === 'error' || r.status === 'omitida').map((r) => (
                    <tr key={`${r.row}-${r.email}`} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="py-2 px-3" style={{ color: 'var(--ink-500)' }}>{r.row + 1}</td>
                      <td className="py-2 px-3" style={{ color: 'var(--ink-900)' }}>{r.email || '—'}</td>
                      <td className="py-2 px-3"><Badge kind={r.status === 'error' ? 'coral' : 'default'}>{r.status}</Badge></td>
                      <td className="py-2 px-3" style={{ color: 'var(--ink-700)' }}>{r.message ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-[13px]" style={{ color: 'var(--ink-500)' }}>
            Las personas creadas aún no reciben nada. Cuando quieras, usa "Invitar pendientes" en la lista.
          </p>
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-full text-[13.5px] font-bold transition cursor-pointer" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
              Listo
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="text-[13px] leading-relaxed" style={{ color: 'var(--ink-700)' }}>
            Una persona por renglón, en este orden de columnas: <b>{COLUMNS}</b>. Solo nombre y correo son obligatorios.
            Puedes pegar desde Excel (se separa por tabulador) o subir un CSV. Si la primera fila trae encabezados, se ignora.
          </div>
          <div className="text-[12px] px-3 py-2 rounded-lg font-mono" style={{ background: 'var(--ink-50)', color: 'var(--ink-700)' }}>
            María López,maria@correo.com,5512345678,LOGM900101AB1,Conductor,EMP-0012,Monterrey,Nuevo León
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder="Pega aquí las filas…"
            className="w-full px-3 py-2.5 rounded-lg text-[13px] outline-none focus:ring-2 font-mono"
            style={inputStyle}
            disabled={loading}
          />
          <label className="inline-flex items-center gap-2 text-[13px] font-bold cursor-pointer w-fit" style={{ color: 'var(--ink-700)' }}>
            <FileUp size={16} /> Subir archivo CSV o TXT
            <input type="file" accept=".csv,.txt,text/csv,text/plain" className="hidden" onChange={(e) => void onFile(e.target.files?.[0] ?? null)} disabled={loading} />
          </label>

          {parsed.rows.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
                Vista previa · {parsed.rows.length} persona{parsed.rows.length === 1 ? '' : 's'}{parsed.skippedHeader ? ' (encabezado ignorado)' : ''}
              </div>
              <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border)' }}>
                <table className="w-full text-left text-[12.5px]">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Nombre', 'Correo', 'Teléfono', 'RFC', 'Relación', 'Id interno'].map((h) => (
                        <th key={h} className="py-2 px-3 text-[11px] font-extrabold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--ink-500)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((r, i) => (
                      <tr key={`${i}-${r.email}`} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="py-2 px-3 whitespace-nowrap" style={{ color: 'var(--ink-900)' }}>{r.fullName || <span style={{ color: '#8B1E1E' }}>falta</span>}</td>
                        <td className="py-2 px-3 whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>{r.email || <span style={{ color: '#8B1E1E' }}>falta</span>}</td>
                        <td className="py-2 px-3" style={{ color: 'var(--ink-700)' }}>{r.phone ?? '—'}</td>
                        <td className="py-2 px-3 font-mono" style={{ color: 'var(--ink-700)' }}>{r.rfcDeclared ?? '—'}</td>
                        <td className="py-2 px-3 whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>{relationLabel(r.relationType)}</td>
                        <td className="py-2 px-3" style={{ color: 'var(--ink-700)' }}>{r.externalId ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsed.rows.length > preview.length && (
                  <div className="px-3 py-2 text-[12px]" style={{ color: 'var(--ink-500)' }}>… y {parsed.rows.length - preview.length} más</div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="text-[13px] px-3 py-2 rounded-lg" style={{ background: 'var(--danger-soft)', color: '#8B1E1E' }}>{error}</div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2.5 rounded-full text-[13.5px] font-bold transition cursor-pointer" style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}>
              Cancelar
            </button>
            <button type="button" onClick={() => void submit()} disabled={loading || parsed.rows.length === 0} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13.5px] font-bold transition hover:opacity-95 cursor-pointer disabled:opacity-60" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Cargar {parsed.rows.length > 0 ? parsed.rows.length : ''}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'ok' | 'warn' }) {
  const color = tone === 'ok' ? 'var(--brand-700)' : tone === 'warn' ? 'var(--violet-ink)' : 'var(--ink-900)'
  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--ink-50)', border: '1px solid var(--border)' }}>
      <div className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>{label}</div>
      <div className="text-[22px] font-extrabold mt-1" style={{ color }}>{value}</div>
    </div>
  )
}
