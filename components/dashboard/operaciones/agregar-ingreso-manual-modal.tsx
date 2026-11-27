'use client'

import { Loader2, Plus } from 'lucide-react'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { invalidateDeclarationData } from '@/features/declarations/hooks/useDeclarationQueries'
import { addManualIncome } from '@/features/declarations/actions/addManualIncome.action'
import type { ManualIncome, ManualIncomeIvaRate } from '@/features/declarations/types'
import { FieldLabel, inputStyle } from '../cancelaciones/parts'
import { money } from '../declaraciones/parts'
import { DatePicker } from '../date-picker'
import { MONO } from '../constants'
import { Modal } from '../modal'
import { Btn } from '../ui'
import { InlineNotice } from './parts-612'
import { MESES } from './purchased-declarations'

export const CATEGORIAS_625 = [
  'Transporte terrestre de pasajeros',
  'Entrega de alimentos preparados',
  'Entrega de bienes (distintos de alimentos preparados)',
  'Hospedaje',
  'Otro tipo de servicios',
  'Comercio de bienes',
]

export const TASAS: { value: ManualIncomeIvaRate; label: string }[] = [
  { value: '16', label: '16 %' },
  { value: '8', label: '8 %' },
  { value: '0', label: '0 %' },
  { value: 'EXENTO', label: 'Exento' },
]

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** "Septiembre 2026" -> primer y último día del mes; sin límites si no se reconoce. */
function rangoDelPeriodo(periodo: string): { min?: string; max?: string } {
  const [mes, anio] = periodo.trim().split(/\s+/)
  const idx = MESES.findIndex((m) => m.toLowerCase() === mes?.toLowerCase())
  const year = Number(anio)
  if (idx < 0 || !year) return {}
  return { min: iso(new Date(year, idx, 1)), max: iso(new Date(year, idx + 1, 0)) }
}

const ivaDe = (subtotal: number, rate: ManualIncomeIvaRate) => {
  const factor = rate === '16' ? 0.16 : rate === '8' ? 0.08 : 0
  return Math.round(subtotal * factor * 100 + 1e-7) / 100
}

