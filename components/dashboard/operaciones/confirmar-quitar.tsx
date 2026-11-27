'use client'

import { Loader2, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Modal } from '../modal'
import { Btn } from '../ui'
import { InlineNotice } from './parts-612'

/** Botón "Quitar" con confirmación. `onConfirm` devuelve el mensaje de error o null si salió bien. */
export function ConfirmarQuitar({
  title,
  children,
  onConfirm,
}: {
  title: string
  children: ReactNode
  onConfirm: () => Promise<string | null>
}) {
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
    try {
      const message = await onConfirm()
      if (message) return setError(message)
      close()
    } catch {
      setError('No se pudo quitar. Intenta de nuevo.')
    } finally {
      setRemoving(false)
    }
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
        title={title}
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
          <p>{children}</p>
          {error && <InlineNotice kind="error">{error}</InlineNotice>}
        </div>
      </Modal>
    </>
  )
}
