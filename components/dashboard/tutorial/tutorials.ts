import type { ComponentType } from 'react'
import { CircleHelp, KeyRound, ShoppingBag, Stethoscope } from 'lucide-react'
import type { GoFn, Screen } from '../types'

export type TutorialId = 'accesos-sat' | 'diagnostico' | 'ventas' | 'general'

export interface TutorialCtx {
  go: GoFn
  screen: Screen
  isMobile: () => boolean
  openMobileMenu: () => void
  /** Cierra el modal de Radix abierto (Escape sintético) para que el siguiente paso quede visible. */
  closeDialogs: () => void
  /** null mientras se consulta. */
  diagnosticoTerminado: boolean | null
}

export interface TutorialStep {
  /** Valor de data-tour del elemento a resaltar; sin target el paso sale centrado. */
  target?: string
  title: string
  body: string | ((ctx: TutorialCtx) => string)
  placement?: 'top' | 'bottom' | 'left' | 'right'
  /** Pantalla en la que vive el paso: se navega antes de mostrarlo. */
  screen?: Screen
  /** Deja la UI lista para el paso (abrir el menú en móvil, cerrar un modal…). */
  prepare?: (ctx: TutorialCtx) => void
  /** El paso espera el clic en el target; "Siguiente" lo simula. */
  advanceOn?: 'click'
  /** "Siguiente" sin target visible: lo que habría hecho el clic, para no dejar la pantalla a medias. */
  fallback?: (ctx: TutorialCtx) => void
  /** Si el target no aparece, se salta el paso en vez de mostrarlo centrado. */
  skipIfMissing?: boolean
  /** Cuánto esperar a que aparezca el target (ms). */
  waitMs?: number
}

export interface TutorialDef {
  id: TutorialId
  title: string
  description: string
  Icon: ComponentType<{ size?: number; className?: string }>
  steps: TutorialStep[]
}

const openMenuOnMobile = (ctx: TutorialCtx) => {
  if (ctx.isMobile()) ctx.openMobileMenu()
}

const closingStep = (body: string): TutorialStep => ({
  target: 'help',
  title: '¡Listo!',
  body: `${body} Puedes volver a ver este y los demás tutoriales cuando quieras con el botón de ayuda (?).`,
  waitMs: 800,
})

