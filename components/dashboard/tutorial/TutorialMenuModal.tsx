'use client'

import { ChevronRight } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DISPLAY } from '../constants'
import { TUTORIALS, type TutorialId } from './tutorials'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (id: TutorialId) => void
}

export function TutorialMenuModal({ open, onOpenChange, onSelect }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle style={{ ...DISPLAY, color: 'var(--ink-900)' }}>Tutoriales</DialogTitle>
          <DialogDescription>Elige uno y te guiamos paso a paso. Puedes omitirlo cuando quieras.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {TUTORIALS.map(({ id, title, description, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className="flex items-center gap-3 rounded-2xl p-3.5 text-left transition-[border-color,transform] duration-150 active:scale-[0.99] hover:border-[var(--brand-500)]"
              style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}
            >
              <span
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--brand-50)', color: 'var(--brand-700)' }}
              >
                <Icon size={18} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-bold text-[14px]" style={{ color: 'var(--ink-900)' }}>
                  {title}
                </span>
                <span className="block text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                  {description}
                </span>
              </span>
              <ChevronRight size={16} style={{ color: 'var(--ink-400)' }} />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
