'use client'

import { Check, Copy, Loader2, Save, Tag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getDiscountCodeLookups } from '@/features/discountCodes/actions/getDiscountCodes.action'
import { savePartner } from '@/features/partners/actions/savePartner.action'
import type { Partner } from '@/features/partners/types'
import { MONO } from '../constants'
import { Modal } from '../modal'

interface Props {
  open: boolean
  /** null = crear; con valor = editar. */
  partner: Partner | null
  onClose: () => void
  onSaved: () => void
}

const inputStyle = {
  background: 'var(--input)',
  border: '1px solid var(--border)',
  color: 'var(--foreground)',
} as const

export function PartnerModal({ open, partner, onClose, onSaved }: Props) {
  const [name, setName] = useState('')
  const [receivesCommission, setReceivesCommission] = useState(true)
  const [isAlliance, setIsAlliance] = useState(false)
  const [executiveUserId, setExecutiveUserId] = useState('')
  const [allianceStartDate, setAllianceStartDate] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [executives, setExecutives] = useState<{ userId: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedCodes, setGeneratedCodes] = useState<string[] | null>(null)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    setName(partner?.name ?? '')
    setReceivesCommission(partner?.receivesCommission ?? true)
    setIsAlliance(partner?.isAlliance ?? false)
    setExecutiveUserId(partner?.b2B2CExecutiveUserId ?? '')
    setAllianceStartDate(partner?.allianceStartDate?.slice(0, 10) ?? '')
    setIsActive(partner?.isActive ?? true)
    setError(null)
    setGeneratedCodes(null)

    void (async () => {
      const res = await getDiscountCodeLookups()
      if (res.success) setExecutives(res.value.sellers.map((s) => ({ userId: s.userId, name: s.name })))
    })()
  }, [open, partner])

  const canSubmit =
    name.trim().length > 2 && (!isAlliance || (executiveUserId !== '' && allianceStartDate !== ''))

  const submit = async () => {
    if (!canSubmit || loading) return
    setLoading(true)
    setError(null)
    const res = await savePartner({
      id: partner?.id,
      name: name.trim(),
      receivesCommission,
      b2b2cExecutiveUserId: isAlliance ? executiveUserId : undefined,
      allianceStartDate: isAlliance ? allianceStartDate : undefined,
      isActive,
    })
    setLoading(false)
    if (!res.success) {
      setError(res.error.message)
      return
    }
    onSaved()
    if (!partner && res.value.generatedCodes && res.value.generatedCodes.length > 0) {
      setGeneratedCodes(res.value.generatedCodes)
    } else {
      onClose()
    }
  }

  const copyCode = (code: string, idx: number) => {
    void navigator.clipboard.writeText(code).then(() => {
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx(null), 1600)
    })
  }

  if (!open) return null

  // Confirmación de alta con los 3 códigos generados
  if (generatedCodes) {
    return (
      <Modal isOpen onClose={onClose} title="Partner creado">
        <div className="flex flex-col gap-4">
          <p className="text-[13.5px]" style={{ color: 'var(--ink-700)' }}>
            <b>{name}</b> quedó registrado con 3 códigos de descuento automáticos:
          </p>
          <div className="flex flex-col gap-2">
            {generatedCodes.map((code, idx) => (
              <div key={code} className="flex items-center gap-2">
                <code
                  className="flex-1 px-3 py-2 rounded-lg text-[14px] font-bold"
                  style={{ ...MONO, background: 'var(--ink-50)', color: 'var(--ink-900)', border: '1px solid var(--border)' }}
                >
                  {code}
                </code>
                <button
                  type="button"
                  onClick={() => copyCode(code, idx)}
                  title="Copiar código"
                  className="p-2.5 rounded-lg transition hover:bg-[var(--ink-50)] cursor-pointer"
                  style={{ border: '1px solid var(--border)' }}
                >
                  {copiedIdx === idx ? (
                    <Check size={16} style={{ color: 'var(--brand-700)' }} />
                  ) : (
                    <Copy size={16} style={{ color: 'var(--ink-500)' }} />
                  )}
                </button>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-xl text-[12.5px]" style={{ background: 'var(--amber-soft)', color: '#7B5312' }}>
            Los códigos nacen <b>sin planes asignados</b>, así que todavía no aplican a ninguna
            compra. Configura sus planes, % y usos en la pantalla de Códigos de descuento.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-full font-bold text-[14px] transition hover:opacity-95 cursor-pointer"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            Listo
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen onClose={onClose} title={partner ? `Editar partner — ${partner.name}` : 'Nuevo partner'}>
      <div className="flex flex-col gap-4">
        {error && (
          <div className="p-3 rounded-lg text-[13px]" style={{ background: 'var(--hero-coral-soft-bg, #FEE2E2)', color: '#991B1B' }}>
            {error}
          </div>
        )}

        <div>
          <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--ink-700)' }}>
            Nombre
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Talento Contable"
            className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none focus:ring-2"
            style={inputStyle}
            disabled={loading}
          />
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={receivesCommission}
            onChange={(e) => setReceivesCommission(e.target.checked)}
            disabled={loading}
            className="w-4 h-4 cursor-pointer"
          />
          <span className="text-[13px]" style={{ color: 'var(--ink-700)' }}>
            <b>Recibe comisión</b>{' '}
            <span style={{ color: 'var(--ink-400)' }}>
              (si NO, el motor lo omite aunque sus códigos se usen)
            </span>
          </span>
        </label>

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isAlliance}
            onChange={(e) => setIsAlliance(e.target.checked)}
            disabled={loading}
            className="w-4 h-4 cursor-pointer"
          />
          <span className="text-[13px]" style={{ color: 'var(--ink-700)' }}>
            <b>¿Es alianza B2B2C?</b>{' '}
            <span style={{ color: 'var(--ink-400)' }}>(participación vigente 12 meses)</span>
          </span>
        </label>

        {isAlliance && (
          <>
            <div>
              <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--ink-700)' }}>
                Ejecutivo B2B2C
              </label>
              <select
                value={executiveUserId}
                onChange={(e) => setExecutiveUserId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none cursor-pointer"
                style={inputStyle}
                disabled={loading}
              >
                <option value="">Selecciona ejecutivo…</option>
                {executives.map((ex) => (
                  <option key={ex.userId} value={ex.userId}>{ex.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--ink-700)' }}>
                Fecha de inicio de la alianza
              </label>
              <input
                type="date"
                value={allianceStartDate}
                onChange={(e) => setAllianceStartDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none cursor-pointer"
                style={inputStyle}
                disabled={loading}
              />
            </div>
          </>
        )}

        {partner && (
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={loading}
              className="w-4 h-4 cursor-pointer"
            />
            <span className="text-[13px]" style={{ color: 'var(--ink-700)' }}>Partner activo</span>
          </label>
        )}

        {!partner && (
          <div
            className="flex items-start gap-2.5 p-3 rounded-xl text-[12.5px]"
            style={{ background: 'var(--hero-brand-soft, var(--ink-50))', color: 'var(--ink-700)' }}
          >
            <Tag size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--brand-700, var(--primary))' }} />
            <div>
              Al crear el partner se generarán <b>3 códigos de descuento automáticos</b> ligados a
              él, editables después en la pantalla de códigos.
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-full font-bold text-[13.5px] transition cursor-pointer"
            style={{ background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border-strong, var(--border))' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!canSubmit || loading}
            className="px-5 py-2.5 rounded-full font-bold text-[13.5px] inline-flex items-center gap-2 transition hover:opacity-95 disabled:opacity-50 cursor-pointer"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {partner ? 'Guardar cambios' : 'Crear partner'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
