'use client'

import { ChevronDown, ChevronRight, Loader2, Pencil, Plus } from 'lucide-react'
import { Fragment, type ReactNode, memo, useMemo, useState } from 'react'
import { createIvaFavorBalance } from '@/features/iva-favor-balances/actions/createIvaFavorBalance.action'
import { updateIvaFavorBalance } from '@/features/iva-favor-balances/actions/updateIvaFavorBalance.action'
import { useIvaFavorBalances } from '@/features/iva-favor-balances/hooks/useIvaFavorBalances'
import {
  DECLARATION_TYPES,
  createIvaFavorBalanceSchema,
  updateIvaFavorBalanceSchema,
} from '@/features/iva-favor-balances/schemas/ivaFavorBalance.schema'
import {
  type IvaFavorBalance,
  type IvaFavorBalanceSource,
  type IvaFavorDeclarationType,
  type UpdateIvaFavorBalanceInput,
  appliedInSystem,
} from '@/features/iva-favor-balances/types'
import { MONO } from '../constants'
import { Badge, Card } from '../ui'
import {
  InlineNotice,
  MES_OPCIONES,
  PanelHeader612,
  SimpleTable,
  cellClass,
  cellMoneyClass,
  cellMoneyStyle,
  fmtFecha,
  fmtMoney,
  periodoLabel,
} from './parts-612'

const MONTO_COLS = new Set([5, 6])

/**
 * `source` del back: Clasificador (lo generó el cálculo de una declaración), Manual (captura
 * del contador) o Robot. Solo en los Manual se corrigen periodo y montos.
 */
const esManual = (b: IvaFavorBalance) => b.source === 'Manual'

const SOURCE_LABEL: Record<IvaFavorBalanceSource, string> = {
  Clasificador: 'Cálculo',
  Manual: 'Captura manual',
  Robot: 'Robot',
}

interface Draft {
  originFiscalYear: string
  originMonth: string
  operationNumber: string
  declarationType: string
  presentedDate: string
  originalAmount: string
  remainingAmount: string
}

const EMPTY_DRAFT: Draft = {
  originFiscalYear: '',
  originMonth: '',
  operationNumber: '',
  declarationType: 'Normal',
  presentedDate: '',
  originalAmount: '',
  remainingAmount: '',
}

function draftFrom(b: IvaFavorBalance): Draft {
  return {
    originFiscalYear: String(b.originFiscalYear ?? ''),
    originMonth: String(b.originMonth ?? ''),
    operationNumber: b.operationNumber ?? '',
    declarationType: b.declarationType ?? 'Normal',
    presentedDate: (b.presentedDate ?? '').slice(0, 10),
    originalAmount: b.originalAmount != null ? String(b.originalAmount) : '',
    remainingAmount: b.remainingAmount != null ? String(b.remainingAmount) : '',
  }
}

/** "" → undefined para que zod diga "captura…" en vez de NaN. Acepta "1,200.50". */
const toNum = (s: string) => {
  const t = s.replace(/[,\s$]/g, '')
  return t === '' ? undefined : Number(t)
}

type Errors = Partial<Record<keyof Draft, string>>

function issuesToErrors(issues: { path: (string | number)[]; message: string }[]): Errors {
  const out: Errors = {}
  for (const i of issues) {
    const k = String(i.path[0] ?? '') as keyof Draft
    if (k && !out[k]) out[k] = i.message
  }
  return out
}

/**
 * Saldos a favor de IVA del contribuyente: historial con su origen y en qué declaraciones se
 * acreditó cada uno, más la captura manual de meses que el sistema no tiene (por ejemplo, de
 * clientes que llegan a medio año).
 */
