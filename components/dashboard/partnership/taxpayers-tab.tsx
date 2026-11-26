'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, ChevronLeft, ChevronRight, Loader2, Search, Unlink } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { getPartnerTaxpayers, unlinkPartnerTaxpayer } from '@/features/partnership/actions/partnerTaxpayers.action'
import type { PartnerLinkStatus, PartnerTaxpayerLink } from '@/features/partnership/types'
import { MONO } from '../constants'
import { Badge, type BadgeKind, Btn, Card, ErrorState } from '../ui'

const PAGE_SIZE = 25

const STATUS: Record<PartnerLinkStatus, { label: string; kind: BadgeKind }> = {
  active: { label: 'Activa', kind: 'brand' },
  pending_consent: { label: 'Esperando al cliente', kind: 'amber' },
  consent_expired: { label: 'Solicitud vencida', kind: 'amber' },
  rejected: { label: 'Rechazada', kind: 'coral' },
  revoked_by_owner: { label: 'Retirada por el cliente', kind: 'coral' },
  unlinked: { label: 'Desligada', kind: 'coral' },
  reported_by_owner: { label: 'No reconocida por el cliente', kind: 'coral' },
}

const FILTERS: { value: PartnerLinkStatus | ''; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'active', label: 'Activas' },
  { value: 'pending_consent', label: 'Esperando al cliente' },
  { value: 'rejected', label: 'Rechazadas' },
  { value: 'revoked_by_owner', label: 'Retiradas' },
  { value: 'reported_by_owner', label: 'No reconocidas' },
  { value: 'unlinked', label: 'Desligadas' },
  { value: 'consent_expired', label: 'Vencidas' },
]

const CREDENTIAL_LABEL: Record<string, string> = {
  missing: 'Sin capturar',
  unverified: 'Validando',
  valid: 'Válida',
  invalid: 'Inválida',
  expired: 'Vencida',
}

const fecha = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('es-MX') : '—')

/**
 * Integraciones → Contribuyentes (Empresa.IntegracionesContribuyentes): RFC que la empresa dio de alta o
 * ligó por la API para aliados, con el estado del consentimiento del cliente y de sus credenciales SAT.
 */
export function TaxpayersTab() {
  const [items, setItems] = useState<PartnerTaxpayerLink[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<PartnerLinkStatus | ''>('')
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [unlinkingId, setUnlinkingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await getPartnerTaxpayers({ status, search: appliedSearch, page, pageSize: PAGE_SIZE })
    if (res.success) {
      setItems(res.value.items)
      setTotal(res.value.total)
    } else {
      setError(res.error.message)
    }
    setLoading(false)
  }, [status, appliedSearch, page])

  useEffect(() => {
    load()
  }, [load])

  async function handleUnlink(link: PartnerTaxpayerLink) {
    if (!window.confirm(`¿Desligar el RFC ${link.rfc}? Su empresa dejará de tener acceso a él por la API.`)) return
    setUnlinkingId(link.linkId)
    setActionError(null)
    const res = await unlinkPartnerTaxpayer(link.linkId)
    setUnlinkingId(null)
    if (res.success) load()
    else setActionError(res.error.message)
  }

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <Card>
      <div className="px-5 py-4 flex flex-col gap-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <div>
          <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
            Contribuyentes {loading ? '' : `· ${total}`}
          </div>
          <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
            RFC dados de alta o ligados por la API. Si el RFC ya tenía dueño en Contabilízate, el cliente debe aceptar por
            correo antes de que su empresa vea sus datos.
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="h-9 rounded-lg border px-3 text-[13px]"
            style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--ink-900)' }}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as PartnerLinkStatus | '')
              setPage(1)
            }}
          >
            {FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              setAppliedSearch(search)
              setPage(1)
            }}
          >
            <Input
              placeholder="RFC o referencia"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-56"
            />
            <Btn kind="ghost" size="sm" type="submit">
              <Search size={14} /> Buscar
            </Btn>
          </form>
        </div>
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
                {['RFC', 'Referencia', 'Estado', 'CIEC', 'e.firma', 'Alta', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left font-extrabold whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((l) => {
                const canUnlink = l.status === 'active' || l.status === 'pending_consent'
                return (
                  <tr key={l.linkId} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-5 py-3">
                      <div className="text-xs font-bold" style={{ ...MONO, color: 'var(--ink-900)' }}>{l.rfc}</div>
                      {l.taxpayer?.legalName && l.taxpayer.legalName !== l.rfc && (
                        <div className="text-[12px] truncate max-w-[220px]" style={{ color: 'var(--ink-500)' }}>
                          {l.taxpayer.legalName}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ ...MONO, color: 'var(--ink-700)' }}>{l.externalReference ?? '—'}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <Badge kind={STATUS[l.status].kind}>{STATUS[l.status].label}</Badge>
                      {l.status === 'pending_consent' && l.consentExpiresAt && (
                        <div className="text-[11.5px] mt-1" style={{ color: 'var(--ink-500)' }}>
                          vence {fecha(l.consentExpiresAt)}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>
                      {l.taxpayer ? CREDENTIAL_LABEL[l.taxpayer.ciec.status] : '—'}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>
                      {l.taxpayer ? CREDENTIAL_LABEL[l.taxpayer.efirma.status] : '—'}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>
                      {fecha(l.activatedAt ?? l.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      {canUnlink && (
                        <Btn kind="ghost" size="sm" onClick={() => handleUnlink(l)} disabled={unlinkingId === l.linkId}>
                          {unlinkingId === l.linkId ? <Loader2 size={14} className="animate-spin" /> : <Unlink size={14} />}
                          Desligar
                        </Btn>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {items.length === 0 && (
            <div className="text-center py-8" style={{ color: 'var(--ink-500)' }}>
              {status || appliedSearch ? 'No hay contribuyentes con ese filtro.' : 'Aún no hay contribuyentes dados de alta por la API.'}
            </div>
          )}
          {pages > 1 && (
            <div className="px-5 py-3 flex items-center justify-end gap-2 text-[13px]" style={{ color: 'var(--ink-700)' }}>
              <Btn kind="ghost" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                <ChevronLeft size={14} />
              </Btn>
              Página {page} de {pages}
              <Btn kind="ghost" size="sm" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages}>
                <ChevronRight size={14} />
              </Btn>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