export function AgregarIngresoManualModal({
  open,
  onClose,
  declarationId,
  es625,
  periodo,
}: {
  open: boolean
  onClose: () => void
  declarationId: number
  es625: boolean
  periodo: string
}) {
  const queryClient = useQueryClient()
  const [fecha, setFecha] = useState('')
  const [concepto, setConcepto] = useState('')
  const [subtotal, setSubtotal] = useState('')
  const [tasa, setTasa] = useState<ManualIncomeIvaRate>('16')
  const [categoria, setCategoria] = useState('')
  const [rfc, setRfc] = useState('')
  const [nombre, setNombre] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<ManualIncome | null>(null)

  const clear = () => {
    setFecha('')
    setConcepto('')
    setSubtotal('')
    setTasa('16')
    setCategoria('')
    setRfc('')
    setNombre('')
    setError(null)
    setSaved(null)
  }
  const close = () => {
    clear()
    onClose()
  }

  const monto = Number(subtotal)
  const montoValido = subtotal.trim() !== '' && Number.isFinite(monto) && monto > 0
  const tasaEfectiva: ManualIncomeIvaRate = es625 ? '16' : tasa
  const iva = montoValido ? ivaDe(monto, tasaEfectiva) : 0

  const save = async () => {
    if (!fecha) return setError('Elige la fecha del cobro.')
    if (!concepto.trim()) return setError('Escribe el concepto.')
    if (!montoValido) return setError('El subtotal debe ser mayor a cero.')
    if (es625 && !categoria) return setError('Elige el tipo de servicio.')
    setSaving(true)
    setError(null)
    try {
      const res = await addManualIncome(declarationId, {
        incomeDate: fecha,
        concept: concepto.trim(),
        subtotal: monto,
        ivaRate: tasaEfectiva,
        category625: es625 ? categoria : null,
        counterpartyRfc: rfc.trim().toUpperCase() || null,
        counterpartyName: nombre.trim() || null,
      })
      if (!res.success) return setError(res.error.message)
      setSaved(res.value)
      void invalidateDeclarationData(queryClient, declarationId)
    } catch {
      setError('No se pudo guardar el ingreso. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const rango = rangoDelPeriodo(periodo)
  const field = 'w-full px-3 py-2.5 rounded-lg text-[13px] outline-none'

  return (
    <Modal
      isOpen={open}
      onClose={close}
      title="Agregar ingreso sin CFDI"
      subtitle={`Periodo ${periodo}. El IVA se calcula con la tasa; no se captura.`}
      footer={
        <div className="flex justify-end gap-2">
          <Btn kind="ghost" size="sm" onClick={close}>{saved ? 'Cerrar' : 'Cancelar'}</Btn>
          {saved ? (
            <Btn size="sm" onClick={clear}><Plus size={14} /> Agregar otro</Btn>
          ) : (
            <Btn size="sm" onClick={save} disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Agregar
            </Btn>
          )}
        </div>
      }
    >
      {saved ? (
        <div className="flex flex-col gap-3 text-[13px]" style={{ color: 'var(--ink-700)' }}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span>Subtotal</span>
            <span style={{ ...MONO, textAlign: 'right' }}>{money(saved.subtotal)}</span>
            <span>IVA trasladado</span>
            <span style={{ ...MONO, textAlign: 'right' }}>{money(saved.transferredIva)}</span>
            <span className="font-semibold">Total</span>
            <span className="font-semibold" style={{ ...MONO, textAlign: 'right' }}>{money(saved.total)}</span>
          </div>
          <InlineNotice kind="success">{saved.message ?? 'Se agregó el ingreso. Recalcula la declaración para que entre al cálculo.'}</InlineNotice>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div>
            <FieldLabel>Fecha del cobro</FieldLabel>
            <DatePicker value={fecha} onChange={setFecha} min={rango.min} max={rango.max} />
          </div>
          <div>
            <FieldLabel>Concepto</FieldLabel>
            <input value={concepto} maxLength={300} onChange={(e) => setConcepto(e.target.value)} className={field} style={inputStyle} />
          </div>
          {es625 && (
            <div>
              <FieldLabel>Tipo de servicio</FieldLabel>
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={`${field} cursor-pointer`} style={inputStyle}>
                <option value="">Selecciona…</option>
                {CATEGORIAS_625.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Subtotal (sin IVA)</FieldLabel>
              <input value={subtotal} inputMode="decimal" onChange={(e) => setSubtotal(e.target.value)} className={field} style={{ ...inputStyle, ...MONO }} />
            </div>
            {!es625 && (
              <div>
                <FieldLabel>Tasa de IVA</FieldLabel>
                <select value={tasa} onChange={(e) => setTasa(e.target.value as ManualIncomeIvaRate)} className={`${field} cursor-pointer`} style={inputStyle}>
                  {TASAS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            )}
          </div>
          {es625 && <p className="text-[12px]" style={{ color: 'var(--ink-500)' }}>En el 625 el IVA se calcula al 16 %</p>}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[13px]" style={{ color: 'var(--ink-700)' }}>
            <span>IVA</span>
            <span style={{ ...MONO, textAlign: 'right' }}>{money(iva)}</span>
            <span className="font-semibold">Total</span>
            <span className="font-semibold" style={{ ...MONO, textAlign: 'right' }}>{money(montoValido ? monto + iva : 0)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel hint="(opcional)">RFC de la contraparte</FieldLabel>
              <input value={rfc} maxLength={13} onChange={(e) => setRfc(e.target.value)} className={`${field} uppercase`} style={{ ...inputStyle, ...MONO }} />
            </div>
            <div>
              <FieldLabel hint="(opcional)">Nombre</FieldLabel>
              <input value={nombre} maxLength={300} onChange={(e) => setNombre(e.target.value)} className={field} style={inputStyle} />
            </div>
          </div>
          {error && <InlineNotice kind="error">{error}</InlineNotice>}
        </div>
      )}
    </Modal>
  )
}
