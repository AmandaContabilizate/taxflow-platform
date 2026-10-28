'use client'

import { useEffect, useState } from 'react'
import { POST_LOGIN_COOKIE } from '@/features/auth/lib/postLoginCookie'
import { useDiagnosticoPasos } from '@/features/diagnostico/hooks/useDiagnosticoPasos'
import { useHasRfc, useRfcStore } from '@/features/taxpayers/stores/rfcStore'
import { useTutorial } from './tutorial/TutorialProvider'
import type { GoFn } from './types'

function readPostLoginCookie(): boolean {
  return document.cookie.split('; ').some((c) => c === `${POST_LOGIN_COOKIE}=1`)
}

function clearPostLoginCookie() {
  document.cookie = `${POST_LOGIN_COOKIE}=; max-age=0; path=/`
}

/**
 * Al iniciar sesión (cookie post_login, ver features/auth/lib/postLoginCookie.ts), un Guest con el
 * diagnóstico sin terminar o sin ninguna compra pagada del RFC cae en Diagnóstico, después del
 * tutorial si se muestra. Se evalúa una sola vez por login: navegar después no lo vuelve a forzar.
 * Debe montarse dentro de TutorialProvider.
 */
export function PostLoginRedirect({ go }: { go: GoFn }) {
  const tutorial = useTutorial()
  const { selectedRfc } = useRfcStore()
  const { hasRfc, loading: loadingRfc } = useHasRfc()
  const [armed, setArmed] = useState(false)
  const diag = useDiagnosticoPasos(selectedRfc, armed)

  useEffect(() => {
    if (readPostLoginCookie()) setArmed(true)
  }, [])

  useEffect(() => {
    if (!armed || loadingRfc) return
    const done = () => {
      clearPostLoginCookie()
      setArmed(false)
    }
    // Sin RFC el dashboard ya guía la conexión con el SAT; nada que redirigir.
    if (!hasRfc) return done()
    if (tutorial?.busy) return
    if (diag.loading || !selectedRfc) return
    if (diag.pasos && (diag.pasos.estado !== 'Terminado' || !diag.pasos.hasPurchase)) go('diagnostico')
    done()
    // `go` cambia en cada render del dashboard; no debe re-disparar la evaluación.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [armed, loadingRfc, hasRfc, tutorial?.busy, diag.loading, diag.pasos, selectedRfc])

  return null
}
