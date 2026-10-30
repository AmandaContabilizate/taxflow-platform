'use client'

import { useEffect, useState } from 'react'
import { validateReferralCode } from '@/features/referrals/actions/validateReferralCode.action'

/** Solo los códigos de cliente tienen forma CBX-; los de vendedor/partner los resuelve el back al guardar el perfil. */
const CLIENT_CODE = /^CBX-[A-Z0-9]{3,}$/i

/**
 * Valida con debounce el código de referido de cliente. Devuelve el aviso a mostrar (no bloqueante)
 * o `null` si el código está vacío, no tiene forma CBX-, existe o no se pudo consultar.
 */
export function useReferralCodeCheck(code: string, delayMs = 600): string | null {
  const [notFound, setNotFound] = useState<string | null>(null)
  const normalized = code.trim().toUpperCase()

  useEffect(() => {
    setNotFound(null)
    if (!CLIENT_CODE.test(normalized)) return
    let cancelled = false
    const t = setTimeout(async () => {
      const valid = await validateReferralCode(normalized)
      if (!cancelled && valid === false) setNotFound(normalized)
    }, delayMs)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [normalized, delayMs])

  return notFound !== null && notFound === normalized
    ? 'No encontramos ese código de referido; revisa que esté bien escrito. Puedes continuar sin él.'
    : null
}
