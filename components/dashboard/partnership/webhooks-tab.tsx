'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, Check, Copy, KeyRound, Loader2, Pencil, Plus, RotateCw, Send, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  createWebhook,
  deleteWebhook,
  getWebhookDeliveries,
  getWebhookEventTypes,
  getWebhooks,
  redeliverWebhook,
  rotateWebhookSecret,
  updateWebhook,
} from '@/features/partnership/actions/partnerWebhooks.action'
import type { PartnerEventTypeItem, WebhookDelivery, WebhookEndpoint } from '@/features/partnership/types'
import { MONO } from '../constants'
import { Modal } from '../modal'
import { Badge, type BadgeKind, Btn, Card, ErrorState } from '../ui'

const DELIVERY: Record<WebhookDelivery['status'], { label: string; kind: BadgeKind }> = {
  Pending: { label: 'Pendiente', kind: 'sky' },
  Delivered: { label: 'Entregado', kind: 'brand' },
  Failed: { label: 'Falló', kind: 'coral' },
  Retrying: { label: 'Reintentando', kind: 'amber' },
}

/**
 * Integraciones → Webhooks (Empresa.IntegracionesWebhooks): URL https que recibe los eventos firmados
 * (HMAC-SHA256 en X-Contabilizate-Signature), eventos suscritos, secreto (visible una vez) e historial con
 * "Reenviar". Si su endpoint falla no reintentamos: puede reenviar aquí o leer GET /events.
 */
