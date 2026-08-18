'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, KeyRound, Loader2 } from 'lucide-react'
import { getActiveKey } from '@/features/partnership/actions/getActiveKey.action'
import { getIdentityBaseUrl } from '@/features/partnership/actions/getIdentityBaseUrl.action'
import type { NewKeyResponse, ProviderKeyItem } from '@/features/partnership/types'
import { MONO } from '../constants'
import { Btn, Card } from '../ui'
import { GenerateKeyModal } from './generate-key-modal'
import { KeysCodeExamples } from './keys-code-examples'
import { KeysSignOutExamples } from './keys-signout-examples'

export function KeysTab() {
  const [activeKey, setActiveKey] = useState<ProviderKeyItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [identityBaseUrl, setIdentityBaseUrl] = useState<string>('')
  const [modalOpen, setModalOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await getActiveKey()
    if (res.success) setActiveKey(res.value)
    else setError(res.error.message)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    getIdentityBaseUrl().then(setIdentityBaseUrl)
  }, [load])

  function handleGenerated(result: NewKeyResponse) {
    setActiveKey({
      providerKeyId: result.providerKeyId,
      privateKeyPrefijo: result.privateKeyPrefijo,
      privateKeyPostfijo: result.privateKeyPostfijo,
      createdAt: result.createdAt,
      isActive: true,
      providerName: result.providerName,
    })
  }

  return (
    <div className="flex flex-col gap-4 max-w-full">
      <Card className="p-5">
        <div className="text-[15px] font-extrabold mb-3" style={{ color: 'var(--ink-900)' }}>
          Llave activa
        </div>

        {error ? (
          <div className="flex items-center gap-2 text-[13.5px]" style={{ color: 'var(--violet-ink)' }}>
            <AlertCircle size={16} /> {error}
          </div>
        ) : loading ? (
          <div className="flex items-center gap-2 py-4" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={16} className="animate-spin" /> Cargando…
          </div>
        ) : activeKey ? (
          <div className="space-y-1.5 text-[13.5px]" style={{ color: 'var(--ink-700)' }}>
            <p>
              <span className="font-bold" style={{ color: 'var(--ink-900)' }}>Prefijo:</span>{' '}
              <code style={MONO}>{activeKey.privateKeyPrefijo ?? '—'}</code>
            </p>
            <p>
              <span className="font-bold" style={{ color: 'var(--ink-900)' }}>Postfijo:</span>{' '}
              <code style={MONO}>{activeKey.privateKeyPostfijo ?? '—'}</code>
            </p>
            <p>
              <span className="font-bold" style={{ color: 'var(--ink-900)' }}>Creada:</span>{' '}
              {new Date(activeKey.createdAt).toLocaleString('es-MX')}
            </p>
          </div>
        ) : (
          <div className="text-[13.5px]" style={{ color: 'var(--ink-500)' }}>
            No hay llaves activas.
          </div>
        )}
      </Card>

      <div>
        <Btn kind="primary" size="sm" onClick={() => setModalOpen(true)}>
          <KeyRound size={15} /> Crear nueva llave
        </Btn>
      </div>

      <GenerateKeyModal open={modalOpen} onOpenChange={setModalOpen} onGenerated={handleGenerated} />

      <KeysCodeExamples providerName={activeKey?.providerName ?? null} identityBaseUrl={identityBaseUrl} />
      <KeysSignOutExamples providerName={activeKey?.providerName ?? null} identityBaseUrl={identityBaseUrl} />
    </div>
  )
}
