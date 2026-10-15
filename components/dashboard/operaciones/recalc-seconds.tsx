'use client'

import { useEffect, useState } from 'react'

const elapsed = (startedAt: number) => Math.max(0, Math.floor((Date.now() - startedAt) / 1000))

/**
 * Segundos transcurridos desde que arrancó el recálculo. Es el único componente
 * que se repinta cada segundo: antes el intervalo vivía en `useRecalculation` y
 * cada tick re-renderizaba el detalle entero y la pestaña Recálculo con todas sus
 * filas (el punto más caro de la pantalla).
 *
 * Se calcula a partir de `startedAt` y no con un acumulador: así, si la pestaña se
 * desmonta y vuelve, el número sigue siendo el real.
 */
export function RecalcSeconds({ startedAt }: { startedAt: number | null }) {
  const [seconds, setSeconds] = useState(() => (startedAt == null ? 0 : elapsed(startedAt)))

  useEffect(() => {
    if (startedAt == null) return
    setSeconds(elapsed(startedAt))
    const id = setInterval(() => setSeconds(elapsed(startedAt)), 1000)
    return () => clearInterval(id)
  }, [startedAt])

  return <>{seconds}</>
}