export function WebhooksTab() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([])
  const [eventTypes, setEventTypes] = useState<PartnerEventTypeItem[]>([])
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([])
  const [onlyFailed, setOnlyFailed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [editing, setEditing] = useState<WebhookEndpoint | 'new' | null>(null)
  const [secret, setSecret] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const [e, t, d] = await Promise.all([getWebhooks(), getWebhookEventTypes(), getWebhookDeliveries(onlyFailed)])
    if (e.success) setEndpoints(e.value)
    else setError(e.error.message)
    if (t.success) setEventTypes(t.value)
    if (d.success) setDeliveries(d.value)
    setLoading(false)
  }, [onlyFailed])

  useEffect(() => {
    load()
  }, [load])

  async function act(key: string, fn: () => Promise<{ success: boolean; error?: { message: string } }>) {
    setBusy(key)
    setError(null)
    const res = await fn()
    setBusy(null)
    if (res.success) await load()
    else setError(res.error?.message ?? 'Ocurrió un error.')
  }

  async function rotate(endpoint: WebhookEndpoint) {
    if (!window.confirm('¿Generar un secreto nuevo? El actual deja de servir de inmediato: actualícelo en su servidor.')) return
    setBusy(`rotate-${endpoint.id}`)
    const res = await rotateWebhookSecret(endpoint.id)
    setBusy(null)
    if (res.success) setSecret(res.value.secret)
    else setError(res.error.message)
  }

  const urlOf = (id: number) => endpoints.find((e) => e.id === id)?.url ?? `#${id}`

  return (
    <div className="flex flex-col gap-4 max-w-full">
      <Card>
        <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>Endpoints</div>
            <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
              Le avisamos por POST firmado. Verifique la firma y responda 2xx; si su servidor falla no reintentamos.
            </div>
          </div>
          <Btn kind="primary" size="sm" onClick={() => setEditing('new')} disabled={loading}>
            <Plus size={15} /> Nuevo webhook
          </Btn>
        </div>

        {error && (
          <div className="px-5 py-3 flex items-center gap-2 text-[13px]" style={{ color: 'var(--violet-ink)' }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {loading ? (
          <div className="px-5 py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando…
          </div>
        ) : endpoints.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--ink-500)' }}>Aún no hay webhooks.</div>
        ) : (
          <div className="flex flex-col">
            {endpoints.map((e) => (
              <div key={e.id} className="px-5 py-4 flex flex-col gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold break-all" style={{ ...MONO, color: 'var(--ink-900)' }}>{e.url}</div>
                    {e.description && <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>{e.description}</div>}
                  </div>
                  <Badge kind={e.isActive ? 'brand' : 'default'}>{e.isActive ? 'Activo' : 'Inactivo'}</Badge>
                </div>
                <div className="text-[12px]" style={{ ...MONO, color: 'var(--ink-700)' }}>{e.events.join(' · ')}</div>
                <div className="flex gap-2 justify-end flex-wrap">
                  <Btn kind="ghost" size="sm" onClick={() => setEditing(e)} disabled={busy !== null}>
                    <Pencil size={14} /> Editar
                  </Btn>
                  <Btn kind="ghost" size="sm" onClick={() => rotate(e)} disabled={busy !== null}>
                    {busy === `rotate-${e.id}` ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />} Rotar secreto
                  </Btn>
                  <Btn
                    kind="ghost"
                    size="sm"
                    disabled={busy !== null}
                    onClick={() => {
                      if (window.confirm('¿Eliminar este webhook? Si ya tiene entregas, quedará desactivado para conservar el historial.'))
                        void act(`del-${e.id}`, () => deleteWebhook(e.id))
                    }}
                  >
                    {busy === `del-${e.id}` ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Eliminar
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>Entregas recientes</div>
          <div className="flex gap-2">
            <Btn kind={!onlyFailed ? 'primary' : 'ghost'} size="sm" onClick={() => setOnlyFailed(false)}>Todas</Btn>
            <Btn kind={onlyFailed ? 'primary' : 'ghost'} size="sm" onClick={() => setOnlyFailed(true)}>Fallidas</Btn>
            <Btn kind="ghost" size="sm" onClick={() => load()}><RotateCw size={14} /></Btn>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Fecha', 'Evento', 'RFC', 'Endpoint', 'Estado', 'Detalle', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left font-extrabold whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deliveries.map((d) => (
                <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-5 py-3 whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>{new Date(d.createdAt).toLocaleString('es-MX')}</td>
                  <td className="px-5 py-3 text-xs" style={MONO}>{d.eventType}</td>
                  <td className="px-5 py-3 text-xs" style={MONO}>{d.rfc ?? '—'}</td>
                  <td className="px-5 py-3 text-xs truncate max-w-[220px]" style={MONO}>{urlOf(d.endpointId)}</td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <Badge kind={DELIVERY[d.status].kind}>{DELIVERY[d.status].label}</Badge>
                    {d.isManualRedelivery && <span className="ml-1 text-[11px]" style={{ color: 'var(--ink-500)' }}>reenvío</span>}
                  </td>
                  <td className="px-5 py-3 text-[12px] max-w-[260px]" style={{ color: 'var(--ink-700)' }}>
                    {d.httpStatus ? `HTTP ${d.httpStatus}` : ''} {d.lastError ?? ''}
                  </td>
                  <td className="px-5 py-3">
                    {d.status === 'Failed' && (
                      <Btn kind="ghost" size="sm" disabled={busy !== null} onClick={() => act(`re-${d.id}`, () => redeliverWebhook(d.id))}>
                        {busy === `re-${d.id}` ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Reenviar
                      </Btn>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && deliveries.length === 0 && (
            <div className="text-center py-8" style={{ color: 'var(--ink-500)' }}>Sin entregas.</div>
          )}
        </div>
      </Card>

      {editing && (
        <WebhookModal
          endpoint={editing === 'new' ? null : editing}
          eventTypes={eventTypes}
          onClose={() => setEditing(null)}
          onSaved={(newSecret) => {
            setEditing(null)
            if (newSecret) setSecret(newSecret)
            void load()
          }}
        />
      )}

      {secret && <SecretModal secret={secret} onClose={() => setSecret(null)} />}
    </div>
  )
}

function WebhookModal({
  endpoint,
  eventTypes,
  onClose,
  onSaved,
}: {
  endpoint: WebhookEndpoint | null
  eventTypes: PartnerEventTypeItem[]
  onClose: () => void
  onSaved: (secret: string | null) => void
}) {
  const [url, setUrl] = useState(endpoint?.url ?? 'https://')
  const [description, setDescription] = useState(endpoint?.description ?? '')
  const [events, setEvents] = useState<string[]>(endpoint?.events ?? eventTypes.map((t) => t.code))
  const [isActive, setIsActive] = useState(endpoint?.isActive ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggle = (code: string) => setEvents((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))

  async function save() {
    setSaving(true)
    setError(null)
    const data = { url: url.trim(), description: description.trim() || undefined, events, isActive }
    if (endpoint) {
      const res = await updateWebhook(endpoint.id, data)
      setSaving(false)
      if (res.success) onSaved(null)
      else setError(res.error.message)
    } else {
      const res = await createWebhook(data)
      setSaving(false)
      if (res.success) onSaved(res.value.secret)
      else setError(res.error.message)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={endpoint ? 'Editar webhook' : 'Nuevo webhook'} maxWidth={560}>
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-[12px] font-bold" style={{ color: 'var(--ink-500)' }}>
          URL (https, puerto 443)
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://api.suempresa.com/webhooks/contabilizate" />
        </label>
        <label className="flex flex-col gap-1 text-[12px] font-bold" style={{ color: 'var(--ink-500)' }}>
          Descripción (opcional)
          <Input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={255} />
        </label>
        <div className="flex flex-col gap-2">
          <div className="text-[12px] font-bold" style={{ color: 'var(--ink-500)' }}>Eventos</div>
          {eventTypes.map((t) => (
            <label key={t.code} className="flex items-start gap-2.5 text-[13.5px] cursor-pointer" style={{ color: 'var(--ink-700)' }}>
              <input type="checkbox" className="mt-1" checked={events.includes(t.code)} onChange={() => toggle(t.code)} />
              <span>
                <span className="font-bold" style={{ ...MONO, color: 'var(--ink-900)' }}>{t.code}</span>
                <span className="block text-[12.5px]" style={{ color: 'var(--ink-500)' }}>{t.description}</span>
              </span>
            </label>
          ))}
        </div>
        {endpoint && (
          <label className="flex items-center gap-2 text-[13.5px]" style={{ color: 'var(--ink-700)' }}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Activo
          </label>
        )}
        {error && <div className="text-[13px] font-semibold" style={{ color: 'var(--violet-ink)' }}>{error}</div>}
        <div className="flex justify-end gap-2">
          <Btn kind="ghost" size="sm" onClick={onClose} disabled={saving}>Cancelar</Btn>
          <Btn kind="brand" size="sm" onClick={save} disabled={saving || events.length === 0 || !url.startsWith('https://')}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Guardar
          </Btn>
        </div>
      </div>
    </Modal>
  )
}

function SecretModal({ secret, onClose }: { secret: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  return (
    <Modal isOpen onClose={onClose} title="Secreto de firma" subtitle="Cópielo ahora: no se guarda y no podrá volver a verlo." maxWidth={560}>
      <div className="flex flex-col gap-3">
        <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap break-all">{secret}</pre>
        <div className="text-[12.5px]" style={{ color: 'var(--ink-700)' }}>
          Valide cada envío: <span style={MONO}>HMAC-SHA256(secreto, t + "." + cuerpo)</span> debe ser igual a{' '}
          <span style={MONO}>v1</span> del encabezado <span style={MONO}>X-Contabilizate-Signature</span>, y rechace firmas
          con más de 5 minutos.
        </div>
        <div className="flex justify-end gap-2">
          <Btn
            kind="ghost"
            size="sm"
            onClick={async () => {
              await navigator.clipboard.writeText(secret)
              setCopied(true)
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copiado' : 'Copiar'}
          </Btn>
          <Btn kind="primary" size="sm" onClick={onClose}>Ya lo guardé</Btn>
        </div>
      </div>
    </Modal>
  )
}