export const SaldosFavorIvaTab = memo(function SaldosFavorIvaTab({
  declarationId,
  rfc,
  onRequiereRecalculo,
}: {
  declarationId: number
  rfc: string
  onRequiereRecalculo: (motivo: string) => void
}) {
  const { query, invalidate } = useIvaFavorBalances(declarationId, rfc)
  // El clasificador los aplica del más antiguo al más reciente: se listan igual.
  const saldos = useMemo(
    () =>
      [...(query.data ?? [])].sort(
        (a, b) => a.originFiscalYear * 100 + a.originMonth - (b.originFiscalYear * 100 + b.originMonth) || a.id - b.id,
      ),
    [query.data],
  )
  const totalRemanente = useMemo(() => saldos.reduce((acc, s) => acc + (Number(s.remainingAmount) || 0), 0), [saldos])

  const [abiertos, setAbiertos] = useState<Set<number>>(new Set())
  const [form, setForm] = useState<{ mode: 'create' } | { mode: 'edit'; balance: IvaFavorBalance } | null>(null)
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const toggle = (id: number) =>
    setAbiertos((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const abrirAlta = () => {
    setForm({ mode: 'create' })
    setDraft(EMPTY_DRAFT)
    setErrors({})
    setServerError(null)
  }

  const abrirEdicion = (b: IvaFavorBalance) => {
    setForm({ mode: 'edit', balance: b })
    setDraft(draftFrom(b))
    setErrors({})
    setServerError(null)
  }

  const cerrar = () => {
    setForm(null)
    setErrors({})
    setServerError(null)
  }

  const set = (k: keyof Draft) => (v: string) => {
    setDraft((prev) => ({ ...prev, [k]: v }))
    setErrors((prev) => ({ ...prev, [k]: undefined }))
  }

  // En un saldo que generó el sistema el periodo y los montos los lleva el cálculo; solo se
  // completan los datos del acuse (folio, tipo y fecha).
  const soloAcuse = form?.mode === 'edit' && !esManual(form.balance)

  const guardar = async () => {
    if (!form) return
    setServerError(null)
    const valores = {
      originFiscalYear: toNum(draft.originFiscalYear),
      originMonth: toNum(draft.originMonth),
      operationNumber: draft.operationNumber.trim(),
      declarationType: draft.declarationType as IvaFavorDeclarationType,
      presentedDate: draft.presentedDate,
      originalAmount: toNum(draft.originalAmount),
      remainingAmount: toNum(draft.remainingAmount),
    }

    if (form.mode === 'create') {
      const parsed = createIvaFavorBalanceSchema.safeParse({ rfc, ...valores })
      if (!parsed.success) {
        setErrors(issuesToErrors(parsed.error.issues))
        return
      }
      setSaving(true)
      const res = await createIvaFavorBalance(parsed.data)
      setSaving(false)
      if (!res.success) {
        setServerError(res.error.message)
        return
      }
      setAviso('Capturaste un saldo a favor.')
      onRequiereRecalculo('Capturaste un saldo a favor de IVA.')
    } else {
      const b = form.balance
      const original = draftFrom(b)
      // Solo viaja lo que cambió; en un saldo del sistema, nunca el periodo ni los montos (el
      // back responde INVALID_INPUT).
      const cambios: UpdateIvaFavorBalanceInput = {}
      if (draft.operationNumber !== original.operationNumber) cambios.operationNumber = valores.operationNumber
      if (draft.declarationType !== original.declarationType) cambios.declarationType = valores.declarationType
      if (draft.presentedDate !== original.presentedDate) cambios.presentedDate = valores.presentedDate
      if (!soloAcuse) {
        if (draft.originFiscalYear !== original.originFiscalYear) cambios.originFiscalYear = valores.originFiscalYear
        if (draft.originMonth !== original.originMonth) cambios.originMonth = valores.originMonth
        if (draft.originalAmount !== original.originalAmount) cambios.originalAmount = valores.originalAmount
        // Sin `remainingAmount` el back conserva lo acreditado fuera del sistema y mueve el
        // remanente con el original; el contador ve el remanente del formulario, así que viaja
        // también cuando cambia el original.
        if (draft.remainingAmount !== original.remainingAmount || cambios.originalAmount !== undefined)
          cambios.remainingAmount = valores.remainingAmount
      }
      // El remanente no puede pasar de lo que el sistema todavía no acreditó.
      const yaAcreditado = appliedInSystem(b)
      if (
        !soloAcuse &&
        yaAcreditado > 0 &&
        valores.originalAmount != null &&
        valores.remainingAmount != null &&
        valores.remainingAmount > valores.originalAmount - yaAcreditado + 1e-9
      ) {
        setErrors({
          remainingAmount: `No puede pasar de ${fmtMoney(valores.originalAmount - yaAcreditado)}: ya se acreditaron ${fmtMoney(yaAcreditado)} en el sistema.`,
        })
        return
      }
      if (Object.keys(cambios).length === 0) {
        cerrar()
        return
      }
      // Las reglas cruzadas se validan contra el saldo completo, no solo contra lo que cambió.
      const completo = updateIvaFavorBalanceSchema.safeParse({
        originFiscalYear: valores.originFiscalYear,
        originMonth: valores.originMonth,
        presentedDate: valores.presentedDate || undefined,
        originalAmount: valores.originalAmount,
        remainingAmount: valores.remainingAmount,
        ...cambios,
      })
      if (!completo.success) {
        setErrors(issuesToErrors(completo.error.issues))
        return
      }
      setSaving(true)
      const res = await updateIvaFavorBalance(b.id, cambios)
      setSaving(false)
      if (!res.success) {
        setServerError(res.error.message)
        return
      }
      setAviso('Actualizaste un saldo a favor.')
      onRequiereRecalculo('Actualizaste un saldo a favor de IVA.')
    }
    cerrar()
    await invalidate()
  }

  return (
    <div className="flex flex-col gap-4">
      {aviso && (
        <InlineNotice kind="success">
          <span className="font-semibold">{aviso}</span> Pulsa <strong>Recalcular</strong> para que esta
          declaración lo tome en cuenta.
        </InlineNotice>
      )}

      <Card>
        <PanelHeader612
          title="Saldos a favor de IVA"
          subtitle={
            query.isSuccess
              ? `${saldos.length} saldo${saldos.length === 1 ? '' : 's'} · remanente total ${fmtMoney(totalRemanente)}`
              : 'Se aplican del más antiguo al más reciente, sin pasar del IVA a cargo'
          }
          right={
            !form && (
              <button
                type="button"
                onClick={abrirAlta}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-bold whitespace-nowrap transition hover:opacity-90"
                style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
              >
                <Plus size={14} /> Capturar saldo
              </button>
            )
          }
        />

        {form && (
          <div className="p-5 flex flex-col gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="text-[13.5px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
              {form.mode === 'create'
                ? 'Capturar un saldo de un mes que el sistema no tiene'
                : `Editar el saldo de ${periodoLabel(form.balance.originFiscalYear, form.balance.originMonth)}`}
            </div>
            {soloAcuse && (
              <div className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
                Este saldo lo generó una declaración del sistema: el periodo y los montos los lleva el cálculo.
                Aquí solo se completan los datos del acuse.
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Ejercicio de origen" error={errors.originFiscalYear}>
                <input
                  inputMode="numeric"
                  value={draft.originFiscalYear}
                  onChange={(e) => set('originFiscalYear')(e.target.value)}
                  placeholder="2026"
                  maxLength={4}
                  disabled={soloAcuse}
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                />
              </Field>
              <Field label="Mes de origen" error={errors.originMonth}>
                <select
                  value={draft.originMonth}
                  onChange={(e) => set('originMonth')(e.target.value)}
                  disabled={soloAcuse}
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                >
                  <option value="">Elige el mes…</option>
                  {MES_OPCIONES.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Folio de operación" error={errors.operationNumber}>
                <input
                  inputMode="numeric"
                  value={draft.operationNumber}
                  onChange={(e) => set('operationNumber')(e.target.value)}
                  placeholder="261070222607"
                  maxLength={20}
                  className={INPUT_CLASS}
                  style={{ ...INPUT_STYLE, ...MONO }}
                />
              </Field>
              <Field label="Tipo de declaración" error={errors.declarationType}>
                <select
                  value={draft.declarationType}
                  onChange={(e) => set('declarationType')(e.target.value)}
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                >
                  {DECLARATION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Fecha de presentación" error={errors.presentedDate}>
                <input
                  type="date"
                  value={draft.presentedDate}
                  onChange={(e) => set('presentedDate')(e.target.value)}
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                />
              </Field>
              <Field label="Monto original" error={errors.originalAmount}>
                <input
                  inputMode="decimal"
                  value={draft.originalAmount}
                  onChange={(e) => set('originalAmount')(e.target.value)}
                  placeholder="0.00"
                  disabled={soloAcuse}
                  className={`${INPUT_CLASS} text-right`}
                  style={{ ...INPUT_STYLE, ...MONO }}
                />
              </Field>
              <Field label="Remanente" hint="Lo que queda por acreditar hoy" error={errors.remainingAmount}>
                <input
                  inputMode="decimal"
                  value={draft.remainingAmount}
                  onChange={(e) => set('remainingAmount')(e.target.value)}
                  placeholder="0.00"
                  disabled={soloAcuse}
                  className={`${INPUT_CLASS} text-right`}
                  style={{ ...INPUT_STYLE, ...MONO }}
                />
              </Field>
            </div>
            {serverError && <InlineNotice kind="error">{serverError}</InlineNotice>}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void guardar()}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12.5px] font-bold transition hover:opacity-90 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#00D3A1 0%,#00AD87 100%)', color: '#fff' }}
              >
                {saving && <Loader2 size={13} className="animate-spin" />} Guardar
              </button>
              <button
                type="button"
                onClick={cerrar}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-[12.5px] font-bold transition hover:opacity-90 disabled:opacity-60"
                style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {query.isPending ? (
          <div className="flex items-center gap-2 px-5 py-6 text-[13px]" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={16} className="animate-spin" /> Cargando saldos a favor…
          </div>
        ) : query.isError ? (
          <div className="p-5">
            <InlineNotice kind="error">{query.error.message}</InlineNotice>
          </div>
        ) : saldos.length === 0 ? (
          <div className="px-5 py-6 text-[13px]" style={{ color: 'var(--ink-500)' }}>
            Este contribuyente no tiene saldos a favor de IVA registrados.
          </div>
        ) : (
          <SimpleTable
            headers={['', 'Periodo de origen', 'Folio de operación', 'Tipo', 'Presentada', 'Monto original', 'Remanente', 'Origen', '']}
            align={MONTO_COLS}
          >
            {saldos.map((b) => {
              const apps = b.applications ?? []
              const fuera = Number(b.appliedOutsideAmount) || 0
              const conDetalle = apps.length > 0 || fuera > 0
              const abierto = abiertos.has(b.id)
              const enEsta = apps.some((a) => a.declarationId === declarationId)
              return (
                <Fragment key={b.id}>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className={cellClass}>
                      <button
                        type="button"
                        onClick={() => toggle(b.id)}
                        disabled={!conDetalle}
                        title={!conDetalle ? 'Todavía no se ha aplicado' : 'Ver en qué declaraciones se aplicó'}
                        className="p-1 rounded disabled:opacity-40"
                        style={{ color: 'var(--ink-700)' }}
                      >
                        {abierto ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    </td>
                    <td className={cellClass} style={{ color: 'var(--ink-900)' }}>
                      <div className="font-semibold">{periodoLabel(b.originFiscalYear, b.originMonth)}</div>
                      <div className="text-[11.5px]" style={{ color: 'var(--ink-500)' }}>
                        {apps.length === 0
                          ? fuera > 0
                            ? 'Acreditado fuera del sistema'
                            : 'Sin aplicar'
                          : `Aplicado en ${apps.length} declaración${apps.length === 1 ? '' : 'es'}`}
                        {enEsta && ' · incluye esta'}
                      </div>
                    </td>
                    <td className={cellClass} style={cellMoneyStyle}>{b.operationNumber || '—'}</td>
                    <td className={cellClass} style={{ color: 'var(--ink-700)' }}>{b.declarationType || '—'}</td>
                    <td className={`${cellClass} whitespace-nowrap`} style={{ color: 'var(--ink-700)' }}>
                      {fmtFecha(b.presentedDate)}
                    </td>
                    <td className={cellMoneyClass} style={cellMoneyStyle}>{fmtMoney(b.originalAmount)}</td>
                    <td className={`${cellMoneyClass} font-bold`} style={cellMoneyStyle}>{fmtMoney(b.remainingAmount)}</td>
                    <td className={cellClass}>
                      {esManual(b) ? (
                        <Badge>{SOURCE_LABEL.Manual}</Badge>
                      ) : (
                        <div className="flex flex-col gap-1 items-start">
                          <Badge kind="brand">{SOURCE_LABEL[b.source] ?? b.source}</Badge>
                          {b.originDeclarationId != null && (
                            <span className="text-[11px]" style={{ color: 'var(--ink-500)' }}>
                              Declaración #{b.originDeclarationId}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className={cellClass}>
                      <button
                        type="button"
                        onClick={() => abrirEdicion(b)}
                        disabled={form != null}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-bold transition hover:opacity-90 disabled:opacity-50"
                        style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
                      >
                        <Pencil size={12} /> Editar
                      </button>
                    </td>
                  </tr>
                  {abierto && conDetalle && (
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
                      <td />
                      <td colSpan={8} className="px-3 py-2.5">
                        <div className="flex flex-col gap-1">
                          {fuera > 0 && (
                            <div className="flex items-center gap-3 text-[12px] flex-wrap">
                              <span className="font-semibold" style={{ color: 'var(--ink-900)' }}>
                                Acreditado en declaraciones fuera del sistema
                              </span>
                              <span style={cellMoneyStyle}>{fmtMoney(fuera)}</span>
                            </div>
                          )}
                          {apps.map((a, i) => (
                            <div key={`${a.declarationId}-${i}`} className="flex items-center gap-3 text-[12px] flex-wrap">
                              <span className="font-semibold" style={{ color: 'var(--ink-900)' }}>
                                {a.fiscalYear && a.month ? periodoLabel(a.fiscalYear, a.month) : `Declaración #${a.declarationId}`}
                              </span>
                              {a.fiscalYear && a.month && (
                                <span style={{ color: 'var(--ink-500)' }}>Declaración #{a.declarationId}</span>
                              )}
                              <span style={cellMoneyStyle}>{fmtMoney(a.appliedAmount)}</span>
                              {a.declarationId === declarationId && <Badge kind="sky">Esta declaración</Badge>}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </SimpleTable>
        )}
      </Card>
    </div>
  )
})

const INPUT_CLASS = 'w-full px-3 py-2.5 rounded-lg text-[13px] disabled:opacity-60'
const INPUT_STYLE = { background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' } as const

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
        {label}
      </span>
      {children}
      {error ? (
        <span className="text-[11.5px] font-semibold" style={{ color: 'var(--danger)' }}>
          {error}
        </span>
      ) : (
        hint && (
          <span className="text-[11.5px]" style={{ color: 'var(--ink-500)' }}>
            {hint}
          </span>
        )
      )}
    </label>
  )
}
