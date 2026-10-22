'use client'

import { Check, Loader2, X } from 'lucide-react'
import { type ReactNode, useMemo, useState } from 'react'
import { capturedFixedAssetSchema } from '@/features/fixed-assets/schemas/fixedAsset.schema'
import type { CapturedFixedAssetInput, FixedAsset, FixedAssetType } from '@/features/fixed-assets/types'
import { MES_OPCIONES, fmtMoney, fmtPercent, periodoLabel } from './parts-612'

/** Borrador del formulario: todo como texto, se valida con `capturedFixedAssetSchema` al guardar. */
interface Draft {
  assetTypeCode: string
  description: string
  monthlyAmount: string
  startFiscalYear: string
  startMonth: string
}

const inputStyle = { background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }
const inputClass = 'px-2.5 py-2 rounded-lg text-[12.5px] w-full'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-[11.5px] font-semibold" style={{ color: 'var(--ink-700)' }}>
      {label}
      {children}
    </label>
  )
}

const toNum = (s: string) => {
  const t = s.replace(/,/g, '').trim()
  return t === '' ? Number.NaN : Number(t)
}

/** Mes absoluto (año × 12 + mes − 1) para sumar y comparar periodos. */
const abs = (y: number, m: number) => y * 12 + (m - 1)
const fromAbs = (n: number) => ({ year: Math.floor(n / 12), month: (n % 12) + 1 })

/**
 * Estimación del activo capturado (R7): monto deducible = mensual × 12 ÷ tasa; se agota en
 * 12 ÷ tasa meses contados desde el mes en que empezó. El back y el clasificador hacen la cuenta
 * definitiva; esto es solo para que el contador revise lo que captura.
 */
export function estimarCapturado(monthly: number, rate: number | null | undefined, startYear: number, startMonth: number) {
  if (!(monthly > 0) || !rate || rate <= 0 || !startYear || !(startMonth >= 1 && startMonth <= 12)) return null
  const deducible = (monthly * 12) / rate
  const meses = Math.ceil(deducible / monthly - 1e-9)
  const inicio = abs(startYear, startMonth)
  const ultimo = fromAbs(inicio + meses - 1)
  const hoy = new Date()
  const transcurridos = Math.max(0, abs(hoy.getFullYear(), hoy.getMonth() + 1) - inicio)
  return { deducible, meses, ultimo, restantes: Math.max(0, meses - transcurridos) }
}

/**
 * Alta o corrección de un activo que ya se deprecia y no tiene factura en el sistema. Pide tipo,
 * descripción, monto mensual y mes y año en que empezó; muestra el deducible estimado y en
 * cuántos meses se agota.
 */
