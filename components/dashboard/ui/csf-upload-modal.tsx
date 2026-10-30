'use client'

import { CheckCircle2, FileText, Loader2, UploadCloud } from 'lucide-react'
import { useRef, useState } from 'react'
import {
  uploadTaxCertificate,
  uploadTaxCertificateStaff,
  type UploadTaxCertificateResult,
} from '@/features/taxpayers/actions/uploadTaxCertificate.action'
import { useOptionalRfcStore } from '@/features/taxpayers/stores/rfcStore'
import { Modal } from '../modal'
import { Btn } from './btn'

interface Props {
  isOpen: boolean
  onClose: () => void
  rfc: string
  /**
   * Backoffice: contribuyente ajeno al que se le sube la constancia (la que mandó el cliente).
   * Sin él, la sube el propio cliente para su RFC y se refresca su store de RFC.
   */
  taxpayerId?: number
  /** Antigüedad máxima aceptada (Csf:MaxAgeDays). Solo para el texto de ayuda. */
  maxAgeDays?: number
  /** Se llama tras una subida exitosa, después de refrescar el store de RFC. */
  onUploaded?: (result: UploadTaxCertificateResult) => void
}

const MAX_FILE_MB = 5

/** Mensajes en español por errorCode del backend (el título del ProblemDetails no se parsea). */
function uploadErrorMessage(errorCode: string | undefined, fallback: string): string {
  switch (errorCode) {
    case 'CSF_DATE_NOT_FOUND':
      return 'No pudimos leer la fecha de emisión. Sube la constancia en PDF tal como la entrega el SAT (no una foto ni un escaneo).'
    case 'CSF_TOO_OLD':
      return fallback || 'Tu constancia es demasiado antigua. Descarga una reciente en el portal del SAT.'
    case 'CSF_RFC_MISMATCH':
      return 'Esta constancia no corresponde a este RFC.'
    case 'NO_REGIMES_FOUND':
      return 'No pudimos leer tu régimen fiscal en la constancia. Descárgala de nuevo del portal del SAT e inténtalo otra vez.'
    case 'FILE_REQUIRED':
      return 'Selecciona el archivo PDF de tu constancia.'
    default:
      return fallback || 'No pudimos subir tu constancia. Intenta de nuevo.'
  }
}

/**
 * Plan B cuando el SAT no responde: el cliente sube su constancia de situación fiscal (PDF) y
 * el backend lee régimen y actividades del texto. Nunca sustituye la validación de la CIEC —
 * esa solo la hace el SAT. Se abre desde la pantalla de bloqueo (CiecBlockedScreen) cuando la
 * espera configurada ya se cumplió (spec-venta-con-constancia-subida.md).
 */
