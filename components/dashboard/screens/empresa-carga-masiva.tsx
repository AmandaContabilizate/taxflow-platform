'use client'

import JSZip from 'jszip'
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Download, FileSpreadsheet, FileUp, Loader2, Send, Upload } from 'lucide-react'
import { type ReactNode, useMemo, useRef, useState } from 'react'
import { addCompanyPersons, inviteCompanyPersons } from '@/features/empresa/actions/managePersons.action'
import { type AddPersonsResult, type CompanyPersonInput, RELATION_TYPES, relationLabel } from '@/features/empresa/types'
import { EmpBtn, Pill, SectionTitle } from '../empresa/ui'

const STEPS = ['Descargar layout', 'Cargar archivo', 'Validar información', 'Confirmar y enviar']
const MAX_ROWS = 500

/** Columnas del layout oficial, en orden. "Campaña" del prototipo no existe todavía; se omite. */
const LAYOUT = [
  { key: 'first', label: 'Nombre', required: true, sample: 'María' },
  { key: 'last', label: 'Apellidos', required: true, sample: 'López Ramírez' },
  { key: 'email', label: 'Correo', required: true, sample: 'maria.lopez@correo.com' },
  { key: 'phone', label: 'Teléfono', required: false, sample: '5512345678' },
  { key: 'rfc', label: 'RFC (opcional)', required: false, sample: 'LORM900101AB1' },
  { key: 'relation', label: 'Tipo de relación', required: false, sample: 'Conductor' },
  { key: 'externalId', label: 'Identificador interno', required: false, sample: 'EMP-0012' },
  { key: 'city', label: 'Ciudad', required: false, sample: 'Monterrey' },
  { key: 'state', label: 'Estado', required: false, sample: 'Nuevo León' },
] as const
type LayoutKey = (typeof LAYOUT)[number]['key']

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i
const RFC_RE = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/

interface ParsedRow {
  n: number
  input: CompanyPersonInput
  errors: string[]
  warnings: string[]
}

function normalize(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

function headerKey(h: string): LayoutKey | 'ignore' | null {
  const n = normalize(h)
  if (!n) return null
  if (n === 'nombre' || n === 'nombres' || n === 'nombre(s)') return 'first'
  if (n.startsWith('apellido')) return 'last'
  if (n.includes('correo') || n.includes('email') || n.includes('e-mail')) return 'email'
  if (n.includes('tel') || n.includes('celular') || n.includes('whatsapp')) return 'phone'
  if (n.startsWith('rfc')) return 'rfc'
  if (n.includes('relacion')) return 'relation'
  if (n.includes('identificador') || n.includes('id interno') || n === 'id') return 'externalId'
  if (n.includes('ciudad') || n.includes('municipio')) return 'city'
  if (n.includes('estado') || n.includes('entidad')) return 'state'
  if (n.includes('campa')) return 'ignore'
  return null
}

function parseRelation(raw: string): { value: number; recognized: boolean } {
  const v = raw.trim()
  if (!v) return { value: 6, recognized: true }
  const n = Number(v)
  if (Number.isInteger(n) && n >= 1 && n <= 8) return { value: n, recognized: true }
  const match = RELATION_TYPES.find((r) => normalize(r.label) === normalize(v) || normalize(r.label).startsWith(normalize(v)))
  return match ? { value: match.value, recognized: true } : { value: 6, recognized: false }
}

function splitCsvLine(line: string, delimiter: string): string[] {
  if (delimiter !== ',') return line.split(delimiter).map((c) => c.trim())
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

function textToGrid(text: string): string[][] {
  const lines = text.split(/\r?\n/).map((l) => l.trimEnd()).filter((l) => l.trim().length > 0)
  if (lines.length === 0) return []
  const sample = lines[0]
  const delimiter = sample.includes('\t') ? '\t' : sample.split(';').length > sample.split(',').length ? ';' : ','
  return lines.map((l) => splitCsvLine(l, delimiter))
}

/** Lee la primera hoja de un .xlsx con JSZip: cadenas compartidas, cadenas en línea y números. Sin dependencias extra. */
async function xlsxToGrid(file: File): Promise<string[][]> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer())
  const parser = new DOMParser()
  const sharedXml = await zip.file('xl/sharedStrings.xml')?.async('string')
  const shared: string[] = []
  if (sharedXml) {
    const doc = parser.parseFromString(sharedXml, 'application/xml')
    for (const si of Array.from(doc.getElementsByTagName('si'))) {
      shared.push(Array.from(si.getElementsByTagName('t')).map((t) => t.textContent ?? '').join(''))
    }
  }
  const sheetName = Object.keys(zip.files).find((n) => /^xl\/worksheets\/sheet1\.xml$/i.test(n)) ?? Object.keys(zip.files).find((n) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(n))
  if (!sheetName) throw new Error('El archivo no tiene hojas.')
  const sheet = parser.parseFromString(await zip.file(sheetName)!.async('string'), 'application/xml')
  const grid: string[][] = []
  for (const row of Array.from(sheet.getElementsByTagName('row'))) {
    const r = Number(row.getAttribute('r') ?? grid.length + 1) - 1
    const cells: string[] = []
    for (const c of Array.from(row.getElementsByTagName('c'))) {
      const ref = c.getAttribute('r') ?? ''
      const col = ref.replace(/\d+/g, '').split('').reduce((acc, ch) => acc * 26 + (ch.charCodeAt(0) - 64), 0) - 1
      const t = c.getAttribute('t')
      let value = ''
      if (t === 's') value = shared[Number(c.getElementsByTagName('v')[0]?.textContent ?? -1)] ?? ''
      else if (t === 'inlineStr') value = Array.from(c.getElementsByTagName('t')).map((x) => x.textContent ?? '').join('')
      else value = c.getElementsByTagName('v')[0]?.textContent ?? ''
      cells[col >= 0 ? col : cells.length] = value.trim()
    }
    grid[r] = Array.from(cells, (v) => v ?? '')
  }
  return grid.filter((row) => row && row.some((v) => v))
}

