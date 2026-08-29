'use client'

interface Props {
  fecha?: string | null
}

/**
 * Muestra la fecha de la primera venta pagada del contribuyente y los días
 * transcurridos hasta la fecha actual (antigüedad del cliente).
 */
export function PrimeraCompraCell({ fecha }: Props) {
  if (!fecha) {
    return <span className="text-xs" style={{ color: 'var(--ink-400)' }}>—</span>
  }

  const date = new Date(fecha)
  if (Number.isNaN(date.getTime())) {
    return <span className="text-xs" style={{ color: 'var(--ink-500)' }}>{fecha}</span>
  }

  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)))

  const formattedDate = date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  let diffText = `hace ${diffDays} días`
  if (diffDays === 0) diffText = 'hoy'
  else if (diffDays === 1) diffText = 'ayer'
  else if (diffDays >= 365) {
    const years = (diffDays / 365).toFixed(1)
    diffText = `hace ${years} años (${diffDays} d)`
  }

  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-semibold text-[13px] whitespace-nowrap" style={{ color: 'var(--ink-900)' }}>
        {formattedDate}
      </span>
      <span className="text-[11.5px] whitespace-nowrap font-mono" style={{ color: 'var(--ink-500)' }}>
        {diffText}
      </span>
    </div>
  )
}
