'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Check, Copy, KeySquare, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { createPartnerApiKey } from '@/features/partnership/actions/partnerCredentials.action'
import type { CreatedPartnerApiKey, PartnerScope } from '@/features/partnership/types'
import { DISPLAY, MONO } from '../constants'
import { Btn } from '../ui'

const VIGENCIAS = [
  { days: 90, label: '90 días' },
  { days: 180, label: '6 meses' },
  { days: 365, label: '1 año' },
  { days: 730, label: '2 años' },
]

interface CreateApiKeyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  grantedScopes: PartnerScope[]
  onCreated: () => void
}

/**
 * Crear una API key: nombre, permisos (subconjunto de los concedidos a la empresa) y vigencia. La clave
 * completa se muestra UNA sola vez al terminar.
 */
export function CreateApiKeyModal({ open, onOpenChange, grantedScopes, onCreated }: CreateApiKeyModalProps) {
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState<string[]>([])
  const [days, setDays] = useState(365)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CreatedPartnerApiKey | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (open) setScopes(grantedScopes.map((s) => s.code))
  }, [open, grantedScopes])

  function handleClose(next: boolean) {
    if (!next) {
      setName('')
      setDays(365)
      setError(null)
      setResult(null)
      setCopied(false)
    }
    onOpenChange(next)
  }

  function toggle(code: string) {
    setScopes((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))
  }

  async function handleCreate() {
    setSaving(true)
    setError(null)
    const res = await createPartnerApiKey({ name: name.trim(), scopes, expiresInDays: days })
    setSaving(false)
    if (res.success) {
      setResult(res.value)
      onCreated()
    } else {
      setError(res.error.message)
    }
  }

  async function handleCopy() {
    if (!result) return
    await navigator.clipboard.writeText(result.apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const canCreate = name.trim().length > 0 && scopes.length > 0 && !saving

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="p-0 gap-0 sm:max-w-lg max-h-[88vh] overflow-hidden flex flex-col">
        <div className="px-6 pt-6 pb-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <DialogHeader>
            <div className="flex items-start gap-3.5">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)' }}
              >
                <KeySquare size={22} />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-[19px] font-extrabold tracking-tight" style={DISPLAY}>
                  {result ? 'API key creada' : 'Nueva API key'}
                </DialogTitle>
                <DialogDescription className="mt-0.5">
                  {result
                    ? 'Cópiala ahora: no se guarda y no podrás volver a verla.'
                    : 'Úsala en el encabezado X-Api-Key desde sus servidores. Nunca en un navegador o app.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {result ? (
            <div
              className="flex flex-col gap-3 px-4 py-4 rounded-xl"
              style={{ background: 'var(--amber-soft)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-start gap-2 text-[13px] font-bold" style={{ color: 'var(--violet-ink)' }}>
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                Guárdala en un gestor de secretos. Si se pierde, revócala y crea otra.
              </div>
              <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap break-all">
                {result.apiKey}
              </pre>
              <div className="text-[12.5px]" style={{ color: 'var(--ink-700)' }}>
                Vence el {new Date(result.expiresAt).toLocaleDateString('es-MX')} · Permisos:{' '}
                <span style={MONO}>{result.scopes.join(', ')}</span>
              </div>
              <Btn kind="ghost" size="sm" onClick={handleCopy}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copiada' : 'Copiar API key'}
              </Btn>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold" style={{ color: 'var(--ink-500)' }}>Nombre</label>
                <Input
                  placeholder="Servidor de producción"
                  value={name}
                  maxLength={255}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold" style={{ color: 'var(--ink-500)' }}>Permisos</label>
                {grantedScopes.length === 0 ? (
                  <div className="text-[13px]" style={{ color: 'var(--ink-500)' }}>
                    Su empresa aún no tiene permisos de API concedidos. Solicítelos a su ejecutivo de Contabilízate.
                  </div>
                ) : (
                  grantedScopes.map((s) => (
                    <label key={s.code} className="flex items-start gap-2.5 text-[13.5px] cursor-pointer" style={{ color: 'var(--ink-700)' }}>
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={scopes.includes(s.code)}
                        onChange={() => toggle(s.code)}
                      />
                      <span>
                        <span className="font-bold" style={{ ...MONO, color: 'var(--ink-900)' }}>{s.code}</span>
                        <span className="block text-[12.5px]" style={{ color: 'var(--ink-500)' }}>{s.description}</span>
                      </span>
                    </label>
                  ))
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold" style={{ color: 'var(--ink-500)' }}>Vigencia</label>
                <div className="flex gap-2 flex-wrap">
                  {VIGENCIAS.map((v) => (
                    <Btn key={v.days} kind={days === v.days ? 'primary' : 'ghost'} size="sm" onClick={() => setDays(v.days)}>
                      {v.label}
                    </Btn>
                  ))}
                </div>
                <div className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
                  Le avisaremos por correo 30, 7 y 3 días antes de que venza.
                </div>
              </div>

              {error && (
                <div className="text-[13px] font-semibold" style={{ color: 'var(--violet-ink)' }}>
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-end gap-2 flex-wrap" style={{ borderColor: 'var(--border)' }}>
          {result ? (
            <Btn kind="primary" size="sm" onClick={() => handleClose(false)}>
              Ya la guardé
            </Btn>
          ) : (
            <>
              <Btn kind="ghost" size="sm" onClick={() => handleClose(false)} disabled={saving}>
                Cancelar
              </Btn>
              <Btn kind="brand" size="sm" onClick={handleCreate} disabled={!canCreate}>
                {saving ? <Loader2 size={15} className="animate-spin" /> : <KeySquare size={15} />}
                {saving ? 'Creando…' : 'Crear API key'}
              </Btn>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