/** Convierte la rejilla en filas validadas: por encabezados si los reconoce, si no en el orden del layout. */
function gridToRows(grid: string[][]): { rows: ParsedRow[]; byHeader: boolean } {
  if (grid.length === 0) return { rows: [], byHeader: false }
  const headerMap = grid[0].map(headerKey)
  const byHeader = headerMap.filter((k) => k && k !== 'ignore').length >= 2
  const body = byHeader ? grid.slice(1) : grid
  const get = (cells: string[], key: LayoutKey): string => {
    if (byHeader) {
      const i = headerMap.indexOf(key)
      return i >= 0 ? (cells[i] ?? '') : ''
    }
    const i = LAYOUT.findIndex((c) => c.key === key)
    return cells[i] ?? ''
  }
  const seen = new Map<string, number>()
  const rows = body.map((cells, idx) => {
    const n = idx + (byHeader ? 2 : 1)
    const first = get(cells, 'first').trim()
    const last = get(cells, 'last').trim()
    const emailRaw = get(cells, 'email').trim().toLowerCase()
    const rfc = get(cells, 'rfc').trim().toUpperCase()
    const rel = parseRelation(get(cells, 'relation'))
    const errors: string[] = []
    const warnings: string[] = []
    const fullName = [first, last].filter(Boolean).join(' ').trim()
    if (!fullName) errors.push('Falta el nombre')
    if (!emailRaw) errors.push('Falta el correo')
    else if (!EMAIL_RE.test(emailRaw)) errors.push(emailRaw.endsWith('.') ? 'El correo termina en punto' : 'Correo con formato inválido')
    else if (seen.has(emailRaw)) errors.push(`Correo repetido (fila ${seen.get(emailRaw)})`)
    else seen.set(emailRaw, n)
    if (rfc && !RFC_RE.test(rfc)) errors.push('RFC con formato inválido')
    if (!rel.recognized) warnings.push(`Relación no reconocida; se usa "${relationLabel(6)}"`)
    return {
      n,
      errors,
      warnings,
      input: {
        fullName,
        email: emailRaw,
        phone: get(cells, 'phone').trim() || null,
        rfcDeclared: rfc || null,
        relationType: rel.value,
        externalId: get(cells, 'externalId').trim() || null,
        city: get(cells, 'city').trim() || null,
        state: get(cells, 'state').trim() || null,
      },
    }
  })
  return { rows, byHeader }
}

