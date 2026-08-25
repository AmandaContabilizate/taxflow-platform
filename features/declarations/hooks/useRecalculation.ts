'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { recalculateDeclaration } from '../actions/recalculateDeclaration.action'
import type { ClassificationAdjustment, RecalculationResult } from '../types'

interface Target {
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
export function useRecalculation(target: Target) {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<RecalculationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [seconds, setSeconds] = useState(0)
  /** Sube en cada recálculo exitoso: las listas que dependen del cálculo se recargan. */
  const [version, setVersion] = useState(0)
  const runningRef = useRef(false)

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

      const res = await recalculateDeclaration({
        rfc: target.rfc,
        fiscalYear: target.fiscalYear,
        periodValueId: target.periodValueId!,
        regimeCode: target.regimeSatCode!,
        adjustments,
      })
      console.log(res);
      if (res.success) {
        setResult(res.value)
        setVersion((v) => v + 1)
      } else {
        setError(res.error.message)
      }

      runningRef.current = false
      setRunning(false)
    },
    [ready, target.rfc, target.fiscalYear, target.periodValueId, target.regimeSatCode],
  )

  return { running, seconds, result, error, version, ready, run }
}

export type Recalculation = ReturnType<typeof useRecalculation>