export const TUTORIALS: TutorialDef[] = [
  {
    id: 'accesos-sat',
    title: 'Conecta tus accesos del SAT',
    description: 'Dónde capturas tu RFC y tu contraseña del SAT si los dejaste para después.',
    Icon: KeyRound,
    steps: [
      {
        target: 'add-rfc',
        title: 'Conecta tu RFC',
        body: 'Desde este botón agregas tu RFC y tus accesos del SAT. Dale clic para continuar.',
        placement: 'bottom',
        advanceOn: 'click',
        fallback: (ctx) => ctx.go('estatus-sat'),
        waitMs: 1200,
      },
      {
        screen: 'estatus-sat',
        target: 'sat-form',
        title: 'Captura tu contraseña del SAT',
        body: 'Escribe tu RFC y tu contraseña del SAT (CIEC). Con ellos descargamos tu constancia y revisamos tus declaraciones. Tu contraseña viaja y se guarda cifrada.',
      },
      closingStep('En cuanto conectes tu RFC empieza tu diagnóstico.'),
    ],
  },
  {
    id: 'diagnostico',
    title: 'Tu diagnóstico fiscal',
    description: 'Cómo funciona, cuánto esperar y cómo leer el resultado.',
    Icon: Stethoscope,
    steps: [
      {
        target: 'nav-diagnostico',
        title: 'Abre tu diagnóstico',
        body: 'Aquí revisas en qué situación estás con el SAT. Dale clic a Diagnóstico.',
        placement: 'right',
        prepare: openMenuOnMobile,
        advanceOn: 'click',
        fallback: (ctx) => ctx.go('diagnostico'),
      },
      {
        screen: 'diagnostico',
        target: 'diag-hero',
        title: 'Cómo funciona',
        body: (ctx) =>
          ctx.diagnosticoTerminado
            ? 'Con tus accesos descargamos tu constancia y revisamos en el portal del SAT tus declaraciones mes por mes. Tu diagnóstico ya terminó: aquí ves el resumen de tu situación.'
            : 'Con tus accesos descargamos tu constancia y revisamos en el portal del SAT tus declaraciones mes por mes. Mientras dice "Diagnóstico en curso" solo espera: puede tardar unos minutos y la pantalla se actualiza sola.',
        placement: 'bottom',
      },
      {
        target: 'diag-indicator',
        title: 'Te avisamos al terminar',
        body: 'Mientras revisamos tu información verás este indicador en cualquier pantalla. Cuando termina cambia a "Diagnóstico actualizado".',
        placement: 'bottom',
        skipIfMissing: true,
        waitMs: 800,
      },
      {
        screen: 'diagnostico',
        target: 'diag-owed',
        title: 'Cómo leer el resultado',
        body: 'Aquí salen los meses que debes al SAT. "En revisión" quiere decir que todavía lo estamos confirmando con el SAT; "No presentada", que confirmamos que falta presentarla. El score de arriba resume cuántas llevas al corriente.',
        placement: 'top',
      },
      {
        target: 'diag-cta',
        title: 'Ponte al corriente',
        body: 'Si tienes pendientes, este botón te lleva a contratar las declaraciones que faltan.',
        placement: 'top',
        skipIfMissing: true,
        waitMs: 800,
      },
      closingStep('Ya sabes leer tu diagnóstico.'),
    ],
  },
  {
    id: 'ventas',
    title: 'Planes y trámites',
    description: 'Cómo ver los productos y qué puedes comprar según tu diagnóstico.',
    Icon: ShoppingBag,
    steps: [
      {
        target: 'nav-plan',
        title: 'Tus productos',
        body: 'En Mi plan ves tu plan actual y los productos que puedes contratar. Dale clic.',
        placement: 'right',
        prepare: openMenuOnMobile,
        advanceOn: 'click',
        fallback: (ctx) => ctx.go('plan'),
      },
      {
        screen: 'plan',
        target: 'plan-open-picker',
        title: 'Mira los productos',
        body: 'Con "Ver planes y pagar" abres el catálogo. Dale clic.',
        placement: 'top',
        advanceOn: 'click',
      },
      {
        target: 'picker-catalog',
        title: 'El catálogo',
        body: (ctx) =>
          ctx.diagnosticoTerminado
            ? 'Tu diagnóstico ya terminó: puedes elegir un plan, regularizar las declaraciones que debes y agregar trámites adicionales.'
            : 'Mientras tu diagnóstico no termine solo puedes comprar trámites adicionales.',
        placement: 'left',
      },
      {
        target: 'picker-lock',
        title: '¿Por qué solo trámites?',
        body: 'Los planes y las regularizaciones dependen de lo que encuentre tu diagnóstico en el SAT. Se desbloquean solos en cuanto termina.',
        placement: 'bottom',
        skipIfMissing: true,
        waitMs: 1000,
      },
      {
        target: 'nav-tramites',
        title: 'Trámites adicionales',
        body: 'Los trámites están disponibles siempre, aunque tu diagnóstico no haya terminado. Dale clic a Trámites.',
        placement: 'right',
        prepare: (ctx) => {
          ctx.closeDialogs()
          openMenuOnMobile(ctx)
        },
        advanceOn: 'click',
        fallback: (ctx) => ctx.go('tramites'),
      },
      {
        screen: 'tramites',
        target: 'tramites-list',
        title: 'Contrata un trámite',
        body: 'Elige el trámite que necesitas y págalo aquí mismo.',
        placement: 'top',
      },
      closingStep('Ya sabes dónde comprar.'),
    ],
  },
  {
    id: 'general',
    title: 'Dónde ver los tutoriales',
    description: 'Cómo volver a ver cualquier tutorial en cualquier momento.',
    Icon: CircleHelp,
    steps: [
      {
        target: 'help',
        title: 'Tus tutoriales',
        body: 'Con este botón abres la lista de tutoriales y vuelves a ver el que quieras, cuando quieras.',
        placement: 'bottom',
      },
      {
        title: 'Puedes saltarlos',
        body: 'Cada paso tiene "Omitir" para terminar de inmediato. Si das clic en lo que se resalta, el tutorial avanza solo; con "Siguiente" lo hacemos por ti.',
      },
    ],
  },
]

export function tutorialById(id: TutorialId): TutorialDef {
  return TUTORIALS.find((t) => t.id === id)!
}
