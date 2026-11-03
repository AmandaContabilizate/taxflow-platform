'use client'

import { createPortal } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useDiagnosticoEstado } from '@/features/diagnostico/hooks/useDiagnosticoEstado'
import { useHasRfc, useRfcStore } from '@/features/taxpayers/stores/rfcStore'
import { isSatConnected } from '../sat-connection.utils'
import type { GoFn, Screen } from '../types'
import { isTutorialDone, markTutorialDone } from './storage'
import { TUTORIAL_UI_ATTR } from './tutorial-dom'
import { TutorialMenuModal } from './TutorialMenuModal'
import { TutorialOverlay } from './TutorialOverlay'
import { tutorialById, type TutorialCtx, type TutorialId } from './tutorials'

/** Espera tras cargar los RFCs para que la pantalla de entrada termine de pintar. */
const AUTOSTART_DELAY_MS = 400
const PENDING_MAX_MS = 10000
const MOBILE_BREAKPOINT = 1024

interface TutorialContextValue {
  start: (id: TutorialId) => void
  stop: () => void
  openMenu: () => void
  activeId: TutorialId | null
}

const TutorialContext = createContext<TutorialContextValue | null>(null)

/** null fuera del provider (roles que no son Guest): los consumidores no pintan nada. */
export function useTutorial(): TutorialContextValue | null {
  return useContext(TutorialContext)
}

interface Props {
  children: ReactNode
  /** Solo Guest. Apagado, el provider no expone nada y no se monta ningún tutorial. */
  enabled: boolean
  /** TUTORIAL_AUTOSTART_ENABLED: si es false nunca arranca solo; el menú "?" sigue funcionando. */
  autostart: boolean
  userId: string | null | undefined
  go: GoFn
  screen: Screen
  openMobileMenu: () => void
}

export function TutorialProvider({ children, enabled, autostart, userId, go, screen, openMobileMenu }: Props) {
  if (!enabled) return <>{children}</>
  return (
    <ActiveTutorialProvider autostart={autostart} userId={userId} go={go} screen={screen} openMobileMenu={openMobileMenu}>
      {children}
    </ActiveTutorialProvider>
  )
}

function ActiveTutorialProvider({ children, autostart, userId, go, screen, openMobileMenu }: Omit<Props, 'enabled'>) {
  const [activeId, setActiveId] = useState<TutorialId | null>(null)
  const [index, setIndex] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const { selectedRfc, selectedRfcInfo } = useRfcStore()
  const { hasRfc, loading: loadingRfc } = useHasRfc()
  const diagnostico = useDiagnosticoEstado(selectedRfc, activeId !== null)
  const autostartedRef = useRef(false)
  // Va a salir la bienvenida: cubrir la pantalla mientras cargan los RFCs y se arma el primer paso,
  // para que no se vea el dashboard "suelto" y luego aparezca el tutorial encima.
  const [pendingAutostart, setPendingAutostart] = useState(false)

  useEffect(() => {
    if (autostart && !isTutorialDone(userId)) setPendingAutostart(true)
  }, [autostart, userId])

  useEffect(() => {
    if (!pendingAutostart) return
    // Red de seguridad: si algo impide arrancar, nunca dejar la pantalla bloqueada.
    const timer = setTimeout(() => setPendingAutostart(false), PENDING_MAX_MS)
    return () => clearTimeout(timer)
  }, [pendingAutostart])

  const start = useCallback((id: TutorialId) => {
    setMenuOpen(false)
    setIndex(0)
    setActiveId(id)
  }, [])

  const stop = useCallback(() => {
    setActiveId(null)
    setIndex(0)
    markTutorialDone(userId)
  }, [userId])

  const openMenu = useCallback(() => setMenuOpen(true), [])

  // Bienvenida: primer ingreso del Guest, con o sin accesos SAT. Una vez terminado u omitido no vuelve.
  useEffect(() => {
    if (!autostart || autostartedRef.current || loadingRfc) return
    if (isTutorialDone(userId)) return
    const first: TutorialId = hasRfc && isSatConnected(selectedRfcInfo) ? 'diagnostico' : 'accesos-sat'
    // La marca va dentro del timer: si cambian los datos del RFC antes, se reprograma con los nuevos.
    const timer = setTimeout(() => {
      autostartedRef.current = true
      start(first)
      setPendingAutostart(false)
    }, AUTOSTART_DELAY_MS)
    return () => clearTimeout(timer)
  }, [autostart, loadingRfc, hasRfc, selectedRfcInfo, userId, start])

  const ctx: TutorialCtx = {
    go,
    screen,
    isMobile: () => window.innerWidth < MOBILE_BREAKPOINT,
    openMobileMenu,
    closeDialogs: () => {
      const open = Array.from(document.querySelectorAll('[role="dialog"][data-state="open"]')).filter(
        (d) => !d.closest(`[${TUTORIAL_UI_ATTR}]`),
      )
      if (open.length > 0) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    },
    diagnosticoTerminado: diagnostico.loading ? null : diagnostico.terminado,
  }

  const value = useMemo(() => ({ start, stop, openMenu, activeId }), [start, stop, openMenu, activeId])

  return (
    <TutorialContext.Provider value={value}>
      {children}
      <TutorialMenuModal open={menuOpen} onOpenChange={setMenuOpen} onSelect={start} />
      {pendingAutostart && !activeId && <TutorialLoadingOverlay />}
      {activeId && (
        <TutorialOverlay
          key={activeId}
          tutorial={tutorialById(activeId)}
          index={index}
          ctx={ctx}
          onIndexChange={setIndex}
          onFinish={stop}
        />
      )}
    </TutorialContext.Provider>
  )
}

function TutorialLoadingOverlay() {
  if (typeof document === 'undefined') return null
  return createPortal(
    <div
      data-tutorial-ui=""
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'var(--tutorial-backdrop)' }}
      aria-busy="true"
      aria-label="Preparando tutorial"
    >
      <Loader2 size={28} className="animate-spin" style={{ color: 'var(--tutorial-ring)' }} />
    </div>,
    document.body,
  )
}
