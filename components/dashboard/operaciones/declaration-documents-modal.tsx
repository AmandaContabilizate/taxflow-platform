'use client'

import { AlertCircle, CheckCircle2, Download, FileCheck2, FileText, Loader2, UploadCloud } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { MONO } from '../constants'
import { Modal } from '../modal'
import { Badge } from '../ui'
import { getDeclarationDocumentsAction, type DeclarationDocumentItem } from '@/features/operations/actions/getDeclarationDocuments.action'
import { uploadDeclarationDocumentAction } from '@/features/operations/actions/uploadDeclarationDocument.action'

interface Props {
  open: boolean
  onClose: () => void
  declarationId: number
  periodo: string
  ejercicio: number
  rfc: string
  legalName: string
  onDocumentUploaded?: (statusId: number, statusLabel: string) => void
}

type DocType = 'Declaration' | 'PaymentLine'

export function DeclarationDocumentsModal({ open, onClose, declarationId, periodo, ejercicio, rfc, legalName, onDocumentUploaded }: Props) {
  const [loading, setLoading] = useState(false)
  const [documents, setDocuments] = useState<DeclarationDocumentItem[]>([])
  const [selectedType, setSelectedType] = useState<DocType>('Declaration')
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadDocuments = async () => {
    setLoading(true)
    setErrorMsg(null)
    const res = await getDeclarationDocumentsAction(declarationId)
    setLoading(false)
    if (res.success) setDocuments(res.value.documents)
    else setErrorMsg(res.error.message)
  }

  useEffect(() => {
    if (open) {
      void loadDocuments()
      setFile(null)
      setIsDragging(false)
      setSuccessMsg(null)
      setErrorMsg(null)
    }
  }, [open, declarationId])

  const validateAndSetFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith('.pdf')) return setErrorMsg('Solo se permiten archivos en formato PDF.')
    if (f.size > 15 * 1024 * 1024) return setErrorMsg('El archivo no debe exceder los 15 MB.')
    setErrorMsg(null)
    setFile(f)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) validateAndSetFile(selected)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) validateAndSetFile(dropped)
  }

  const handleUpload = async () => {
    if (!file) return setErrorMsg('Por favor selecciona un archivo PDF para agregar.')
    setUploading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const formData = new FormData()
    formData.append('documentType', selectedType)
    formData.append('file', file)

    const res = await uploadDeclarationDocumentAction(declarationId, formData)
    setUploading(false)

    if (res.success) {
      setSuccessMsg(`Documento agregado con éxito. Declaración actualizada a Presentada.`)
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      void loadDocuments()
      onDocumentUploaded?.(res.value.statusId, res.value.statusLabel)
    } else setErrorMsg(res.error.message)
  }

  const acuses = documents.filter((d) => d.type === 'Declaration' && d.hasFile)
  const lineas = documents.filter((d) => d.type === 'PaymentLine' && d.hasFile)

  return (
    <Modal isOpen={open} onClose={onClose} title="Comprobantes SAT">
      <div className="flex flex-col gap-4">
        <div className="p-2.5 rounded-xl flex items-center justify-between gap-2 text-[12.5px] font-semibold" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--ink-900)' }}>{legalName}</span>
          <span style={{ color: 'var(--ink-500)' }}><code style={MONO}>{rfc}</code> • {periodo} {ejercicio}</span>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl flex items-center gap-2 text-[12px] font-semibold" style={{ background: 'var(--coral-light)', color: 'var(--coral)', border: '1px solid var(--coral-border)' }}>
            <AlertCircle size={15} className="shrink-0" /> <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-xl flex items-center gap-2 text-[12px] font-semibold" style={{ background: 'var(--brand-light)', color: 'var(--brand-dark)', border: '1px solid var(--brand-border)' }}>
            <CheckCircle2 size={15} className="shrink-0" /> <span>{successMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="py-6 flex items-center justify-center gap-2 text-[13px]" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={16} className="animate-spin" /> Cargando documentos…
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <DocCard title="Acuses de Declaración" icon={<FileCheck2 size={16} style={{ color: 'var(--sky)' }} />} items={acuses} emptyText="Sin acuses agregados" />
            <DocCard title="Líneas de Captura" icon={<FileText size={16} style={{ color: 'var(--amber)' }} />} items={lineas} emptyText="Sin líneas agregadas" />
          </div>
        )}

        <div className="flex flex-col gap-2.5 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="text-[11px] font-extrabold uppercase tracking-wide" style={{ color: 'var(--ink-500)' }}>Agregar Nuevo Documento</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelectedType('Declaration')}
              className="px-3 py-2 rounded-xl text-[12px] font-bold border text-center transition"
              style={{
                background: selectedType === 'Declaration' ? 'var(--nav-active-bg)' : 'var(--card)',
                color: selectedType === 'Declaration' ? 'var(--nav-active-fg)' : 'var(--foreground)',
                borderColor: selectedType === 'Declaration' ? 'transparent' : 'var(--border)',
              }}
            >
              📄 Acuse de Declaración
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('PaymentLine')}
              className="px-3 py-2 rounded-xl text-[12px] font-bold border text-center transition"
              style={{
                background: selectedType === 'PaymentLine' ? 'var(--nav-active-bg)' : 'var(--card)',
                color: selectedType === 'PaymentLine' ? 'var(--nav-active-fg)' : 'var(--foreground)',
                borderColor: selectedType === 'PaymentLine' ? 'transparent' : 'var(--border)',
              }}
            >
              💳 Línea de Captura
            </button>
          </div>

          <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" onChange={handleFileChange} className="hidden" />

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="p-3.5 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition hover:opacity-90 text-center"
            style={{
              background: isDragging ? 'var(--hero-info)' : 'var(--card)',
              borderColor: isDragging || file ? 'var(--sky)' : 'var(--border-strong)',
            }}
          >
            <UploadCloud size={20} style={{ color: isDragging || file ? 'var(--sky)' : 'var(--ink-400)' }} />
            {file ? (
              <>
                <div className="text-[12px] font-bold" style={{ color: 'var(--ink-900)' }}>{file.name}</div>
                <div className="text-[10.5px]" style={{ color: 'var(--ink-500)' }}>{(file.size / 1024).toFixed(1)} KB • Clic para cambiar archivo</div>
              </>
            ) : (
              <>
                <div className="text-[12px] font-bold" style={{ color: 'var(--ink-900)' }}>
                  {isDragging ? '¡Suelta el archivo PDF aquí!' : 'Arrastra o selecciona el archivo PDF'}
                </div>
                <div className="text-[10.5px]" style={{ color: 'var(--ink-500)' }}>Máximo 15 MB • Formato PDF</div>
              </>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 mt-0.5">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-[12px] font-bold border" style={{ background: 'var(--card)', borderColor: 'var(--border-strong)', color: 'var(--foreground)' }}>Cerrar</button>
            <button
              type="button"
              disabled={!file || uploading}
              onClick={handleUpload}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold text-white transition disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#00D3A1 0%,#00AD87 100%)' }}
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
              {uploading ? 'Agregando…' : 'Agregar y Marcar Presentada'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function DocCard({ title, icon, items, emptyText }: { title: string; icon: React.ReactNode; items: DeclarationDocumentItem[]; emptyText: string }) {
  return (
    <div className="p-3 rounded-2xl border flex flex-col gap-2" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between gap-2 border-b pb-2" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-1.5">{icon} <span className="text-[13px] font-extrabold" style={{ color: 'var(--ink-900)' }}>{title}</span></div>
        <Badge kind={items.length > 0 ? 'brand' : 'default'}>{items.length}</Badge>
      </div>
      <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
        {items.length === 0 ? (
          <div className="py-4 text-center text-[11.5px] font-semibold" style={{ color: 'var(--ink-400)' }}>{emptyText}</div>
        ) : (
          items.map((doc, idx) => (
            <div key={idx} className="p-2 rounded-xl flex items-center justify-between gap-2 border text-[11.5px]" style={{ background: 'var(--ink-50)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold" style={{ color: 'var(--ink-800)', fontSize: '11.5px' }}>
                  {doc.updatedAt ? new Date(doc.updatedAt).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Fecha no registrada'}
                </span>
              </div>
              {doc.sasUrl && (
                <a href={doc.sasUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg text-white font-bold shrink-0 transition hover:opacity-85" style={{ background: 'var(--sky)' }} title="Descargar PDF">
                  <Download size={13} />
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
