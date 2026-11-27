'use client'

import { FileUp, Loader2, Trash2, UploadCloud } from 'lucide-react'
import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { invalidateDeclarationData } from '@/features/declarations/hooks/useDeclarationQueries'
import { removeThirdPartyInvoice } from '@/features/declarations/actions/removeThirdPartyInvoice.action'
import { uploadThirdPartyInvoice } from '@/features/declarations/actions/uploadThirdPartyInvoice.action'
import type { ThirdPartyInvoiceResult } from '@/features/declarations/types'
import { money } from '../declaraciones/parts'
import { MONO } from '../constants'
import { Modal } from '../modal'
import { Btn } from '../ui'
import { InlineNotice } from './parts-612'

const MAX_XML_BYTES = 900 * 1024

function ResultadoSubida({ r }: { r: ThirdPartyInvoiceResult }) {
  return (
    <div className="flex flex-col gap-2 text-[13px]" style={{ color: 'var(--ink-700)' }}>
      <code style={{ ...MONO, fontSize: '12px', color: 'var(--ink-900)' }}>{r.uuid}</code>
      <span>
        {r.emitterName ?? 'Emisor'} · <code style={MONO}>{r.emitterRfc}</code>
      </span>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span>Subtotal</span>
        <span style={{ ...MONO, textAlign: 'right' }}>{money(r.subTotal)}</span>
        <span>IVA trasladado</span>
        <span style={{ ...MONO, textAlign: 'right' }}>{money(r.transferredIva)}</span>
        <span className="font-semibold">Total</span>
        <span className="font-semibold" style={{ ...MONO, textAlign: 'right' }}>{money(r.total)}</span>
      </div>
      <InlineNotice kind="success">{r.message}</InlineNotice>
    </div>
  )
}

function SubirCfdiTercerosModal({ open, onClose, declarationId }: { open: boolean; onClose: () => void; declarationId: number }) {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ThirdPartyInvoiceResult | null>(null)

  const close = () => {
    setFile(null)
    setError(null)
    setResult(null)
    onClose()
  }

  const pick = (f: File | undefined) => {
    setResult(null)
    if (f && f.size > MAX_XML_BYTES) {
      setFile(null)
      setError('El archivo no debe exceder 900 KB.')
      return
    }
    setError(null)
    setFile(f ?? null)
  }

  const upload = async () => {
    if (!file) return setError('Selecciona el XML del CFDI.')
    setUploading(true)
    setError(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await uploadThirdPartyInvoice(declarationId, formData)
      if (!res.success) return setError(res.error.message)
      setResult(res.value)
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
      void invalidateDeclarationData(queryClient, declarationId)
    } catch {
      setError('No se pudo subir el archivo. Intenta de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  const another = () => {
    setResult(null)
    setError(null)
    setFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <Modal
      isOpen={open}
      onClose={close}
      title="Subir CFDI a cuenta de terceros"
      subtitle="XML 4.0 de ingreso, PUE, con el RFC del contribuyente en ACuentaTerceros."
      footer={
        <div className="flex justify-end gap-2">
          <Btn kind="ghost" size="sm" onClick={close}>{result ? 'Cerrar' : 'Cancelar'}</Btn>
          {result ? (
            <Btn size="sm" onClick={another}>
              <FileUp size={14} /> Subir otro
            </Btn>
          ) : (
            <Btn size="sm" onClick={upload} disabled={!file || uploading}>
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />} Subir
            </Btn>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <input
          ref={inputRef}
          type="file"
          accept=".xml,text/xml"
          onChange={(e) => pick(e.target.files?.[0])}
          className="hidden"
        />
        {!result && (
          <div
            onClick={() => inputRef.current?.click()}
            className="p-3.5 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition hover:opacity-90 text-center text-[13px]"
            style={{ background: 'var(--card)', borderColor: file ? 'var(--sky)' : 'var(--border-strong)', color: 'var(--ink-700)' }}
          >
            <UploadCloud size={20} style={{ color: file ? 'var(--sky)' : 'var(--ink-400)' }} />
            {file ? <span className="font-semibold" style={{ color: 'var(--ink-900)' }}>{file.name}</span> : <span>Haz clic para elegir el XML</span>}
          </div>
        )}
        {error && <InlineNotice kind="error">{error}</InlineNotice>}
        {result && <ResultadoSubida r={result} />}
      </div>
    </Modal>
  )
}

export function SubirCfdiTercerosButton({ declarationId }: { declarationId: number }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12.5px] font-bold transition hover:opacity-90"
        style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
      >
        <FileUp size={14} /> Subir CFDI a cuenta de terceros
      </button>
      <SubirCfdiTercerosModal open={open} onClose={() => setOpen(false)} declarationId={declarationId} />
    </>
  )
}

export function QuitarCfdiTerceros({ declarationId, invoiceId }: { declarationId: number; invoiceId: number }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const close = () => {
    setOpen(false)
    setError(null)
  }

  const remove = async () => {
    setRemoving(true)
    setError(null)
    const res = await removeThirdPartyInvoice(declarationId, invoiceId)
    setRemoving(false)
    if (!res.success) return setError(res.error.message)
    close()
    void invalidateDeclarationData(queryClient, declarationId)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 -mx-1 px-1 py-0.5 rounded text-[10.5px] font-semibold transition-colors hover:bg-[var(--ink-50)]"
        style={{ color: 'var(--danger-ink)' }}
      >
        <Trash2 size={11} /> Quitar
      </button>
      <Modal
        isOpen={open}
        onClose={close}
        title="Quitar CFDI a cuenta de terceros"
        maxWidth={440}
        footer={
          <div className="flex justify-end gap-2">
            <Btn kind="ghost" size="sm" onClick={close}>Cancelar</Btn>
            <Btn size="sm" onClick={remove} disabled={removing}>
              {removing && <Loader2 size={14} className="animate-spin" />} Quitar
            </Btn>
          </div>
        }
      >
        <div className="flex flex-col gap-3 text-[13px]" style={{ color: 'var(--ink-700)' }}>
          <p>El CFDI dejará de contar en esta declaración. Después recalcula para actualizar el cálculo.</p>
          {error && <InlineNotice kind="error">{error}</InlineNotice>}
        </div>
      </Modal>
    </>
  )
}
