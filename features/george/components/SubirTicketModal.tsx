'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Loader2, Upload } from 'lucide-react'
import { uploadTicket } from '../actions/uploadTicket.action'

interface SubirTicketModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (job_id: string) => void
}

export function SubirTicketModal({ open, onOpenChange, onSuccess }: SubirTicketModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const cameraAttemptedRef = useRef(false)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }, [])

  const activateCamera = useCallback(async () => {
    if (cameraAttemptedRef.current || cameraActive) return

    cameraAttemptedRef.current = true

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setCameraActive(true)
        setCameraPermission(true)
      }
    } catch (e) {
      console.error('[SubirTicketModal] Camera error:', e)
      setCameraPermission(false)
      setError('No se pudo acceder a la cámara')
    }
  }, [cameraActive])

  // Auto-activate camera when modal opens
  useEffect(() => {
    if (!open) {
      stopCamera()
      cameraAttemptedRef.current = false
      return
    }

    // Solo intentar activar una vez
    if (cameraPermission !== false && !cameraAttemptedRef.current) {
      void activateCamera()
    }

    return () => {
      stopCamera()
    }
  }, [open, stopCamera, activateCamera, cameraPermission])

  const capturePhoto = async () => {
    if (!canvasRef.current || !videoRef.current) return

    const context = canvasRef.current.getContext('2d')
    if (!context) return

    canvasRef.current.width = videoRef.current.videoWidth
    canvasRef.current.height = videoRef.current.videoHeight
    context.drawImage(videoRef.current, 0, 0)

    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return

      const file = new File([blob], `ticket-${Date.now()}.jpg`, { type: 'image/jpeg' })
      setFileName(file.name)
      setLoading(true)
      stopCamera()

      try {
        const result = await uploadTicket(file)

        if (!result.success) {
          setError(result.error.message)
          setLoading(false)
          return
        }

        // Success
        setFileName(null)
        onOpenChange(false)
        onSuccess?.(result.value.job_id)
      } catch (e) {
        setError('Error al subir el ticket')
        setLoading(false)
      }
    }, 'image/jpeg', 0.95)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida (JPG, PNG, etc)')
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen no puede ser mayor a 10MB')
      return
    }

    setError(null)
    setFileName(file.name)
    setLoading(true)

    try {
      const result = await uploadTicket(file)

      if (!result.success) {
        setError(result.error.message)
        setLoading(false)
        return
      }

      // Success
      setFileName(null)
      onOpenChange(false)
      onSuccess?.(result.value.job_id)
    } catch (e) {
      setError('Error al subir el ticket')
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-[18px] font-bold" style={{ color: 'var(--ink-900)' }}>
            Subir Recibo
          </h2>
          <button
            onClick={() => {
              onOpenChange(false)
              setError(null)
              setFileName(null)
              if (fileInputRef.current) fileInputRef.current.value = ''
            }}
            className="p-2 rounded-lg transition hover:bg-gray-100"
            disabled={loading}
          >
            <X size={20} style={{ color: 'var(--ink-500)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="p-3 rounded-lg text-[13px] mb-4" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
              {error}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={loading}
          />

          {/* Camera Preview */}
          {cameraActive ? (
            <div className="space-y-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-xl"
                style={{ maxHeight: '300px', objectFit: 'cover' }}
              />
              <canvas ref={canvasRef} className="hidden" />

              <button
                onClick={() => void capturePhoto()}
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg font-medium text-white transition"
                style={{
                  backgroundColor: loading ? 'var(--ink-200)' : 'var(--primary)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    Procesando...
                  </div>
                ) : (
                  'Capturar Foto'
                )}
              </button>

              <button
                onClick={() => stopCamera()}
                disabled={loading}
                className="w-full py-2 px-4 rounded-lg text-[13px] transition"
                style={{
                  backgroundColor: 'var(--ink-50)',
                  color: 'var(--ink-700)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                Usar archivo en su lugar
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full py-8 px-4 rounded-xl border-2 border-dashed transition flex flex-col items-center justify-center gap-3"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: loading ? 'var(--ink-50)' : 'transparent',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              <Upload size={32} style={{ color: 'var(--primary)' }} />
              <div>
                <div className="text-[14px] font-medium" style={{ color: 'var(--ink-900)' }}>
                  Sube tu recibo
                </div>
                <div className="text-[12px] mt-1" style={{ color: 'var(--ink-500)' }}>
                  JPG, PNG - Máx 10MB
                </div>
              </div>
            </button>
          )}

          <div className="mt-4 p-3 rounded-lg text-[12px]" style={{ backgroundColor: 'var(--ink-50)', color: 'var(--ink-600)' }}>
            <div className="font-medium mb-2">Consejos para mejor resultados:</div>
            <ul className="space-y-1 ml-4">
              <li>• Iluminación clara y uniforme</li>
              <li>• Foto directa (no de lado)</li>
              <li>• Todos los datos deben ser legibles</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
