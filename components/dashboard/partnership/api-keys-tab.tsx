'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, Ban, KeySquare, Loader2 } from 'lucide-react'
import {
  getGrantedScopes,
  getPartnerApiKeys,
  getPartnerApiRequests,
  revokePartnerApiKey,
} from '@/features/partnership/actions/partnerCredentials.action'
import type { PartnerApiKey, PartnerRequestLogItem, PartnerScope } from '@/features/partnership/types'
import { MONO } from '../constants'
import { Badge, type BadgeKind, Btn, Card, ErrorState } from '../ui'
import { CreateApiKeyModal } from './create-api-key-modal'

const STATUS: Record<PartnerApiKey['status'], { label: string; kind: BadgeKind }> = {
  Active: { label: 'Vigente', kind: 'brand' },
  Expired: { label: 'Vencida', kind: 'amber' },
  Revoked: { label: 'Revocada', kind: 'coral' },
}

/** Integraciones → API Keys (Empresa.IntegracionesApiKeys): claves de la API para aliados + bitácora. */
export function ApiKeysTab() {
  const [keys, setKeys] = useState<PartnerApiKey[]>([])
  const [scopes, setScopes] = useState<PartnerScope[]>([])
  const [requests, setRequests] = useState<PartnerRequestLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const [k, s, r] = await Promise.all([getPartnerApiKeys(), getGrantedScopes(), getPartnerApiRequests(5)])
    if (k.success) setKeys(k.value)
    else setError(k.error.message)
    if (s.success) setScopes(s.value)
    if (r.success) setRequests(r.value)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleRevoke(key: PartnerApiKey) {
    if (!window.confirm(`¿Revocar la API key "${key.name}"? Las peticiones que la usen fallarán de inmediato.`)) return
    setRevokingId(key.id)
    setActionError(null)
    const res = await revokePartnerApiKey(key.id)
    setRevokingId(null)
    if (res.success) load()
    else setActionError(res.error.message)
  }

  const activeCount = keys.filter((k) => k.status === 'Active').length

  return (
    <div className="flex flex-col gap-4 max-w-full">
      <Card>
        <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
              API keys {loading ? '' : `· ${activeCount} vigente${activeCount === 1 ? '' : 's'}`}
            </div>
            <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
              Hasta 2 vigentes a la vez para rotar sin interrupciones. Solo guardamos el prefijo; la clave completa se
              muestra una vez.
            </div>
          </div>
          <Btn kind="primary" size="sm" onClick={() => setModalOpen(true)} disabled={loading || activeCount >= 2}>
            <KeySquare size={15} /> Nueva API key
          </Btn>
        </div>

        {actionError && (
          <div className="px-5 py-3 flex items-center gap-2 text-[13px]" style={{ color: 'var(--violet-ink)' }}>
            <AlertCircle size={15} /> {actionError}
          </div>
        )}

        {error ? (
          <ErrorState message={error} />
        ) : loading ? (
          <div className="px-5 py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Nombre', 'Prefijo', 'Permisos', 'Vence', 'Último uso', 'Estado', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left font-extrabold" style={{ color: 'var(--ink-700)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-5 py-4 font-semibold" style={{ color: 'var(--ink-900)' }}>{k.name}</td>
                    <td className="px-5 py-4 text-xs" style={{ ...MONO, color: 'var(--ink-700)' }}>{k.prefix}…</td>
                    <td className="px-5 py-4 text-xs" style={{ ...MONO, color: 'var(--ink-700)' }}>{k.scopes.join(', ') || '—'}</td>
                    <td className="px-5 py-4 whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>
                      {new Date(k.expiresAt).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>
                      {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString('es-MX') : 'Nunca'}
                    </td>
                    <td className="px-5 py-4">
                      <Badge kind={STATUS[k.status].kind}>{STATUS[k.status].label}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      {k.status === 'Active' && (
                        <Btn kind="ghost" size="sm" onClick={() => handleRevoke(k)} disabled={revokingId === k.id}>
                          {revokingId === k.id ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                          Revocar
                        </Btn>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {keys.length === 0 && (
              <div className="text-center py-8" style={{ color: 'var(--ink-500)' }}>
                Aún no hay API keys.
              </div>
            )}
          </div>
        )}
      </Card>

      <Card>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
            Llamadas a la API (últimos 5 días)
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Fecha', 'Método', 'Ruta', 'RFC', 'Resultado', 'Credencial', 'ms'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left font-extrabold" style={{ color: 'var(--ink-700)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-5 py-3 whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>
                    {new Date(r.createdAt).toLocaleString('es-MX')}
                  </td>
                  <td className="px-5 py-3 text-xs" style={MONO}>{r.httpMethod}</td>
                  <td className="px-5 py-3 text-xs truncate max-w-[260px]" style={MONO}>{r.path}</td>
                  <td className="px-5 py-3 text-xs" style={MONO}>{r.rfc ?? '—'}</td>
                  <td className="px-5 py-3">
                    <Badge kind={r.statusCode < 400 ? 'brand' : r.statusCode < 500 ? 'amber' : 'coral'}>{r.statusCode}</Badge>
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: 'var(--ink-700)' }}>
                    {r.credentialType === 'ApiKey' ? `API key #${r.credentialId}` : `Llave #${r.credentialId}`}
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: 'var(--ink-700)' }}>{r.durationMs}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && requests.length === 0 && (
            <div className="text-center py-8" style={{ color: 'var(--ink-500)' }}>
              Sin llamadas en los últimos 5 días.
            </div>
          )}
        </div>
      </Card>

      <CreateApiKeyModal open={modalOpen} onOpenChange={setModalOpen} grantedScopes={scopes} onCreated={load} />
    </div>
  )
}
