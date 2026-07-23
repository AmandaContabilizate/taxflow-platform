'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getAvailableRfcs,
  type AvailableRfc,
} from '@/features/taxpayers/actions/getAvailableRfcs.action'

interface RfcStoreValue {
  rfcs: AvailableRfc[]
  selectedRfc: string | null
  selectedRfcInfo: AvailableRfc | null
  loading: boolean
  error: string | null
  setSelectedRfc: (rfc: string) => void
  refresh: () => Promise<void>
}

const RfcContext = createContext<RfcStoreValue | null>(null)

const STORAGE_KEY = 'taxflow.selectedRfc'

interface RfcProviderProps {
  children: ReactNode
  initialRfc?: string | null
}

export function RfcProvider({ children, initialRfc = null }: RfcProviderProps) {
  const [rfcs, setRfcs] = useState<AvailableRfc[]>([])
  const [selectedRfc, setSelectedRfcState] = useState<string | null>(initialRfc)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const persistSelection = useCallback((value: string) => {
    setSelectedRfcState(value)
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, value)
      } catch {
        // ignore quota / disabled storage
      }
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const res = await getAvailableRfcs()
    if (res.success) {
      setRfcs(res.value)
      setError(null)
      setSelectedRfcState(prev => {
        if (prev && res.value.some(r => r.rfc === prev)) return prev
        if (initialRfc && res.value.some(r => r.rfc === initialRfc)) return initialRfc
        const stored =
          typeof window !== 'undefined'
            ? window.localStorage.getItem(STORAGE_KEY)
            : null
        if (stored && res.value.some(r => r.rfc === stored)) return stored
        return res.value[0]?.rfc ?? null
      })
    } else {
      setRfcs([])
      setError(res.error.message)
    }
    setLoading(false)
  }, [initialRfc])

  useEffect(() => {
    void load()
  }, [load])

  const selectedRfcInfo = useMemo(
    () => rfcs.find(r => r.rfc === selectedRfc) ?? null,
    [rfcs, selectedRfc],
  )

  const value = useMemo<RfcStoreValue>(
    () => ({
      rfcs,
      selectedRfc,
      selectedRfcInfo,
      loading,
      error,
      setSelectedRfc: persistSelection,
      refresh: load,
    }),
    [rfcs, selectedRfc, selectedRfcInfo, loading, error, persistSelection, load],
  )

  return <RfcContext.Provider value={value}>{children}</RfcContext.Provider>
}

export function useRfcStore(): RfcStoreValue {
  const ctx = useContext(RfcContext)
  if (!ctx) {
    throw new Error('useRfcStore debe usarse dentro de <RfcProvider>.')
  }
  return ctx
}

export function useSelectedRfc(): string | null {
  return useRfcStore().selectedRfc
}

export function useHasRfc(): { hasRfc: boolean; loading: boolean } {
  const { rfcs, selectedRfc, loading } = useRfcStore()
  return {
    hasRfc: Boolean(selectedRfc) || rfcs.length > 0,
    loading,
  }
}
