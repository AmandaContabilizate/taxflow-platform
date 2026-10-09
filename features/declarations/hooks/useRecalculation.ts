'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { recalculateDeclaration } from '../actions/recalculateDeclaration.action'
import type { ClassificationAdjustment, RecalcScopeState, RecalculationResult } from '../types'

interface Target {
  /**
   * Declaración que se está viendo. Viaja en el body para que el back escriba en
   * ella y no en la "vigente" del periodo (las complementarias comparten periodo).
   */
  declarationId: number
  rfc: string
  fiscalYear: number
  periodValueId: number | null | undefined
  /** Código SAT del régimen ("625", "626", …), no el Id interno. */
  regimeSatCode: string | null | undefined
}

/**
 * Estado del botón "Recalcular". El cálculo baja y parsea los XML del blob, así
 * que puede tardar minutos: se lleva un contador de segundos para que el spinner
 * no parezca colgado.
 */
export function useRecalculation(
  target: Target,
  /** Se llama tras cada recálculo exitoso: la pantalla recarga /general, bitácora y pestañas. */
  onSuccess?: (result: RecalculationResult) => void,
) {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<RecalculationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [seconds, setSeconds] = useState(0)
  /** Sube en cada recálculo exitoso: las listas que dependen del cálculo se recargan. */
  const [version, setVersion] = useState(0)
  const runningRef = useRef(false)
  // Ajustes pendientes y su alcance, por UUID. Viven aquí y no en la pestaña: la pestaña se
  // desmonta al cambiar de tab y el contador perdía lo que había corregido sin mandarlo.
  const [adjustments, setAdjustments] = useState<Record<string, ClassificationAdjustment>>({})
  const [scopeByUuid, setScopeByUuid] = useState<Record<string, RecalcScopeState>>({})

  // El callback llega como función inline: se guarda en un ref para no reconstruir `run`.
  const onSuccessRef = useRef(onSuccess)
  useEffect(() => {
    onSuccessRef.current = onSuccess
  })

  // Al cambiar de declaración el resultado anterior ya no aplica: las tarjetas
  // pintaban los totales de la otra declaración.
  useEffect(() => {
    setResult(null)
    setError(null)
  }, [target.declarationId])

  const ready = Boolean(target.rfc && target.periodValueId && target.regimeSatCode)

  useEffect(() => {
    if (!running) return
    setSeconds(0)
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [running])

  const run = useCallback(
    async (adjustments: ClassificationAdjustment[] = []) => {
      if (runningRef.current) return
      if (!ready) {
        setError('La declaración no tiene periodo o régimen asignado: no se puede recalcular.')
        return
      }

      runningRef.current = true
      setRunning(true)
      setError(null)

      // Sin este try, un fallo de la llamada a la server action (red, timeout del balanceador,
      // deploy nuevo) rechazaba la promesa: el spinner se quedaba contando para siempre y los
      // clics siguientes salían en silencio por el `runningRef`.
      try {
        const res = await recalculateDeclaration({
          declarationId: target.declarationId,
          rfc: target.rfc,
          fiscalYear: target.fiscalYear,
          periodValueId: target.periodValueId!,
          regimeCode: target.regimeSatCode!,
          adjustments,
        })
        if (res.success) {
          setResult(res.value)
          setVersion((v) => v + 1)
          // Solo dejan de estar pendientes los ajustes que el back confirmó. El recálculo sin
          // ajustes (botón del encabezado) ya no borra lo que el contador tenía por mandar.
          const applied = new Set(res.value.appliedAdjustments.map((u) => u.toUpperCase()))
          if (applied.size > 0) {
            const keep = <T,>(prev: Record<string, T>) =>
              Object.fromEntries(Object.entries(prev).filter(([uuid]) => !applied.has(uuid.toUpperCase())))
            setAdjustments(keep)
            setScopeByUuid(keep)
          }
          onSuccessRef.current?.(res.value)
        } else {
          setError(res.error.message)
        }
      } catch {
        setError(
          'Se perdió la conexión mientras se recalculaba. El cálculo pudo haber terminado en el servidor: recarga la declaración antes de volver a intentarlo.',
        )
      } finally {
        runningRef.current = false
        setRunning(false)
      }
    },
    [ready, target.declarationId, target.rfc, target.fiscalYear, target.periodValueId, target.regimeSatCode],
  )

  return {
    running,
    seconds,
    result,
    error,
    version,
    ready,
    run,
    adjustments,
    setAdjustments,
    scopeByUuid,
    setScopeByUuid,
  }
}

export type Recalculation = ReturnType<typeof useRecalculation>
