'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, Ban, Loader2, Upload } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  getAllProviderKeys,
  revokeProviderKey,
  uploadPublicKey,
} from '@/features/partnership/actions/partnerCredentials.action'
import type { ProviderKeySummary } from '@/features/partnership/types'
import { DISPLAY, MONO } from '../constants'
import { Badge, type BadgeKind, Btn, Card, ErrorState } from '../ui'

const STATUS: Record<ProviderKeySummary['status'], { label: string; kind: BadgeKind }> = {
  Active: { label: 'Vigente', kind: 'brand' },
  Expired: { label: 'Vencida', kind: 'amber' },
  Revoked: { label: 'Revocada', kind: 'coral' },
}

/**
 * Llaves de firma (SSO y JWT de la Partner API): todas, con su KeyId (= "kid" de los JWT), origen y
 * vigencia. Recomendado: el aliado genera su par y sube solo la llave pública o su certificado.
 * {@link refreshToken} cambia cuando otra parte de la pantalla genera una llave, para recargar.
 */
export function SigningKeysCard({ refreshToken }: { refreshToken: number }) {
  const [keys, setKeys] = useState<ProviderKeySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<number | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await getAllProviderKeys()
    if (res.success) setKeys(res.value)
    else setError(res.error.message)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load, refreshToken])

  async function handleRevoke(key: ProviderKeySummary) {
    if (!window.confirm('¿Revocar esta llave ahora? El SSO y las peticiones firmadas con ella fallarán de inmediato.')) return
    setRevokingId(key.providerKeyId)
    setActionError(null)
    const res = await revokeProviderKey(key.providerKeyId)
    setRevokingId(null)
    if (res.success) load()
    else setActionError(res.error.message)
  }

  return (
    <Card>
      <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <div>
          <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>Llaves de firma</div>
          <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
            Al agregar una llave, las anteriores siguen valiendo 7 días para que actualice sus servidores sin cortes.
          </div>
        </div>
        <Btn kind="primary" size="sm" onClick={() => setUploadOpen(true)}>
          <Upload size={15} /> Subir llave pública
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
        <div className="px-5 py-8 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
          <Loader2 size={18} className="animate-spin" /> Cargando llaves…
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['KeyId (kid)', 'Origen', 'Creada', 'Vence', 'Estado', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left font-extrabold" style={{ color: 'var(--ink-700)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.providerKeyId} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-5 py-3 text-xs" style={{ ...MONO, color: 'var(--ink-900)' }}>{k.keyId}</td>
                  <td className="px-5 py-3" style={{ color: 'var(--ink-700)' }}>
                    {k.source === 'Uploaded' ? 'Subida por ustedes' : 'Generada por Contabilízate'}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>
                    {new Date(k.createdAt).toLocaleDateString('es-MX')}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>
                    {k.validTo ? new Date(k.validTo + (k.validTo.endsWith('Z') ? '' : 'Z')).toLocaleString('es-MX') : 'Sin vencimiento'}
                  </td>
                  <td className="px-5 py-3">
                    <Badge kind={STATUS[k.status].kind}>{STATUS[k.status].label}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    {k.status === 'Active' && (
                      <Btn kind="ghost" size="sm" onClick={() => handleRevoke(k)} disabled={revokingId === k.providerKeyId}>
                        {revokingId === k.providerKeyId ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                        Revocar ya
                      </Btn>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {keys.length === 0 && (
            <div className="text-center py-8" style={{ color: 'var(--ink-500)' }}>No hay llaves registradas.</div>
          )}
        </div>
      )}

      <UploadPublicKeyModal open={uploadOpen} onOpenChange={setUploadOpen} onUploaded={load} />
    </Card>
  )
}

function UploadPublicKeyModal({
  open,
  onOpenChange,
  onUploaded,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploaded: () => void
}) {
  const [pem, setPem] = useState('')
  const [days, setDays] = useState('365')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploaded, setUploaded] = useState<ProviderKeySummary | null>(null)

  const isCertificate = pem.includes('BEGIN CERTIFICATE')

  function handleClose(next: boolean) {
    if (!next) {
      setPem('')
      setDays('365')
      setError(null)
      setUploaded(null)
    }
    onOpenChange(next)
  }

  async function handleUpload() {
    setSaving(true)
    setError(null)
    const res = await uploadPublicKey({
      publicKeyPem: pem.trim(),
      expiresInDays: isCertificate ? undefined : Number(days),
    })
    setSaving(false)
    if (res.success) {
      setUploaded(res.value)
      onUploaded()
    } else {
      setError(res.error.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="p-0 gap-0 sm:max-w-lg max-h-[88vh] overflow-hidden flex flex-col">
        <div className="px-6 pt-6 pb-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <DialogHeader>
            <DialogTitle className="text-[19px] font-extrabold tracking-tight" style={DISPLAY}>
              {uploaded ? 'Llave registrada' : 'Subir llave pública'}
            </DialogTitle>
            <DialogDescription className="mt-0.5">
              {uploaded
                ? 'Firme sus JWT con la llave privada correspondiente y ponga este KeyId en el encabezado "kid".'
                : 'Pegue la llave pública RSA (2048 bits o más) en PEM, o su certificado X.509. La llave privada nunca sale de sus servidores.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {uploaded ? (
            <div className="flex flex-col gap-2 text-[13.5px]" style={{ color: 'var(--ink-700)' }}>
              <div>
                <span className="font-bold" style={{ color: 'var(--ink-900)' }}>KeyId (kid):</span>{' '}
                <code style={MONO}>{uploaded.keyId}</code>
              </div>
              <div>
                <span className="font-bold" style={{ color: 'var(--ink-900)' }}>Vence:</span>{' '}
                {uploaded.validTo ? new Date(uploaded.validTo + (uploaded.validTo.endsWith('Z') ? '' : 'Z')).toLocaleString('es-MX') : '—'}
              </div>
            </div>
          ) : (
            <>
              <textarea
                className="w-full min-h-[180px] rounded-lg border p-3 text-xs"
                style={{ ...MONO, borderColor: 'var(--border)' }}
                placeholder={'-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----'}
                value={pem}
                onChange={(e) => setPem(e.target.value)}
              />
              {pem.includes('PRIVATE KEY') && (
                <div className="text-[13px] font-semibold" style={{ color: 'var(--violet-ink)' }}>
                  Eso es una llave PRIVADA. No la comparta: suba solo la pública.
                </div>
              )}
              {!isCertificate && (
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-bold" style={{ color: 'var(--ink-500)' }}>Vigencia (días, 1 a 730)</label>
                  <Input type="number" min={1} max={730} value={days} onChange={(e) => setDays(e.target.value)} className="w-32" />
                </div>
              )}
              {isCertificate && (
                <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
                  La vigencia se toma del certificado.
                </div>
              )}
              {error && (
                <div className="text-[13px] font-semibold" style={{ color: 'var(--violet-ink)' }}>{error}</div>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-end gap-2" style={{ borderColor: 'var(--border)' }}>
          {uploaded ? (
            <Btn kind="primary" size="sm" onClick={() => handleClose(false)}>Cerrar</Btn>
          ) : (
            <>
              <Btn kind="ghost" size="sm" onClick={() => handleClose(false)} disabled={saving}>Cancelar</Btn>
              <Btn
                kind="brand"
                size="sm"
                onClick={handleUpload}
                disabled={saving || !pem.trim() || pem.includes('PRIVATE KEY')}
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                {saving ? 'Registrando…' : 'Registrar llave'}
              </Btn>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