const xmlEscape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Genera el layout como .xlsx real (OOXML mínimo con cadenas en línea) usando JSZip, sin librerías de Excel. */
async function buildLayoutXlsx(): Promise<Blob> {
  const colLetter = (i: number) => String.fromCharCode(65 + i)
  const rowXml = (r: number, values: string[]) =>
    `<row r="${r}">${values.map((v, i) => `<c r="${colLetter(i)}${r}" t="inlineStr"><is><t>${xmlEscape(v)}</t></is></c>`).join('')}</row>`
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols>${LAYOUT.map((_, i) => `<col min="${i + 1}" max="${i + 1}" width="24" customWidth="1"/>`).join('')}</cols><sheetData>${rowXml(1, LAYOUT.map((c) => c.label))}${rowXml(2, LAYOUT.map((c) => c.sample))}</sheetData></worksheet>`
  const zip = new JSZip()
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`)
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`)
  zip.file('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Personas" sheetId="1" r:id="rId1"/></sheets></workbook>`)
  zip.file('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`)
  zip.file('xl/worksheets/sheet1.xml', sheet)
  return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/**
 * Carga masiva (prototipo): 1 descargar layout · 2 cargar archivo · 3 validar · 4 confirmar y enviar. Acepta
 * .xlsx, .csv, .txt o texto pegado; valida en el navegador (nombre, correo, duplicados, RFC) y manda al backend
 * solo las filas válidas. Opcionalmente invita de inmediato a las creadas.
 */
export function EmpresaCargaMasivaScreen({ partnershipId }: { partnershipId?: number } = {}) {
  const [step, setStep] = useState(0)
  const [grid, setGrid] = useState<string[][]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [pasted, setPasted] = useState('')
  const [reading, setReading] = useState(false)
  const [over, setOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteNow, setInviteNow] = useState(true)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ add: AddPersonsResult; invited: number | null } | null>(null)
  const fileInput = useRef<HTMLInputElement | null>(null)

  const parsed = useMemo(() => gridToRows(grid), [grid])
  const valid = parsed.rows.filter((r) => r.errors.length === 0)
  const invalid = parsed.rows.filter((r) => r.errors.length > 0)

  const readFile = async (file: File | null) => {
    if (!file) return
    setReading(true)
    setError(null)
    try {
      const isXlsx = /\.xlsx$/i.test(file.name)
      const g = isXlsx ? await xlsxToGrid(file) : textToGrid(await file.text())
      if (g.length === 0) return setError('El archivo está vacío.')
      setGrid(g)
      setFileName(file.name)
      setPasted('')
    } catch (e) {
      console.error('[EmpresaCargaMasivaScreen] no se pudo leer el archivo:', e)
      setError('No pudimos leer el archivo. Usa el layout .xlsx o un CSV separado por comas.')
    } finally {
      setReading(false)
    }
  }

  const usePasted = () => {
    const g = textToGrid(pasted)
    if (g.length === 0) return setError('Pega al menos una fila.')
    setError(null)
    setGrid(g)
    setFileName(null)
  }

  const downloadErrors = () => {
    const lines = ['Fila,Nombre,Correo,Errores', ...invalid.map((r) => `${r.n},"${r.input.fullName.replace(/"/g, '""')}","${r.input.email}","${r.errors.join(' · ')}"`)]
    downloadBlob(new Blob([`﻿${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' }), 'errores-carga-masiva.csv')
  }

  const submit = async () => {
    if (valid.length === 0) return
    if (valid.length > MAX_ROWS) return setError(`Máximo ${MAX_ROWS} personas por carga. Divide el archivo.`)
    setSending(true)
    setError(null)
    try {
      const res = await addCompanyPersons(valid.map((r) => r.input), partnershipId)
      if (!res.success) return setError(res.error.message)
      let invited: number | null = null
      if (inviteNow) {
        const ids = res.value.rows.filter((r) => r.status === 'creada' && r.personId != null).map((r) => r.personId as number)
        if (ids.length > 0) {
          const inv = await inviteCompanyPersons(ids, partnershipId)
          invited = inv.success ? inv.value.sent : 0
        } else invited = 0
      }
      setResult({ add: res.value, invited })
    } catch (e) {
      console.error('[EmpresaCargaMasivaScreen] addCompanyPersons falló:', e)
      setError('No pudimos procesar la carga. Inténtalo de nuevo.')
    } finally {
      setSending(false)
    }
  }

  const reset = () => {
    setStep(0); setGrid([]); setFileName(null); setPasted(''); setError(null); setResult(null); setInviteNow(true)
  }

  return (
    <div className="emp-card flex flex-col gap-5 max-w-full">
      <div className="emp-steps" aria-label="Pasos">
        {STEPS.map((label, i) => (
          <div key={label} className={`emp-step${i === step ? ' is-active' : ''}${i < step ? ' is-done' : ''}`}>
            <span className="emp-step-num">{i < step ? '✓' : i + 1}</span>
            <span className="emp-step-label">{label}</span>
            {i < STEPS.length - 1 && <span className="emp-step-line" />}
          </div>
        ))}
      </div>

      <div key={step} className="ui-section-enter flex flex-col gap-4">
        {step === 0 && (
          <>
            <SectionTitle sub="Usa esta plantilla para que tu archivo se valide correctamente. Solo nombre, apellidos y correo son obligatorios.">1. Descarga el layout oficial</SectionTitle>
            <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid var(--border)' }}>
              <table className="emp-table">
                <thead><tr>{LAYOUT.map((c) => <th key={c.key}>{c.label}</th>)}</tr></thead>
                <tbody>
                  <tr>{LAYOUT.map((c) => <td key={c.key} style={{ color: 'var(--ink-400)' }}>{c.sample}</td>)}</tr>
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <EmpBtn kind="accent" onClick={() => void buildLayoutXlsx().then((b) => downloadBlob(b, 'layout-personas-contabilizate.xlsx'))}><Download size={16} /> Descargar layout .xlsx</EmpBtn>
              <span className="text-[12.5px]" style={{ color: 'var(--ink-400)' }}>Tipo de relación: {RELATION_TYPES.map((r) => r.label).join(' · ')}</span>
            </div>
            <div><EmpBtn onClick={() => setStep(1)}>Continuar <ArrowRight size={16} /></EmpBtn></div>
          </>
        )}

        {step === 1 && (
          <>
            <SectionTitle sub="Sube el layout lleno (.xlsx o .csv) o pega las filas desde Excel.">2. Carga tu archivo</SectionTitle>
            <button
              type="button"
              className={`emp-upload-zone w-full${over ? ' is-over' : ''}`}
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setOver(true) }}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => { e.preventDefault(); setOver(false); void readFile(e.dataTransfer.files?.[0] ?? null) }}
              disabled={reading}
            >
              {reading ? <Loader2 size={30} className="animate-spin" /> : <FileUp size={30} />}
              <div className="text-[14px] font-extrabold" style={{ color: 'var(--ink-900)' }}>{fileName ?? 'Arrastra tu archivo aquí o haz clic para elegirlo'}</div>
              <div className="text-[12.5px] mt-1" style={{ color: 'var(--ink-500)' }}>.xlsx, .csv o .txt · máximo {MAX_ROWS} personas</div>
              <input ref={fileInput} type="file" accept=".xlsx,.csv,.txt,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={(e) => { void readFile(e.target.files?.[0] ?? null); e.target.value = '' }} />
            </button>
            <details className="text-[13px]" style={{ color: 'var(--ink-500)' }}>
              <summary className="cursor-pointer font-bold" style={{ color: 'var(--ink-700)' }}>O pega las filas desde Excel</summary>
              <div className="flex flex-col gap-2 mt-2">
                <textarea value={pasted} onChange={(e) => setPasted(e.target.value)} rows={6} placeholder="Nombre	Apellidos	Correo	Teléfono	RFC	Tipo de relación	Identificador interno	Ciudad	Estado" className="emp-input w-full font-mono text-[12.5px]" />
                <div><EmpBtn kind="ghost" small onClick={usePasted} disabled={!pasted.trim()}>Usar lo pegado</EmpBtn></div>
              </div>
            </details>
            {grid.length > 0 && (
              <div className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--emp-green)' }}>
                <CheckCircle2 size={16} /> {parsed.rows.length} fila{parsed.rows.length === 1 ? '' : 's'} leída{parsed.rows.length === 1 ? '' : 's'}{parsed.byHeader ? ' con encabezados' : ' en el orden del layout'}.
              </div>
            )}
            {error && <ErrorBox>{error}</ErrorBox>}
            <div className="flex gap-2">
              <EmpBtn kind="ghost" onClick={() => setStep(0)}><ArrowLeft size={16} /> Atrás</EmpBtn>
              <EmpBtn onClick={() => setStep(2)} disabled={parsed.rows.length === 0}>Validar <ArrowRight size={16} /></EmpBtn>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <SectionTitle sub="Revisa lo que encontramos. Las filas con error no se cargan; corrígelas en el archivo y vuelve a subirlo, o continúa solo con las válidas.">3. Valida la información</SectionTitle>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Filas leídas" value={parsed.rows.length} />
              <Stat label="Válidas" value={valid.length} tone="green" />
              <Stat label="Con error" value={invalid.length} tone={invalid.length > 0 ? 'red' : undefined} />
            </div>
            <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid var(--border)' }}>
              <table className="emp-table">
                <thead><tr><th>Fila</th><th>Nombre</th><th>Correo</th><th>Teléfono</th><th>RFC</th><th>Relación</th><th>Resultado</th></tr></thead>
                <tbody>
                  {parsed.rows.slice(0, 200).map((r) => (
                    <tr key={r.n}>
                      <td style={{ color: 'var(--ink-400)' }}>{r.n}</td>
                      <td style={{ color: 'var(--ink-900)', fontWeight: 700 }}>{r.input.fullName || <span style={{ color: 'var(--emp-red)' }}>falta</span>}</td>
                      <td style={{ color: 'var(--ink-700)' }}>{r.input.email || <span style={{ color: 'var(--emp-red)' }}>falta</span>}</td>
                      <td style={{ color: 'var(--ink-700)' }}>{r.input.phone ?? '—'}</td>
                      <td><span className="emp-mono" style={{ color: 'var(--ink-700)' }}>{r.input.rfcDeclared ?? '—'}</span></td>
                      <td className="whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>{relationLabel(r.input.relationType)}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {r.errors.length === 0 ? <Pill tone="green">Válida</Pill> : r.errors.map((e) => <Pill key={e} tone="red">{e}</Pill>)}
                          {r.warnings.map((w) => <Pill key={w} tone="amber">{w}</Pill>)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsed.rows.length > 200 && <div className="px-4 py-2 text-[12px]" style={{ color: 'var(--ink-400)' }}>… y {parsed.rows.length - 200} filas más</div>}
            </div>
            <div className="flex flex-wrap gap-2">
              <EmpBtn kind="ghost" onClick={() => setStep(1)}><ArrowLeft size={16} /> Atrás</EmpBtn>
              {invalid.length > 0 && <EmpBtn kind="ghost" onClick={downloadErrors}><Download size={16} /> Descargar reporte de errores</EmpBtn>}
              <EmpBtn onClick={() => setStep(3)} disabled={valid.length === 0}>Continuar con {valid.length} válida{valid.length === 1 ? '' : 's'} <ArrowRight size={16} /></EmpBtn>
            </div>
          </>
        )}

        {step === 3 && !result && (
          <>
            <SectionTitle sub="Al confirmar, las personas quedan registradas en tu empresa. Si ya eran clientes de Contabilízate, se liga su cuenta.">4. Confirma y envía</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Stat label="Se cargarán" value={valid.length} tone="green" />
              <Stat label="Se omiten por error" value={invalid.length} tone={invalid.length > 0 ? 'amber' : undefined} />
              <Stat label="Origen" text={fileName ?? 'Texto pegado'} />
            </div>
            <label className="flex items-start gap-3 px-4 py-3 rounded-2xl cursor-pointer" style={{ background: 'var(--emp-surface-2)', border: '1px solid var(--border)' }}>
              <input type="checkbox" className="emp-check mt-0.5" checked={inviteNow} onChange={(e) => setInviteNow(e.target.checked)} />
              <span>
                <span className="block text-[13.5px] font-bold" style={{ color: 'var(--ink-900)' }}>Enviar la invitación de inmediato</span>
                <span className="block text-[12.5px]" style={{ color: 'var(--ink-500)' }}>A cada persona nueva le llega un correo con la liga para definir su contraseña. Si lo desmarcas, las invitas después desde Invitaciones.</span>
              </span>
            </label>
            {error && <ErrorBox>{error}</ErrorBox>}
            <div className="flex gap-2">
              <EmpBtn kind="ghost" onClick={() => setStep(2)} disabled={sending}><ArrowLeft size={16} /> Atrás</EmpBtn>
              <EmpBtn onClick={() => void submit()} disabled={sending || valid.length === 0}>
                {sending ? <Loader2 size={16} className="animate-spin" /> : inviteNow ? <Send size={16} /> : <Upload size={16} />} {inviteNow ? 'Cargar e invitar' : 'Cargar'} {valid.length}
              </EmpBtn>
            </div>
          </>
        )}

        {step === 3 && result && (
          <>
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'var(--emp-green-bg)', color: 'var(--emp-green)' }}><CheckCircle2 size={22} /></span>
              <div>
                <p className="emp-section-title">Carga terminada</p>
                <p className="emp-section-sub" style={{ margin: 0 }}>{fileName ?? 'Texto pegado'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <Stat label="Creadas" value={result.add.created} tone="green" />
              <Stat label="Ya eran clientes" value={result.add.linkedExisting} tone="green" />
              <Stat label="Omitidas" value={result.add.skipped} />
              <Stat label="Con error" value={result.add.failed} tone={result.add.failed > 0 ? 'red' : undefined} />
              <Stat label="Invitadas" text={result.invited == null ? 'Después' : String(result.invited)} tone={result.invited ? 'green' : undefined} />
            </div>
            {result.add.rows.some((r) => r.status === 'error' || r.status === 'omitida') && (
              <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid var(--border)' }}>
                <table className="emp-table">
                  <thead><tr><th>Fila</th><th>Correo</th><th>Resultado</th><th>Detalle</th></tr></thead>
                  <tbody>
                    {result.add.rows.filter((r) => r.status === 'error' || r.status === 'omitida').map((r) => (
                      <tr key={`${r.row}-${r.email}`}>
                        <td style={{ color: 'var(--ink-400)' }}>{valid[r.row]?.n ?? r.row + 1}</td>
                        <td style={{ color: 'var(--ink-900)' }}>{r.email || '—'}</td>
                        <td><Pill tone={r.status === 'error' ? 'red' : 'gray'}>{r.status}</Pill></td>
                        <td style={{ color: 'var(--ink-700)' }}>{r.message ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex gap-2">
              <EmpBtn kind="ghost" onClick={reset}><FileSpreadsheet size={16} /> Hacer otra carga</EmpBtn>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, text, tone }: { label: string; value?: number; text?: string; tone?: 'green' | 'amber' | 'red' }) {
  const color = tone === 'green' ? 'var(--emp-green)' : tone === 'amber' ? 'var(--emp-amber)' : tone === 'red' ? 'var(--emp-red)' : 'var(--ink-900)'
  return (
    <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--emp-surface-2)', border: '1px solid var(--border)' }}>
      <div className="emp-kpi-label" style={{ marginBottom: 2 }}>{label}</div>
      <div className="font-extrabold truncate" style={{ fontSize: text ? 14 : 22, color }}>{text ?? value}</div>
    </div>
  )
}

function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[13px] px-4 py-2.5 rounded-xl" style={{ background: 'var(--emp-red-bg)', color: 'var(--emp-red)' }}>
      <AlertCircle size={16} /> {children}
    </div>
  )
}
