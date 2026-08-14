'use client'

import { useState, useRef } from 'react'
import { X, Loader2 } from 'lucide-react'
import { registerCompany } from '../actions/registerCompany.action'

interface RegistroEmpresaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function RegistroEmpresaModal({ open, onOpenChange, onSuccess }: RegistroEmpresaModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cedulaFile, setCedulaFile] = useState<File | null>(null)
  const [externalId, setExternalId] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate PDF
    if (file.type !== 'application/pdf') {
      setError('Solo se permiten archivos PDF')
      return
    }

    // Validate size (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError('El archivo no debe exceder 5MB')
      return
    }

    setCedulaFile(file)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!cedulaFile) {
      setError('Debe seleccionar la cédula en PDF')
      return
    }

    setLoading(true)

    try {
      const result = await registerCompany({
        cedulaFile,
        externalId: externalId || undefined,
      })

      if (!result.success) {
        setError(result.error.message)
        return
      }

      // Success
      setCedulaFile(null)
      setExternalId('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      onOpenChange(false)
      onSuccess?.()
    } finally {
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
            Registrar Empresa
          </h2>
          <button
            onClick={() => {
              onOpenChange(false)
              setError(null)
            }}
            className="p-2 rounded-lg transition hover:bg-gray-100"
            disabled={loading}
          >
            <X size={20} style={{ color: 'var(--ink-500)' }} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-[13px]" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--ink-700)' }}>
              Cédula / Constancia de Situación Fiscal del SAT
            </label>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-3 py-2 rounded-lg border text-[13px] text-left cursor-pointer transition hover:bg-gray-50"
                style={{ borderColor: 'var(--border)', color: cedulaFile ? 'var(--ink-900)' : 'var(--ink-500)' }}
                disabled={loading}
              >
                {cedulaFile ? cedulaFile.name : 'Seleccionar PDF...'}
              </button>
            </div>
            <p className="text-[12px] mt-1" style={{ color: 'var(--ink-500)' }}>
              Máximo 5MB, formato PDF
            </p>
          </div>

          <div>
            <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--ink-700)' }}>
              ID Externo (opcional)
            </label>
            <input
              type="text"
              value={externalId}
              onChange={(e) => setExternalId(e.target.value)}
              placeholder="Tu identificador único"
              className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
              style={{ borderColor: 'var(--border)', color: 'var(--ink-900)' }}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-lg font-medium text-[13px] transition flex items-center justify-center gap-2"
            style={{ backgroundColor: loading ? 'var(--ink-200)' : 'var(--primary)', color: 'white' }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Registrando...' : 'Registrar Empresa'}
          </button>
        </form>
      </div>
    </div>
  )
}
