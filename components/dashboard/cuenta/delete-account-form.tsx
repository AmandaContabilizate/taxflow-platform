'use client'

import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { signOut } from '@/features/auth/actions/signOut.action'
import {
  deactivateMyTaxpayers,
  getDeactivationReasons,
  getMyTaxpayersDeactivationPreview,
  type ClientDeactivationPreview,
  type DeactivationReason,
} from '@/features/taxpayers/actions/taxpayerDeactivation.action'
import { useRfcStore } from '@/features/taxpayers/stores/rfcStore'
import { DISPLAY, MONO } from '../constants'
import { Btn } from '../ui'

type Scope = 'all' | 'one'

/**
 * Baja del cliente (derecho ARCO de cancelación), siempre Soft: borra CIEC, e.firma y datos
 * bancarios; ventas y declaraciones se conservan. "Todos" también desactiva la cuenta.
 * Confirmación: RFC escrito de nuevo por cada contribuyente + motivo + contraseña.
 */
export function DeleteAccountForm() {
  const { refresh } = useRfcStore()
  const [taxpayers, setTaxpayers] = useState<ClientDeactivationPreview[] | null>(null)
  const [reasons, setReasons] = useState<DeactivationReason[]>([])
  const [scope, setScope] = useState<Scope>('all')
  const [selectedId, setSelectedId] = useState<number | ''>('')
  const [confirmRfcs, setConfirmRfcs] = useState<Record<number, string>>({})
  const [reasonId, setReasonId] = useState<number | ''>('')
  const [reasonNote, setReasonNote] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  useEffect(() => {
    void getMyTaxpayersDeactivationPreview().then((res) => {
      if (res.success) setTaxpayers(res.value)
      else setError(res.error.message)
    })
    void getDeactivationReasons().then((res) => {
      if (res.success) setReasons(res.value)
    })
  }, [])

  const targets = useMemo(() => {
    if (!taxpayers) return []
    return scope === 'all' ? taxpayers : taxpayers.filter((t) => t.taxpayerId === selectedId)
  }, [taxpayers, scope, selectedId])

  const prepaid = targets.reduce(
    (acc, t) => ({
      pending: acc.pending + t.prepaid.assignedNotPresented,
      credits: acc.credits + t.prepaid.unassignedCredits,
    }),
    { pending: 0, credits: 0 },
  )
  const inFlight = targets.filter((t) => t.hasDeclarationInFlight)
  const reason = reasons.find((r) => r.id === reasonId)
  const rfcsOk = targets.every(
    (t) => (confirmRfcs[t.taxpayerId] ?? '').trim().toUpperCase() === t.rfc.trim().toUpperCase(),
  )
  const canSubmit =
    taxpayers !== null &&
    (scope === 'all' || targets.length === 1) &&
    rfcsOk &&
    reasonId !== '' &&
    (!reason?.requiresNote || reasonNote.trim().length > 0) &&
    password.length > 0 &&
    inFlight.length === 0 &&
    !submitting &&
    !done

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    const res = await deactivateMyTaxpayers({
      allTaxpayers: scope === 'all',
      taxpayerIds: targets.map((t) => t.taxpayerId),
      confirmRfcs: targets.map((t) => (confirmRfcs[t.taxpayerId] ?? '').trim().toUpperCase()),
      reasonId,
      reasonNote: reasonNote.trim() || undefined,
      password,
    })
    setPassword('')
    if (!res.success) {
      setSubmitting(false)
      setError(res.error.message)
      return
    }
    if (res.value.userDeactivated) {
      setDone('Tu cuenta fue dada de baja. Cerrando tu sesión…')
      await signOut()
      return
    }
    setSubmitting(false)
    setDone(`Dimos de baja ${targets.map((t) => t.rfc).join(', ')}. Tu cuenta sigue activa con tus demás RFC.`)
    setTaxpayers((prev) => prev?.filter((t) => !targets.some((x) => x.taxpayerId === t.taxpayerId)) ?? prev)
    setConfirmRfcs({})
    setSelectedId('')
    await refresh()
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <div className="text-[16px] font-extrabold" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
          Dar de baja mi contabilidad
        </div>
        <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
          Borramos tu CIEC, tu e.firma y tus datos bancarios. Por obligación fiscal conservamos tus compras y
          las declaraciones que te presentamos.
        </div>
      </div>

      <div
        className="text-[12.5px] font-semibold px-4 py-3 rounded-xl flex items-start gap-2"
        style={{ background: 'var(--danger-soft)', color: 'var(--violet-ink)' }}
      >
        <AlertTriangle size={15} className="mt-0.5 shrink-0" />
        <span>
          Dejaremos de descargar tus facturas y de presentar tus declaraciones. Si das de baja todos tus RFC,
          tu cuenta se desactiva y ya no podrás iniciar sesión.
        </span>
      </div>

      {taxpayers === null && !error && (
        <div className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--ink-500)' }}>
          <Loader2 size={14} className="animate-spin" /> Cargando tus RFC…
        </div>
      )}

      {taxpayers !== null && taxpayers.length > 1 && (
        <Field label="¿Qué quieres dar de baja?">
          <div className="flex flex-col gap-2 text-[13.5px]" style={{ color: 'var(--ink-700)' }}>
            <label className="flex items-center gap-2">
              <input type="radio" checked={scope === 'all'} onChange={() => setScope('all')} disabled={submitting} />
              Todos mis RFC y mi cuenta
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" checked={scope === 'one'} onChange={() => setScope('one')} disabled={submitting} />
              Solo un RFC
            </label>
          </div>
        </Field>
      )}

      {taxpayers !== null && scope === 'one' && (
        <Field label="RFC a dar de baja">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={submitting}
            className={INPUT}
            style={INPUT_STYLE}
          >
            <option value="">Selecciona un RFC…</option>
            {taxpayers.map((t) => (
              <option key={t.taxpayerId} value={t.taxpayerId}>
                {t.rfc}
              </option>
            ))}
          </select>
        </Field>
      )}

      {targets.map((t) => (
        <Field key={t.taxpayerId} label={<>Escribe tu RFC <code style={{ ...MONO, fontSize: '12px' }}>{t.rfc}</code> para confirmar</>}>
          <input
            type="text"
            value={confirmRfcs[t.taxpayerId] ?? ''}
            onChange={(e) => setConfirmRfcs((prev) => ({ ...prev, [t.taxpayerId]: e.target.value }))}
            autoComplete="off"
            spellCheck={false}
            disabled={submitting || !!done}
            className={INPUT}
            style={{ ...INPUT_STYLE, ...MONO, textTransform: 'uppercase' }}
          />
        </Field>
      ))}

      {inFlight.length > 0 && (
        <div className="text-[12.5px] px-4 py-3 rounded-xl" style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)' }}>
          Estamos presentando una declaración de {inFlight.map((t) => t.rfc).join(', ')}. Espera a que termine para
          solicitar la baja.
        </div>
      )}

      {(prepaid.pending > 0 || prepaid.credits > 0) && (
        <div className="text-[12.5px] px-4 py-3 rounded-xl" style={{ background: 'var(--sky-soft)', color: 'var(--violet-ink)' }}>
          Tienes {prepaid.pending} declaración(es) pagadas sin presentar y {prepaid.credits} crédito(s) sin usar.
          Te contactaremos para el reembolso de lo que no se haya utilizado.
        </div>
      )}

      <Field label="Motivo">
        <select
          value={reasonId}
          onChange={(e) => setReasonId(e.target.value === '' ? '' : Number(e.target.value))}
          disabled={submitting || !!done}
          className={INPUT}
          style={INPUT_STYLE}
        >
          <option value="">Selecciona un motivo…</option>
          {reasons.map((r) => (
            <option key={r.id} value={r.id}>
              {r.description}
            </option>
          ))}
        </select>
      </Field>

      {reason?.requiresNote && (
        <Field label="Cuéntanos el motivo">
          <textarea
            value={reasonNote}
            onChange={(e) => setReasonNote(e.target.value)}
            maxLength={1000}
            rows={2}
            disabled={submitting || !!done}
            className={INPUT}
            style={INPUT_STYLE}
          />
        </Field>
      )}

      <Field label="Tu contraseña">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          disabled={submitting || !!done}
          className={INPUT}
          style={INPUT_STYLE}
        />
      </Field>

      {error && (
        <div className="text-[13px] font-semibold px-4 py-2.5 rounded-xl" style={{ background: 'var(--danger-soft)', color: 'var(--violet-ink)' }}>
          {error}
        </div>
      )}

      {done && (
        <div className="text-[13px] font-semibold px-4 py-2.5 rounded-xl" style={{ background: 'var(--brand-50)', color: 'var(--brand-700)' }}>
          {done}
        </div>
      )}

      <Btn kind="ghost" type="submit" disabled={!canSubmit} block style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
        {submitting ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Procesando baja…
          </>
        ) : (
          <>
            <Trash2 size={16} /> {scope === 'all' ? 'Dar de baja todo y eliminar mi cuenta' : 'Dar de baja este RFC'}
          </>
        )}
      </Btn>
    </form>
  )
}

const INPUT = 'w-full px-4 py-2.5 rounded-lg text-[14px] outline-none'
const INPUT_STYLE = { background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }

function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-bold" style={{ color: 'var(--ink-700)' }}>
        {label}
      </span>
      {children}
    </label>
  )
}
