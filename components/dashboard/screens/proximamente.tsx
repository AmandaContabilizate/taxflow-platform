'use client'

import { ScanLine, Sparkles } from 'lucide-react'
import type { ComponentType } from 'react'
import { Card } from '../ui'

/**
 * Pantalla comodín para features anunciadas pero aún no liberadas: el item ya vive
 * en el sidebar (con badge "Nuevo") pero la funcionalidad real queda reservada hasta
 * terminarse. Reutilizable: pásale título/descripción/icono por pantalla.
 */
export function ProximamenteScreen({
  titulo = 'Foto → Facturas',
  descripcion = 'Toma una foto de tu recibo y nosotros lo convertimos en factura CFDI, automáticamente.',
  Icon = ScanLine,
}: {
  titulo?: string
  descripcion?: string
  Icon?: ComponentType<{ size?: number }>
}) {
  return (
    <div className="max-w-2xl mx-auto w-full">
      <Card>
        <div className="px-8 py-14 flex flex-col items-center text-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--brand-100)', color: 'var(--brand-700)' }}
          >
            <Icon size={28} />
          </div>

          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-extrabold uppercase tracking-wide"
            style={{ background: '#F97316', color: '#FFFFFF' }}
          >
            <Sparkles size={12} /> Muy pronto
          </span>

          <h2
            className="text-2xl font-black"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--ink-900)' }}
          >
            {titulo} está en camino
          </h2>

          <p className="text-sm leading-relaxed max-w-md" style={{ color: 'var(--ink-600)' }}>
            {descripcion} Estamos terminando los últimos detalles — te avisaremos aquí mismo
            cuando esté lista.
          </p>
        </div>
      </Card>
    </div>
  )
}
