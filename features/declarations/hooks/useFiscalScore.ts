'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSelectedRfc } from '@/features/taxpayers/stores/rfcStore'
import { getFiscalScore } from '../actions/getFiscalScore.action'
import type { FiscalScore } from '../types'

type DiagnosticoStep = 'loading' | 'connecting' | 'checking' | 'ready'

function isStillChecking(score: FiscalScore | null): boolean {
  if (!score) return false
  return !score.hasCsfData || score.isReconciling || score.pendingVerificationCount > 0
}

function diagnosticoStep(score: FiscalScore | null, loading: boolean): DiagnosticoStep {
  if (loading || !score) return 'loading'
  if (!score.hasCsfData) return 'connecting'
  if (score.isReconciling || score.pendingVerificationCount > 0) return 'checking'
  return 'ready'
}

export function useFiscalScore() {
  const selectedRfc = useSelectedRfc()
  const [score, setScore] = useState<FiscalScore | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchScore = useCallback(async () => {
    if (!selectedRfc) {
      setScore(null)
      return
    }

    setLoading(true)
    const res = await getFiscalScore(selectedRfc)
    if (res.success) {
      setScore(res.value)
      setError(null)
    } else {
      setError(res.error.message)
    }
    setLoading(false)
  }, [selectedRfc])

  useEffect(() => {
    void fetchScore()
  }, [fetchScore])

  useEffect(() => {
    if (isStillChecking(score)) {
      const intervalId = setInterval(() => void fetchScore(), 20000)
      return () => clearInterval(intervalId)
    }
  }, [score, fetchScore])

  const step = diagnosticoStep(score, loading)

  return {
    score,
    step,
    loading,
    error,
    refresh: fetchScore,
  }
}