export function CsfUploadModal({ isOpen, onClose, rfc, taxpayerId, maxAgeDays = 1, onUploaded }: Props) {
  // Opcional: en el backoffice el modal puede vivir fuera del RfcProvider del cliente.
  const rfcStore = useOptionalRfcStore()
  const isStaff = taxpayerId !== undefined
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<UploadTaxCertificateResult | null>(null)

  const reset = () => {
    setFile(null)
    setError(null)
    setResult(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleClose = () => {
    if (loading) return
    reset()
    onClose()
  }

  const handlePick = (picked: File | null) => {
    setError(null)
    if (!picked) {
      setFile(null)
      return
    }
    const isPdf = picked.type === 'application/pdf' || picked.name.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      setFile(null)
      setError('Solo aceptamos el PDF que entrega el SAT.')
      return
    }
    if (picked.size > MAX_FILE_MB * 1024 * 1024) {
      setFile(null)
      setError(`El archivo pesa más de ${MAX_FILE_MB} MB. Descarga la constancia de nuevo desde el portal del SAT.`)
      return
    }
    setFile(picked)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || loading) return
    setLoading(true)
    setError(null)

    const res = isStaff ? await uploadTaxCertificateStaff(taxpayerId, file) : await uploadTaxCertificate(rfc, file)
    if (!res.success) {
      setLoading(false)
      setError(uploadErrorMessage(res.error.errorCode, res.error.message))
      return
    }

    // Cliente: el store trae hasTaxCertificate=true → las pantallas de compra se desbloquean solas.
    // Backoffice: el store es el del gerente; el padre recarga con onUploaded.
    if (!isStaff && rfcStore) await rfcStore.refresh()
    setLoading(false)
    setResult(res.value)
    onUploaded?.(res.value)
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isStaff ? 'Subir constancia del cliente' : 'Sube tu constancia'}>
      {result ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={22} className="mt-0.5 shrink-0" style={{ color: 'var(--brand-600)' }} />
            <div className="text-[14px] leading-relaxed" style={{ color: 'var(--ink-700)' }}>
              <div className="font-bold" style={{ color: 'var(--ink-900)' }}>
                Listo: leímos tu constancia del {new Date(result.fechaEmision).toLocaleDateString('es-MX')}
              </div>
              <div className="mt-1">
                {result.regimenes.length === 1 ? 'Régimen detectado' : 'Regímenes detectados'}:{' '}
                <strong style={{ color: 'var(--ink-900)' }}>{result.regimenes.join(', ')}</strong>.
              </div>
              <div className="mt-2 text-[13px]" style={{ color: 'var(--ink-500)' }}>
                {isStaff
                  ? 'El contribuyente ya puede contratar planes y trámites. Queda "constancia sin verificar" hasta que el robot la contraste con el SAT.'
                  : 'Ya puedes ver tus planes y contratar. Cuando el SAT vuelva a responder confirmaremos tu información automáticamente.'}
              </div>
            </div>
          </div>
          <Btn kind="brand" block onClick={handleClose}>
            Continuar
          </Btn>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="text-[13.5px] leading-relaxed" style={{ color: 'var(--ink-500)' }}>
            Sube la{' '}
            <strong style={{ color: 'var(--ink-900)' }}>constancia de situación fiscal</strong> en PDF del RFC{' '}
            <strong style={{ color: 'var(--ink-900)' }}>{rfc}</strong>.{' '}
            {maxAgeDays <= 1
              ? 'Debe estar emitida hoy o ayer: descárgala nueva antes de subirla.'
              : `Debe ser reciente (máximo ${maxAgeDays} días desde su emisión).`}{' '}
            {isStaff
              ? 'Tal como la mandó el cliente, sin editar: leemos RFC, fecha y régimen del texto del PDF.'
              : 'La descargas en el portal del SAT o en la app SAT ID.'}
          </div>

          <label
            className="rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-center cursor-pointer"
            style={{ background: 'var(--input)', border: '1.5px dashed var(--border-strong)', color: 'var(--ink-700)' }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              disabled={loading}
              onChange={(e) => handlePick(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <>
                <FileText size={26} />
                <div className="text-[14px] font-semibold break-all" style={{ color: 'var(--ink-900)' }}>
                  {file.name}
                </div>
                <div className="text-[12.5px]">{(file.size / 1024).toFixed(0)} KB · toca para cambiar</div>
              </>
            ) : (
              <>
                <UploadCloud size={26} />
                <div className="text-[14px] font-semibold" style={{ color: 'var(--ink-900)' }}>
                  Elegir archivo PDF
                </div>
                <div className="text-[12.5px]">Solo el PDF original del SAT, hasta {MAX_FILE_MB} MB</div>
              </>
            )}
          </label>

          {error && (
            <div
              className="text-[13px] font-semibold px-4 py-2.5 rounded-xl"
              style={{ background: 'var(--coral-soft)', color: 'var(--violet-ink)' }}
            >
              {error}
            </div>
          )}

          <Btn type="submit" kind="brand" block disabled={!file || loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Leyendo tu constancia…
              </>
            ) : (
              'Subir mi constancia'
            )}
          </Btn>

          <div className="text-[12px] leading-relaxed" style={{ color: 'var(--ink-500)' }}>
            {isStaff
              ? 'La CIEC la valida únicamente el SAT; la constancia no la sustituye. El régimen nunca lo elige el vendedor: sale del PDF.'
              : 'Tu contraseña CIEC la valida únicamente el SAT; subir la constancia no la sustituye. Con ella documentamos tu régimen para que puedas contratar hoy.'}
          </div>
        </form>
      )}
    </Modal>
  )
}
