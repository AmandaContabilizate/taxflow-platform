'use client'

import { Loader2, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { addCompanyPersons } from '@/features/empresa/actions/managePersons.action'
import { type AddPersonsResult, RELATION_TYPES } from '@/features/empresa/types'
import { Modal } from '../modal'

interface Props {
  open: boolean
  partnershipId?: number
  onClose: () => void
  /** Se llama cuando la persona quedó creada o ligada. */
  onSaved: (result: AddPersonsResult) => void
}

const inputStyle = {
  background: 'var(--input)',
  border: '1px solid var(--border)',
  color: 'var(--foreground)',
} as const

const RFC_PATTERN = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/

/** Alta individual de una persona (spec-perfil-empresa §5.2). No manda la invitación: eso se hace desde la lista. */
export function PersonaModal({ open, partnershipId, onClose, onSaved }: Props) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [rfc, setRfc] = useState('')
  const [relationType, setRelationType] = useState<number>(6)
  const [externalId, setExternalId] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setFullName('')
    setEmail('')
    setPhone('')
    setRfc('')
    setRelationType(6)
    setExternalId('')
    setCity('')
    setState('')
    setError(null)
  }, [open])

  if (!open) return null

  const submit = async () => {
    const name = fullName.trim()
    const mail = email.trim().toLowerCase()
    const rfcUp = rfc.trim().toUpperCase()
    if (name.length < 3) return setError('Escribe el nombre completo.')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) return setError('El correo no es válido.')
    if (rfcUp && !RFC_PATTERN.test(rfcUp)) return setError('El RFC no tiene el formato correcto (12 o 13 caracteres).')

    setLoading(true)
    setError(null)
    try {
      const res = await addCompanyPersons(
        [{
          fullName: name,
          email: mail,
          phone: phone.trim() || null,
          rfcDeclared: rfcUp || null,
          relationType,
          externalId: externalId.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
        }],
        partnershipId,
      )
      if (!res.success) return setError(res.error.message)
      const row = res.value.rows[0]
      if (row && (row.status === 'error' || row.status === 'omitida')) return setError(row.message ?? 'No se pudo registrar.')
      onSaved(res.value)
      onClose()
    } catch (e) {
      console.error('[PersonaModal] addCompanyPersons falló:', e)
      setError('No pudimos registrar a la persona. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Agregar persona" maxWidth={560}>
      <div className="flex flex-col gap-4">
        <p className="text-[13px]" style={{ color: 'var(--ink-500)' }}>
          Queda registrada en tu empresa. La invitación se envía después, desde la lista, cuando tú decidas.
        </p>

        <Field label="Nombre completo">
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ej. María López García" className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none focus:ring-2" style={inputStyle} disabled={loading} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Correo">
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="persona@correo.com" className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none focus:ring-2" style={inputStyle} disabled={loading} />
          </Field>
          <Field label="Teléfono (opcional)">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10 dígitos" className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none focus:ring-2" style={inputStyle} disabled={loading} />
          </Field>
          <Field label="RFC (opcional)" hint="Se confirma contra su constancia fiscal.">
            <input value={rfc} onChange={(e) => setRfc(e.target.value.toUpperCase())} placeholder="XAXX010101000" maxLength={13} className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none focus:ring-2 font-mono" style={inputStyle} disabled={loading} />
          </Field>
          <Field label="Tipo de relación">
            <select value={relationType} onChange={(e) => setRelationType(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none focus:ring-2" style={inputStyle} disabled={loading}>
              {RELATION_TYPES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Id interno (opcional)">
            <input value={externalId} onChange={(e) => setExternalId(e.target.value)} placeholder="Tu número de empleado o socio" className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none focus:ring-2" style={inputStyle} disabled={loading} />
          </Field>
          <Field label="Ciudad (opcional)">
            <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none focus:ring-2" style={inputStyle} disabled={loading} />
          </Field>
          <Field label="Estado (opcional)">
            <input value={state} onChange={(e) => setState(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none focus:ring-2" style={inputStyle} disabled={loading} />
          </Field>
        </div>

        {error && (
          <div className="text-[13px] px-3 py-2 rounded-lg" style={{ background: 'var(--danger-soft)', color: '#8B1E1E' }}>
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2.5 rounded-full text-[13.5px] font-bold transition cursor-pointer" style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}>
            Cancelar
          </button>
          <button type="button" onClick={() => void submit()} disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13.5px] font-bold transition hover:opacity-95 cursor-pointer disabled:opacity-60" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />} Registrar
          </button>
        </div>
      </div>
    </Modal>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--ink-700)' }}>{label}</label>
      {children}
      {hint && <div className="text-[11.5px] mt-1" style={{ color: 'var(--ink-400)' }}>{hint}</div>}
    </div>
  )
}
