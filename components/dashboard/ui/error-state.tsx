'use client'

import { AlertCircle, ShieldOff } from 'lucide-react'

/** Detecta errores de autorización (el fetch client reporta "HTTP 403"). */
const FORBIDDEN_RE = /\b403\b|forbidden|prohibido|no autorizado/i

export function isForbiddenError(message: string | null | undefined): boolean {
  return !!message && FORBIDDEN_RE.test(message)
}

/**
 * Estado de error para cuerpos de Card: si el error es un 403 muestra la
 * pantalla de "sin acceso" (explica el porqué y cómo resolverlo) en lugar
 * del mensaje técnico; cualquier otro error usa el formato estándar.
 */
/** Pantalla de "sin acceso": el rol activo no trae el permiso del módulo. */
export function NoAccessState() {
  return (
    <div className="px-6 py-12 text-center flex flex-col items-center gap-3">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center"
        style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)' }}
      >
        <ShieldOff size={22} />
      </div>
      <div className="text-[14.5px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
        No tienes acceso a esta información
      </div>
      <div className="text-[13px] max-w-[420px] leading-relaxed" style={{ color: 'var(--ink-500)' }}>
        Tu rol actual no tiene el permiso necesario para ver este módulo. Si crees que
        deberías tenerlo, pídelo al administrador en Roles y permisos — y si te lo acaban
        de otorgar, cierra sesión y vuelve a entrar para que se refresque.
      </div>
    </div>
  )
}

export function ErrorState({ message }: { message: string }) {
  if (isForbiddenError(message)) return <NoAccessState />
  return (
    <div className="px-5 py-8 text-center flex flex-col items-center gap-2">
      <AlertCircle size={20} style={{ color: 'var(--violet-ink)' }} />
      <div className="text-[13.5px]" style={{ color: 'var(--ink-700)' }}>{message}</div>
    </div>
  )
}
