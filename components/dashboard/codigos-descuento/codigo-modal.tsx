'use client'

import { Loader2, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { saveDiscountCode } from '@/features/discountCodes/actions/saveDiscountCode.action'
import type { DiscountCodeAdmin, DiscountCodeLookups } from '@/features/discountCodes/types'
import { Modal } from '../modal'

interface Props {
  open: boolean
  /** null = crear; con valor = editar. */
  code: DiscountCodeAdmin | null
  lookups: DiscountCodeLookups | null
  onClose: () => void
  onSaved: () => void
  /** Admin.AuthorizeHighDiscount: puede guardar ACTIVOS códigos fuera de tope (>20% / >3 decl.). */
  canAuthorize?: boolean
}

type OwnerType = 'user' | 'partner' | 'none'

const inputStyle = {
  background: 'var(--input)',
  border: '1px solid var(--border)',
  color: 'var(--foreground)',
} as const

export function CodigoModal({ open, code, lookups, onClose, onSaved, canAuthorize = false }: Props) {
  const [codeText, setCodeText] = useState('')
  const [description, setDescription] = useState('')
  const [ownerType, setOwnerType] = useState<OwnerType>('user')
  const [sellerUserId, setSellerUserId] = useState('')
  const [partnershipId, setPartnershipId] = useState<number | ''>('')
  const [discountTypeId, setDiscountTypeId] = useState(1)
  const [discountPercent, setDiscountPercent] = useState('')
  const [declarationsCount, setDeclarationsCount] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [planIds, setPlanIds] = useState<number[]>([])
  const [rfcsText, setRfcsText] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setCodeText(code?.code ?? '')
    setDescription(code?.description ?? '')
    setOwnerType(code ? code.ownerType : 'user')
    setSellerUserId(code?.sellerUserId ?? '')
    setPartnershipId(code?.partnershipId ?? '')
    setDiscountTypeId(code?.discountTypeId ?? 1)
    setDiscountPercent(code ? String(code.discountPercent) : '')
    setDeclarationsCount(code?.declarationsCount ? String(code.declarationsCount) : '')
    setMaxUses(code?.maxUses ? String(code.maxUses) : '')
    setPlanIds(code?.subscriptionPlanIds ?? [])
    // Precargar la lista blanca actual: lo que se guarda REEMPLAZA la lista, así
    // que el usuario siempre debe partir de lo que ya existe.
    setRfcsText((code?.whitelistedRfcs ?? []).join('\n'))
    setIsActive(code?.isActive ?? true)
    setError(null)
  }, [open, code])

  // Validación en vivo de RFCs: nada se descarta en silencio.
  const rfcTokens = rfcsText
    .split(/[\s,;]+/)
    .map((r) => r.trim().toUpperCase())
    .filter(Boolean)
  const validRfcs = rfcTokens.filter((r) => r.length === 12 || r.length === 13)
  const invalidRfcs = rfcTokens.filter((r) => r.length !== 12 && r.length !== 13)

  const isPercent = discountTypeId === 1
  const canSubmit =
    codeText.trim().length >= 3 &&
    // MaxUses solo es obligatorio para códigos ACTIVOS (el checkout rechaza códigos
    // sin límite); un código inactivo puede guardarse sin tope (legacy).
    (!isActive || Number(maxUses) > 0) &&
    invalidRfcs.length === 0 &&
    planIds.length > 0 &&
    (ownerType === 'none' ||
      (ownerType === 'user' && sellerUserId !== '') ||
      (ownerType === 'partner' && partnershipId !== '')) &&
    // Topes de negocio para códigos ACTIVOS (el backend los valida de nuevo):
    // máximo 20% / 3 declaraciones. Fuera de tope se puede guardar INACTIVO
    // (la solicitud); solo quien autoriza (Admin.AuthorizeHighDiscount) puede
    // guardarlo activo, hasta 100%.
    (isPercent
      ? discountPercent !== '' &&
        Number.isInteger(Number(discountPercent)) &&
        Number(discountPercent) >= 0 &&
        Number(discountPercent) <= (isActive && !canAuthorize ? 20 : 100)
      : Number(declarationsCount) > 0 && (!isActive || canAuthorize || Number(declarationsCount) <= 3))

  // Por qué no se puede guardar: el botón nunca se apaga en silencio.
  const faltantes: string[] = []
  if (codeText.trim().length < 3) faltantes.push('el código (mínimo 3 caracteres)')
  if (isActive && !(Number(maxUses) > 0)) faltantes.push('los usos máximos (obligatorios si está activo)')
  if (ownerType === 'user' && sellerUserId === '') faltantes.push('el dueño (selecciona un ejecutivo, o usa "Sin dueño")')
  if (ownerType === 'partner' && partnershipId === '') faltantes.push('el partner dueño')
  if (planIds.length === 0) faltantes.push('al menos un plan donde aplica')
  if (invalidRfcs.length > 0) faltantes.push(`RFCs inválidos: ${invalidRfcs.join(', ')}`)
  if (isPercent && discountPercent === '') faltantes.push('el % de descuento')
  if (isPercent && Number(discountPercent) > 100) faltantes.push('el % no puede ser mayor a 100')
  if (isPercent && discountPercent !== '' && !Number.isInteger(Number(discountPercent)))
    faltantes.push('el % debe ser entero, sin decimales')
  if (isPercent && isActive && !canAuthorize && Number(discountPercent) > 20 && Number(discountPercent) <= 100)
    faltantes.push('más de 20% activo requiere autorización (desmarca "Código activo")')
  if (!isPercent && !(Number(declarationsCount) > 0)) faltantes.push('las declaraciones de regalo')

  const togglePlan = (id: number) => {
    setPlanIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  const submit = async () => {
    if (!canSubmit || loading) return
    setLoading(true)
    setError(null)
    const rfcs = validRfcs
    const res = await saveDiscountCode({
      id: code?.id,
      code: codeText.trim().toUpperCase(),
      description: description.trim() || undefined,
      sellerUserId: ownerType === 'user' ? sellerUserId : undefined,
      partnershipId: ownerType === 'partner' && partnershipId !== '' ? partnershipId : undefined,
      discountTypeId,
      discountPercent: isPercent ? Number(discountPercent) : undefined,
      declarationsCount: !isPercent ? Number(declarationsCount) : undefined,
      maxUses: Number(maxUses),
      subscriptionPlanIds: planIds,
      whitelistedRfcs: rfcs,
      isActive,
    })
    setLoading(false)
    if (!res.success) {
      setError(res.error.message)
      return
    }
    onSaved()
    onClose()
  }

  if (!open) return null

  return (
    <Modal isOpen onClose={onClose} title={code ? `Editar código — ${code.code}` : 'Nuevo código de descuento'}>
      <div className="flex flex-col gap-4">
        {error && (
          <div className="p-3 rounded-lg text-[13px]" style={{ background: 'var(--hero-coral-soft-bg, #FEE2E2)', color: '#991B1B' }}>
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--ink-700)' }}>
              Código
            </label>
            <input
              value={codeText}
              onChange={(e) => setCodeText(e.target.value.toUpperCase())}
              placeholder="VERANO25"
              maxLength={50}
              className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none focus:ring-2 uppercase"
              style={inputStyle}
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--ink-700)' }}>
              Usos máximos{' '}
              <span className="font-normal" style={{ color: 'var(--ink-400)' }}>
                (requerido si está activo)
              </span>
            </label>
            <input
              type="number"
              min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="100"
              className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none focus:ring-2"
              style={inputStyle}
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--ink-700)' }}>
            Descripción <span className="font-normal" style={{ color: 'var(--ink-400)' }}>(opcional)</span>
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={150}
            className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none focus:ring-2"
            style={inputStyle}
            disabled={loading}
          />
        </div>

        {/* Dueño */}
        <div>
          <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--ink-700)' }}>
            Tipo de dueño
          </label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'user' as OwnerType, label: 'Ejecutivo / Finder Fee' },
              { value: 'partner' as OwnerType, label: 'Partner' },
              { value: 'none' as OwnerType, label: 'Sin dueño' },
            ]).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setOwnerType(opt.value)}
                className="px-3 py-2 rounded-xl text-[12.5px] font-bold transition-colors cursor-pointer"
                style={{
                  border: `2px solid ${ownerType === opt.value ? 'var(--brand-500)' : 'var(--border)'}`,
                  background: ownerType === opt.value ? 'var(--hero-brand-soft)' : 'var(--card)',
                  color: 'var(--ink-900)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {ownerType === 'user' && (
          <select
            value={sellerUserId}
            onChange={(e) => setSellerUserId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none focus:ring-2 cursor-pointer"
            style={inputStyle}
            disabled={loading}
          >
            <option value="">Selecciona dueño…</option>
            {(lookups?.sellers ?? []).map((s) => (
              <option key={s.userId} value={s.userId}>
                {s.name} · {s.profileType}
              </option>
            ))}
          </select>
        )}
        {ownerType === 'partner' && (
          <select
            value={partnershipId}
            onChange={(e) => setPartnershipId(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none focus:ring-2 cursor-pointer"
            style={inputStyle}
            disabled={loading}
          >
            <option value="">Selecciona partner…</option>
            {(lookups?.partners ?? []).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}

        {/* Tipo de descuento */}
        <div>
          <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--ink-700)' }}>
            Tipo de descuento
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDiscountTypeId(1)}
              className="p-3 rounded-xl text-left transition-colors cursor-pointer"
              style={{
                border: `2px solid ${isPercent ? 'var(--brand-500)' : 'var(--border)'}`,
                background: isPercent ? 'var(--hero-brand-soft)' : 'var(--card)',
              }}
            >
              <div className="text-[13px] font-bold" style={{ color: 'var(--ink-900)' }}>Porcentaje</div>
              <div className="text-[11.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>Descuenta el total de la venta</div>
            </button>
            <button
              type="button"
              onClick={() => setDiscountTypeId(2)}
              className="p-3 rounded-xl text-left transition-colors cursor-pointer"
              style={{
                border: `2px solid ${!isPercent ? 'var(--brand-500)' : 'var(--border)'}`,
                background: !isPercent ? 'var(--hero-brand-soft)' : 'var(--card)',
              }}
            >
              <div className="text-[13px] font-bold" style={{ color: 'var(--ink-900)' }}>Declaraciones</div>
              <div className="text-[11.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>Precio completo + regularizaciones de regalo</div>
            </button>
          </div>
        </div>

        {isPercent ? (
          <div>
            <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--ink-700)' }}>
              % de descuento{' '}
              <span className="font-normal" style={{ color: 'var(--ink-400)' }}>
                (enteros{canAuthorize ? ', hasta 100% con tu autorización' : ', máximo 20%'})
              </span>
            </label>
            <input
              type="number"
              min={0}
              max={canAuthorize ? 100 : 20}
              step={1}
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              placeholder="15"
              className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none focus:ring-2"
              style={inputStyle}
              disabled={loading}
            />
            {isActive && !canAuthorize && Number(discountPercent) > 20 && (
              <p className="text-[11.5px] mt-1 font-semibold" style={{ color: '#9E3A15' }}>
                Más de 20% requiere autorización: desmarca "Código activo" para guardarlo como
                solicitud, y un administrador lo activará.
              </p>
            )}
            {isActive && canAuthorize && Number(discountPercent) > 20 && Number(discountPercent) <= 100 && (
              <p className="text-[11.5px] mt-1 font-semibold" style={{ color: '#7B5312' }}>
                Estás autorizando un descuento fuera de tope. Sugerencia: usa RFCs permitidos y
                pocos usos máximos para acotarlo.
              </p>
            )}
            {discountPercent !== '' && !Number.isInteger(Number(discountPercent)) && (
              <p className="text-[11.5px] mt-1 font-semibold" style={{ color: '#9E3A15' }}>
                El porcentaje debe ser un número entero, sin decimales.
              </p>
            )}
            {Number(discountPercent) > 100 && (
              <p className="text-[11.5px] mt-1 font-semibold" style={{ color: '#9E3A15' }}>
                El porcentaje no puede ser mayor a 100%.
              </p>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--ink-700)' }}>
              Declaraciones de regalo{' '}
              <span className="font-normal" style={{ color: 'var(--ink-400)' }}>
                {canAuthorize ? '(sin tope con tu autorización)' : '(máximo 3)'}
              </span>
            </label>
            <input
              type="number"
              min={1}
              max={canAuthorize ? undefined : 3}
              value={declarationsCount}
              onChange={(e) => setDeclarationsCount(e.target.value)}
              placeholder="3"
              className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none focus:ring-2"
              style={inputStyle}
              disabled={loading}
            />
            {isActive && !canAuthorize && Number(declarationsCount) > 3 && (
              <p className="text-[11.5px] mt-1 font-semibold" style={{ color: '#9E3A15' }}>
                Más de 3 declaraciones requiere autorización: desmarca "Código activo" para
                guardarlo como solicitud, y un administrador lo activará.
              </p>
            )}
            <p className="text-[11.5px] mt-1" style={{ color: 'var(--ink-400)' }}>
              Se suman al cupo de regularizaciones del plan comprado. Solo aplica en
              compra de planes, no en regularizaciones sueltas.
            </p>
          </div>
        )}

        {/* Planes aplicables */}
        <div>
          <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--ink-700)' }}>
            Planes donde aplica
          </label>
          <div
            className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto rounded-lg p-3"
            style={{ border: '1px solid var(--border)', background: 'var(--input)' }}
          >
            {(lookups?.plans ?? []).map((p) => (
              <label key={p.id} className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={planIds.includes(p.id)}
                  onChange={() => togglePlan(p.id)}
                  disabled={loading}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-[13px]" style={{ color: 'var(--ink-700)' }}>{p.name}</span>
              </label>
            ))}
            {(lookups?.plans ?? []).length === 0 && (
              <span className="text-[12.5px]" style={{ color: 'var(--ink-400)' }}>Sin planes activos</span>
            )}
          </div>
        </div>

        {/* Lista blanca de RFCs */}
        <div>
          <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--ink-700)' }}>
            RFCs permitidos <span className="font-normal" style={{ color: 'var(--ink-400)' }}>(opcional — con RFCs el código es exclusivo de esos clientes)</span>
          </label>
          <textarea
            value={rfcsText}
            onChange={(e) => setRfcsText(e.target.value)}
            placeholder={'GURO820108281\nDUMC921108LH2'}
            rows={2}
            className="w-full px-3 py-2.5 rounded-lg text-[13px] outline-none focus:ring-2 resize-y"
            style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
            disabled={loading}
          />
          {rfcTokens.length > 0 && (
            <p
              className="text-[11.5px] mt-1"
              style={{ color: invalidRfcs.length > 0 ? '#9E3A15' : 'var(--ink-500)' }}
            >
              {validRfcs.length} RFC{validRfcs.length === 1 ? '' : 's'} válido{validRfcs.length === 1 ? '' : 's'}
              {invalidRfcs.length > 0 && (
                <> · {invalidRfcs.length} inválido{invalidRfcs.length === 1 ? '' : 's'} (corrígelo{invalidRfcs.length === 1 ? '' : 's'} para guardar): <b>{invalidRfcs.join(', ')}</b></>
              )}
            </p>
          )}
          {code && code.whitelistedRfcsCount > 0 && (
            <p className="text-[11.5px] mt-1" style={{ color: 'var(--ink-400)' }}>
              La lista de arriba es la actual del código; al guardar se reemplaza completa con lo que quede aquí.
            </p>
          )}
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            disabled={loading}
            className="w-4 h-4 cursor-pointer"
          />
          <span className="text-[13px]" style={{ color: 'var(--ink-700)' }}>Código activo</span>
        </label>

        {/* Nunca apagar el botón en silencio: decir exactamente qué falta. */}
        {!canSubmit && faltantes.length > 0 && (
          <div
            className="px-3.5 py-2.5 rounded-xl text-[12.5px]"
            style={{ background: 'var(--amber-soft)', color: '#7B5312' }}
          >
            <b>Para guardar falta:</b> {faltantes.join(' · ')}
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
            {code ? 'Guardar cambios' : 'Crear código'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
