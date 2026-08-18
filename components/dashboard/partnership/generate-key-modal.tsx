'use client'

import { useState } from 'react'
import { AlertTriangle, Check, Copy, KeyRound, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { generateNewKey } from '@/features/partnership/actions/generateNewKey.action'
import type { NewKeyResponse } from '@/features/partnership/types'
import { DISPLAY } from '../constants'
import { Btn } from '../ui'

interface GenerateKeyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGenerated: (result: NewKeyResponse) => void
}

export function GenerateKeyModal({ open, onOpenChange, onGenerated }: GenerateKeyModalProps) {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<NewKeyResponse | null>(null)
  const [copied, setCopied] = useState(false)

  function handleClose(next: boolean) {
    if (!next) {
      setResult(null)
      setError(null)
      setCopied(false)
    }
    onOpenChange(next)
  }

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    const res = await generateNewKey()
    setGenerating(false)
    if (res.success) {
      setResult(res.value)
      onGenerated(res.value)
    } else {
      setError(res.error.message)
    }
  }

  async function handleCopy() {
    if (!result?.privateKey) return
    await navigator.clipboard.writeText(result.privateKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
                <KeyRound size={22} />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-[19px] font-extrabold tracking-tight" style={DISPLAY}>
                  {result ? 'Llave generada' : 'Confirmar generación de llave'}
                </DialogTitle>
                <DialogDescription className="mt-0.5">
                  {result
                    ? 'Guárdala ahora, no podrás volver a verla.'
                    : 'Se darán de baja las llaves antiguas y solo quedará activa la nueva.'}
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
                Debe guardar esta llave de manera segura, no será posible volver a verla después de
                salir de esta pantalla.
              </div>
              <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap break-all max-h-60">
                {result.privateKey}
              </pre>
              <Btn kind="ghost" size="sm" onClick={handleCopy}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copiada' : 'Copiar llave'}
              </Btn>
            </div>
          ) : (
            <>
              {error && (
                <div className="text-[13px] font-semibold" style={{ color: 'var(--violet-ink)' }}>
                  {error}
                </div>
              )}
              <div className="text-[13.5px]" style={{ color: 'var(--ink-700)' }}>
                ¿Deseas continuar?
              </div>
            </>
          )}
        </div>

        <div
          className="px-6 py-4 border-t flex items-center justify-end gap-2 flex-wrap"
          style={{ borderColor: 'var(--border)' }}
        >
          {result ? (
            <Btn kind="primary" size="sm" onClick={() => handleClose(false)}>
              Cerrar
            </Btn>
          ) : (
            <>
              <Btn kind="ghost" size="sm" onClick={() => handleClose(false)} disabled={generating}>
                Cancelar
              </Btn>
              <Btn kind="brand" size="sm" onClick={handleGenerate} disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Generando…
                  </>
                ) : (
                  <>
                    <KeyRound size={15} /> Generar nueva llave
                  </>
                )}
              </Btn>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
