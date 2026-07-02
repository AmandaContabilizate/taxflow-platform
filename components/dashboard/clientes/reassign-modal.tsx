'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Check, Loader2, UserCheck, Users } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getAccountantAssignment } from '@/features/assignments/actions/getAccountantAssignment.action'
import { reassignAccountant } from '@/features/assignments/actions/reassignAccountant.action'
import type { AccountantAssignment } from '@/features/assignments/types'
import type { ClientListItem } from '@/features/taxpayers/types'
import { DISPLAY, MONO } from '../constants'
import { Btn } from '../ui'

interface ReassignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Cliente a reasignar; null cuando el modal está cerrado. */
  client: ClientListItem | null
  onReassigned: () => void
}

export function ReassignModal({ open, onOpenChange, client, onReassigned }: ReassignModalProps) {
  const [assignment, setAssignment] = useState<AccountantAssignment | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Carga la asignación (actual + pool) al abrir.
  useEffect(() => {
    if (!open || !client) return
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    setAssignment(null)
    setSelected(null)
    setSaveError(null)
    getAccountantAssignment(client.taxpayerId).then((res) => {
      if (cancelled) return
      if (res.success) {
        setAssignment(res.value)
        setSelected(res.value.current?.accountantUserId ?? null)
      } else {
        setLoadError(res.error.message)
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [open, client])

  const currentId = assignment?.current?.accountantUserId ?? null
  const canSave = !!selected && selected !== currentId

  async function handleReassign() {
    if (!client || !selected) return
    setSaving(true)
    setSaveError(null)
    const res = await reassignAccountant({
      taxpayerId: client.taxpayerId,
      accountantUserId: selected,
    })
    setSaving(false)
    if (res.success) {
      onOpenChange(false)
      onReassigned()
    } else {
      setSaveError(res.error.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 sm:max-w-lg max-h-[88vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <DialogHeader>
            <div className="flex items-start gap-3.5">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--brand-100)', color: 'var(--brand-700)' }}
              >
                <UserCheck size={22} />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-[19px] font-extrabold tracking-tight" style={DISPLAY}>
                  Reasignar contador
                </DialogTitle>
                <DialogDescription className="mt-0.5">
                  {client ? (
                    <>
                      {client.legalName} ·{' '}
                      <span style={MONO}>{client.rfc}</span>
                    </>
                  ) : (
                    'Selecciona un contador para este contribuyente.'
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {loadError ? (
            <div
              className="flex flex-col items-center gap-2 text-center px-4 py-8 rounded-xl"
              style={{ background: 'var(--coral-soft)', border: '1px solid var(--border)' }}
            >
              <AlertCircle size={22} style={{ color: '#9E3A15' }} />
              <div className="text-[13px] font-semibold" style={{ color: 'var(--ink-900)' }}>
                No se pudo cargar la asignación
              </div>
              <div className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
                {loadError}
              </div>
            </div>
          ) : loading ? (
            <div
              className="flex items-center justify-center gap-2 py-10 rounded-xl"
              style={{ border: '1px solid var(--border)', color: 'var(--ink-500)' }}
            >
              <Loader2 size={16} className="animate-spin" /> Cargando contadores…
            </div>
          ) : (
            <>
              {/* Contador actual */}
              <div>
                <div className="text-[12px] font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--ink-500)' }}>
                  Contador actual
                </div>
                {assignment?.current ? (
                  <div
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl"
                    style={{ background: 'var(--hero-brand-soft)', border: '1px solid var(--brand-200)' }}
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-[14px] truncate" style={{ color: 'var(--ink-900)' }}>
                        {assignment.current.accountantName}
                      </div>
                      <div className="text-[12px] truncate" style={{ color: 'var(--ink-500)' }}>
                        {assignment.current.accountantEmail}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className="px-3.5 py-2.5 rounded-xl text-[13px] font-semibold"
                    style={{ background: 'var(--amber-soft)', color: '#7B5312' }}
                  >
                    Sin contador asignado
                  </div>
                )}
              </div>

              {/* Pool de contadores */}
              <div>
                <div className="text-[12px] font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--ink-500)' }}>
                  Reasignar a
                </div>
                {assignment && assignment.pool.length > 0 ? (
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    {assignment.pool.map((a, i) => {
                      const active = selected === a.accountantUserId
                      const isCurrent = currentId === a.accountantUserId
                      return (
                        <button
                          key={a.accountantUserId}
                          type="button"
                          onClick={() => setSelected(a.accountantUserId)}
                          className="w-full flex items-center gap-3 px-3.5 py-3 text-left transition"
                          style={{
                            background: active ? 'var(--hero-brand-soft)' : 'var(--card)',
                            borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                          }}
                        >
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition"
                            style={{
                              background: active ? 'var(--brand-500)' : 'transparent',
                              border: active ? '1px solid var(--brand-500)' : '1.5px solid var(--border-strong)',
                              color: '#fff',
                            }}
                          >
                            {active && <Check size={13} />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="font-bold text-[14px] truncate" style={{ color: 'var(--ink-900)' }}>
                                {a.accountantName}
                              </span>
                              {isCurrent && (
                                <span
                                  className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full flex-shrink-0"
                                  style={{ background: 'var(--brand-100)', color: 'var(--brand-900)' }}
                                >
                                  Actual
                                </span>
                              )}
                            </span>
                            <span className="block text-[12px] truncate" style={{ color: 'var(--ink-500)' }}>
                              {a.accountantEmail}
                            </span>
                          </span>
                          <span
                            className="inline-flex items-center gap-1 text-[11.5px] font-bold px-2 py-1 rounded-full flex-shrink-0"
                            style={{ background: 'var(--ink-50)', color: 'var(--ink-700)' }}
                            title="Contribuyentes activos asignados"
                          >
                            <Users size={12} /> {a.activeClients}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center text-[13px] rounded-xl" style={{ border: '1px solid var(--border)', color: 'var(--ink-500)' }}>
                    No hay contadores disponibles.
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t flex items-center justify-between gap-3 flex-wrap"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="min-w-0 flex items-center gap-2 text-[12.5px] font-semibold" style={{ color: '#9E3A15' }}>
            {saveError && (
              <>
                <AlertCircle size={15} className="flex-shrink-0" />
                <span className="truncate">{saveError}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Btn kind="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Btn>
            <Btn kind="brand" size="sm" onClick={handleReassign} disabled={saving || loading || !canSave}>
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Reasignando…
                </>
              ) : (
                <>
                  <Check size={15} /> Reasignar
                </>
              )}
            </Btn>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
