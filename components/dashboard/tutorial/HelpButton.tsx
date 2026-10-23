'use client'

import { CircleHelp } from 'lucide-react'
import { useTutorial } from './TutorialProvider'

/** "?" junto a la campana: abre la lista de tutoriales. Solo existe dentro del TutorialProvider (Guest). */
export function HelpButton() {
  const tutorial = useTutorial()
  if (!tutorial) return null

  return (
    <button
      type="button"
      data-tour="help"
      onClick={tutorial.openMenu}
      className="relative p-2.5 rounded-full hover:bg-accent/80 transition-colors text-foreground/80 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
      aria-label="Ver tutoriales"
      title="Tutoriales"
    >
      <CircleHelp className="h-5 w-5" />
    </button>
  )
}
