'use client'

import { useState } from 'react'
import { Bot } from 'lucide-react'
import { DISPLAY } from './constants'
import { useDraggableSnap } from './hooks/useDraggableSnap'

const WHATSAPP_URL = 'http://wa.me/5660963169'

/**
 * Botón flotante interactivo con arrastre magnético (Snap-to-Edge) y persistencia
 * exclusivo para usuarios con rol GUEST (clientes contribuyentes).
 * Conecta 24/7 con el asistente virtual inteligente "Conta Vic" en WhatsApp.
 */
export function FloatingContadorButton() {
  const [hovered, setHovered] = useState(false)
  const {
    position,
    isDragging,
    hasMoved,
    lastDragEndRef,
    elementRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  } = useDraggableSnap()

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Suprimir el clic únicamente si fue producto de un gesto de arrastre
    if (hasMoved || Date.now() - lastDragEndRef.current < 300) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  if (!position) return null

  return (
    <aside
      ref={elementRef}
      aria-label="Asistencia virtual Conta Vic"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className={`fixed z-40 touch-none select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transition: isDragging
          ? 'none'
          : 'left 0.35s cubic-bezier(0.16, 1, 0.3, 1), top 0.2s ease-out, transform 0.2s ease',
        transform: isDragging
          ? 'scale(0.96)'
          : hovered
            ? 'scale(1.03)'
            : 'scale(1)',
        opacity: isDragging ? 0.92 : 1,
      }}
    >
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        draggable={false}
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="Abrir chat con Conta Vic en WhatsApp"
        className="group relative flex items-center gap-2.5 px-3.5 py-2 rounded-full shadow-lg hover:shadow-2xl active:scale-95"
        style={{
          background:
            'linear-gradient(135deg, #221158 0%, #332670 60%, #4B21B8 100%)',
          border: '1.5px solid rgba(115, 57, 253, 0.4)',
          boxShadow: hovered
            ? '0 12px 30px -4px rgba(115, 57, 253, 0.5), 0 0 16px 2px rgba(0, 211, 161, 0.3)'
            : '0 8px 24px -4px rgba(34, 17, 88, 0.35)',
        }}
      >
        {/* Avatar del Asistente Conta Vic con punto pulsante Online */}
        <div
          className="relative flex items-center justify-center flex-shrink-0"
          draggable={false}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:rotate-6"
            style={{
              background: 'linear-gradient(135deg, #00D3A1 0%, #00876B 100%)',
              color: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(0, 211, 161, 0.4)',
            }}
          >
            <Bot size={17} className="stroke-[2.2]" />
          </div>
          {/* Indicador pulsante Online */}
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: '#06FF94' }}
            />
            <span
              className="relative inline-flex rounded-full h-2.5 w-2.5 border-2 border-[#221158]"
              style={{ background: '#00D3A1' }}
            />
          </span>
        </div>

        {/* Textos de Identidad Corporativa */}
        <div
          className="flex flex-col items-start pr-1 select-none"
          draggable={false}
        >
          <div className="flex items-center gap-1.5 leading-none whitespace-nowrap">
            <span
              className="text-[13.5px] font-extrabold text-white tracking-tight"
              style={DISPLAY}
            >
              Conta Vic
            </span>
            <span
              className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full leading-none"
              style={{
                background: 'rgba(0, 211, 161, 0.2)',
                color: '#06FF94',
                border: '1px solid rgba(0, 211, 161, 0.35)',
              }}
            >
              24/7
            </span>
          </div>
          <span className="text-[10.5px] font-medium text-[#D2CDE9] mt-0.5 whitespace-nowrap leading-tight">
            Tu Asistente Contable
          </span>
        </div>
      </a>
    </aside>
  )
}
