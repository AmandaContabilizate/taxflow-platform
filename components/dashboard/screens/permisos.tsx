'use client'

import { useMemo, useState } from 'react'
import { Check, Loader2, Plus, ShieldCheck, X } from 'lucide-react'
import { ALL_PERMISSIONS, DISPLAY } from '../constants'
import { Btn, Card, HelpBox } from '../ui'

interface PermisosScreenProps {
  initialPermissions: string[]
  role: string | null
}

type Status =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'success'; at: string }
  | { kind: 'error'; message: string }

export function PermisosScreen({ initialPermissions, role }: PermisosScreenProps) {
  const [permissions, setPermissions] = useState<string[]>(initialPermissions)
  const [selectValue, setSelectValue] = useState<string>('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const availableToAdd = useMemo(
    () => ALL_PERMISSIONS.filter(p => !permissions.includes(p)),
    [permissions],
  )

  const dirty = useMemo(() => {
    if (permissions.length !== initialPermissions.length) return true
    const sortedA = [...permissions].sort()
    const sortedB = [...initialPermissions].sort()
    return sortedA.some((p, i) => p !== sortedB[i])
  }, [permissions, initialPermissions])

  function toggle(perm: string) {
    setPermissions(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm],
    )
    setStatus({ kind: 'idle' })
  }

  function addFromSelect() {
    if (!selectValue) return
    if (!permissions.includes(selectValue)) {
      setPermissions(prev => [...prev, selectValue])
    }
    setSelectValue('')
    setStatus({ kind: 'idle' })
  }

  function reset() {
    setPermissions(initialPermissions)
    setStatus({ kind: 'idle' })
  }

  async function save() {
    setStatus({ kind: 'saving' })
    // TODO: reemplazar por POST real al endpoint cuando exista.
    await new Promise(r => setTimeout(r, 900))
    console.info('[permisos] payload simulado →', {
      role,
      permissions,
    })
    setStatus({ kind: 'success', at: new Date().toLocaleTimeString() })
  }

  return (
    <div className="flex flex-col gap-6 max-w-[960px]">
      <HelpBox>
        Esta pantalla simula el envío de cambios. Cuando el endpoint exista,
        sólo hay que reemplazar la función <code>save()</code>. Por ahora los
        cambios se imprimen en consola.
      </HelpBox>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--nav-active-icon-bg)', color: 'var(--nav-active-icon-fg)' }}
          >
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="text-[18px] font-extrabold" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
              Rol actual: {role ?? 'Sin rol'}
            </div>
            <div className="text-[13px] font-semibold" style={{ color: 'var(--ink-500)' }}>
              {permissions.length} permiso{permissions.length === 1 ? '' : 's'} asignado{permissions.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-5">
          <select
            value={selectValue}
            onChange={e => setSelectValue(e.target.value)}
            disabled={availableToAdd.length === 0}
            className="h-11 flex-1 rounded-xl px-3 text-[14px] font-semibold outline-none"
            style={{
              background: 'var(--input)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
            }}
          >
            <option value="">
              {availableToAdd.length === 0
                ? 'Todos los permisos ya están asignados'
                : 'Selecciona un permiso para agregar…'}
            </option>
            {availableToAdd.map(p => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <Btn kind="primary" onClick={addFromSelect} disabled={!selectValue}>
            <Plus size={16} />
            Agregar
          </Btn>
        </div>

        <div className="text-[13px] font-bold mb-2" style={{ color: 'var(--ink-700)' }}>
          Permisos activos
        </div>
        <div className="flex flex-wrap gap-2 mb-5">
          {permissions.length === 0 && (
            <span className="text-[13px] font-semibold" style={{ color: 'var(--ink-400)' }}>
              Sin permisos asignados.
            </span>
          )}
          {permissions.map(p => (
            <span
              key={p}
              className="inline-flex items-center gap-1.5 rounded-full pl-3 pr-1.5 py-1 text-[12.5px] font-bold"
              style={{
                background: 'var(--ink-100)',
                color: 'var(--ink-900)',
                border: '1px solid var(--border)',
              }}
            >
              {p}
              <button
                type="button"
                aria-label={`Quitar ${p}`}
                onClick={() => toggle(p)}
                className="w-5 h-5 rounded-full flex items-center justify-center hover:opacity-80"
                style={{ background: 'var(--ink-100)', color: 'var(--ink-700)' }}
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>

        <div className="text-[13px] font-bold mb-2" style={{ color: 'var(--ink-700)' }}>
          Catálogo completo
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
          {ALL_PERMISSIONS.map(p => {
            const active = permissions.includes(p)
            return (
              <button
                key={p}
                type="button"
                onClick={() => toggle(p)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition"
                style={{
                  background: active ? 'var(--ink-100)' : 'var(--card)',
                  color: 'var(--ink-900)',
                  border: active ? '1px solid var(--brand-500)' : '1px solid var(--border)',
                }}
              >
                <span
                  className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{
                    background: active ? 'var(--brand-500)' : 'var(--ink-50)',
                    color: active ? '#FFFFFF' : 'var(--ink-500)',
                  }}
                >
                  {active ? <Check size={14} /> : <Plus size={14} />}
                </span>
                <span className="text-[13.5px] font-bold">{p}</span>
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <Btn
            kind="primary"
            onClick={save}
            disabled={!dirty || status.kind === 'saving'}
          >
            {status.kind === 'saving' ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Guardando…
              </>
            ) : (
              <>
                <Check size={16} /> Guardar cambios
              </>
            )}
          </Btn>
          <Btn kind="ghost" onClick={reset} disabled={!dirty || status.kind === 'saving'}>
            Descartar
          </Btn>
          {status.kind === 'success' && (
            <span className="text-[12.5px] font-bold mt-3" style={{ color: 'var(--brand-600)' }}>
              ✓ Cambios enviados (simulado) a las {status.at}
            </span>
          )}
          {status.kind === 'error' && (
            <span className="text-[12.5px] font-bold mt-3" style={{ color: 'var(--destructive)' }}>
              {status.message}
            </span>
          )}
        </div>
      </Card>
    </div>
  )
}
