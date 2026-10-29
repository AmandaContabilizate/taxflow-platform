'use client'

import { ArrowLeftRight, CheckCircle2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { switchRole } from '@/features/roles/actions/switchRole.action'
import { myRoleLabel, useMyRoles } from '@/features/roles/hooks/useMyRoles'
import { Modal } from '../modal'

/**
 * Lista de roles del usuario con el activo marcado y "Cambiar a este rol" en los demás. Self-service
 * (GET users/me/roles + POST switch-role): no requiere permisos de administración de roles. El
 * cambio queda como rol por defecto, así que el siguiente login también entra con él.
 */
export function RoleSwitcher() {
  const { roles } = useMyRoles()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function cambiar(roleId: string, label: string) {
    if (
      !confirm(
        `¿Cambiar tu rol activo a "${label}"?\n\nTu menú y tus permisos cambiarán. También entrarás con este rol la próxima vez que inicies sesión.`,
      )
    ) {
      return
    }
    setBusyId(roleId)
    setError(null)
    const res = await switchRole(roleId)
    if (!res.success) {
      setBusyId(null)
      setError(res.error.message)
      return
    }
    // El menú, los providers y hasta el tipo de navegación (Guest vs. staff) dependen del rol, y la
    // pantalla actual puede no existir con el nuevo: recarga completa en el inicio del dashboard.
    try {
      localStorage.removeItem('dashboard-screen')
    } catch {
      // sin storage: igual se recarga
    }
    window.location.assign('/dashboard')
  }

  return (
    <div className="flex flex-col gap-2">
      {roles.map((r) => {
        const label = myRoleLabel(r)
        return (
          <div
            key={r.roleId}
            className="flex items-center gap-3 rounded-xl px-3.5 py-3"
            style={{
              background: r.isDefault ? 'var(--hero-brand-soft)' : 'var(--card)',
              border: `1px solid ${r.isDefault ? 'var(--brand-200)' : 'var(--border)'}`,
            }}
          >
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[14px] truncate" style={{ color: 'var(--ink-900)' }}>
                {label}
              </div>
              {r.isDefault && (
                <div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                  Con este rol estás trabajando ahora
                </div>
              )}
            </div>
            {r.isDefault ? (
              <span
                className="inline-flex items-center gap-1 text-[12px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'var(--brand-100)', color: 'var(--brand-900)' }}
              >
                <CheckCircle2 size={13} /> Activo
              </span>
            ) : (
              <button
                type="button"
                onClick={() => cambiar(r.roleId, label)}
                disabled={busyId !== null}
                className="inline-flex items-center gap-1.5 text-[12.5px] font-bold px-3 py-1.5 rounded-full transition hover:opacity-85 disabled:opacity-50 cursor-pointer"
                style={{ background: 'var(--ink-50)', color: 'var(--ink-800)', border: '1px solid var(--border)' }}
              >
                {busyId === r.roleId ? <Loader2 size={13} className="animate-spin" /> : <ArrowLeftRight size={13} />}
                Cambiar a este rol
              </button>
            )}
          </div>
        )
      })}
      {error && (
        <div className="text-[12.5px] font-semibold" style={{ color: 'var(--danger)' }}>
          {error}
        </div>
      )}
    </div>
  )
}

/** Modal del sidebar ("Cambiar de rol"). `Modal` ya va en portal por encima de los sidebars. */
export function RoleSwitcherModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cambiar de rol" maxWidth={460}>
      <p className="text-[13px] mb-4" style={{ color: 'var(--ink-500)' }}>
        Tienes varios roles. Elige con cuál quieres trabajar: cambia tu menú y tus permisos.
      </p>
      <RoleSwitcher />
    </Modal>
  )
}