export function ActivoCapturadoForm({
  rfc,
  types,
  asset,
  busy,
  onSubmit,
  onCancel,
}: {
  rfc: string
  types: FixedAssetType[]
  /** Activo a corregir; sin él es alta. */
  asset?: FixedAsset | null
  busy: boolean
  onSubmit: (input: CapturedFixedAssetInput) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<Draft>(() => ({
    assetTypeCode: asset?.assetTypeCode ?? '',
    description: asset?.description ?? '',
    monthlyAmount: asset?.capture?.monthlyAmount != null ? String(asset.capture.monthlyAmount) : '',
    startFiscalYear: asset?.capture?.startFiscalYear != null ? String(asset.capture.startFiscalYear) : '',
    startMonth: asset?.capture?.startMonth != null ? String(asset.capture.startMonth) : '',
  }))
  const [error, setError] = useState<string | null>(null)
  const set = (campo: keyof Draft) => (valor: string) => setDraft((prev) => ({ ...prev, [campo]: valor }))

  const tipo = types.find((t) => t.code === draft.assetTypeCode)
  const tasa = tipo?.annualRate ?? (asset?.assetTypeCode === draft.assetTypeCode ? asset?.annualRate : null)
  const tope = tipo?.deductibleCap ?? null
  const estimado = useMemo(
    () => estimarCapturado(toNum(draft.monthlyAmount), tasa, toNum(draft.startFiscalYear), toNum(draft.startMonth)),
    [draft.monthlyAmount, draft.startFiscalYear, draft.startMonth, tasa],
  )

  const guardar = () => {
    const descripcion = draft.description.trim()
    const parsed = capturedFixedAssetSchema.safeParse({
      rfc,
      assetTypeCode: draft.assetTypeCode,
      ...(descripcion ? { description: descripcion } : {}),
      monthlyAmount: toNum(draft.monthlyAmount),
      startFiscalYear: toNum(draft.startFiscalYear),
      startMonth: toNum(draft.startMonth),
    })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisa los datos del activo.')
      return
    }
    setError(null)
    onSubmit(parsed.data)
  }

  const anioActual = new Date().getFullYear()

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Tipo de activo">
          <select
            value={draft.assetTypeCode}
            onChange={(e) => set('assetTypeCode')(e.target.value)}
            disabled={busy}
            className={inputClass}
            style={inputStyle}
          >
            <option value="">Elige el tipo…</option>
            {draft.assetTypeCode && !tipo && <option value={draft.assetTypeCode}>{draft.assetTypeCode}</option>}
            {types.map((t) => (
              <option key={t.code} value={t.code}>
                {t.name} · {fmtPercent(t.annualRate)} anual
              </option>
            ))}
          </select>
        </Field>
        <Field label="Descripción">
          <input
            value={draft.description}
            onChange={(e) => set('description')(e.target.value)}
            maxLength={500}
            placeholder="p. ej. Camioneta Nissan 2024"
            disabled={busy}
            className={inputClass}
            style={inputStyle}
          />
        </Field>
        <Field label="Depreciación mensual">
          <input
            inputMode="decimal"
            value={draft.monthlyAmount}
            onChange={(e) => set('monthlyAmount')(e.target.value)}
            placeholder="0.00"
            disabled={busy}
            className={inputClass}
            style={inputStyle}
          />
        </Field>
        <Field label="Mes en que empezó">
          <select
            value={draft.startMonth}
            onChange={(e) => set('startMonth')(e.target.value)}
            disabled={busy}
            className={inputClass}
            style={inputStyle}
          >
            <option value="">Mes…</option>
            {MES_OPCIONES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Año en que empezó">
          <input
            type="number"
            inputMode="numeric"
            min={2000}
            max={anioActual}
            value={draft.startFiscalYear}
            onChange={(e) => set('startFiscalYear')(e.target.value)}
            placeholder={String(anioActual)}
            disabled={busy}
            className={inputClass}
            style={inputStyle}
          />
        </Field>
      </div>

      <div className="text-[12px] flex flex-col gap-0.5" style={{ color: 'var(--ink-700)' }}>
        {estimado ? (
          <>
            <span>
              Monto deducible estimado: <strong>{fmtMoney(estimado.deducible)}</strong> (mensual × 12 ÷{' '}
              {fmtPercent(tasa)}).
            </span>
            <span>
              Se agota en <strong>{estimado.meses}</strong> meses: el último es{' '}
              {periodoLabel(estimado.ultimo.year, estimado.ultimo.month)}
              {estimado.restantes > 0
                ? `; a la fecha le quedan ${estimado.restantes}.`
                : '; a la fecha ya se agotó, no deducirá nada.'}
            </span>
            {tope != null && estimado.deducible > tope && (
              <span style={{ color: 'var(--violet-ink)' }}>
                Supera el tope deducible del tipo ({fmtMoney(tope)}): revisa el monto mensual.
              </span>
            )}
          </>
        ) : (
          <span style={{ color: 'var(--ink-500)' }}>
            Captura el tipo, el monto mensual y el mes en que empezó para ver el monto deducible y en cuántos meses se agota.
          </span>
        )}
      </div>

      {error && (
        <div className="text-[12px] font-semibold" style={{ color: 'var(--violet-ink)' }}>
          {error}
        </div>
      )}

      <div className="flex items-center gap-1.5 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold disabled:opacity-60"
          style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
        >
          <X size={12} /> Cancelar
        </button>
        <button
          type="button"
          onClick={guardar}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg,#00D3A1 0%,#00AD87 100%)', color: '#fff' }}
        >
          {busy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}{' '}
          {asset ? 'Guardar corrección' : 'Agregar activo'}
        </button>
      </div>
    </div>
  )
}
