'use client'

import { Loader2, Plus } from 'lucide-react'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { invalidateDeclarationData } from '@/features/declarations/hooks/useDeclarationQueries'
import { addManualIncome } from '@/features/declarations/actions/addManualIncome.action'
import type { ManualIncome, ManualIncomeIvaRate } from '@/features/declarations/types'
import { Modal } from '../modal'
import { Btn } from '../ui'
import {
  FORM_VACIO,
  IngresoGuardado,
  IngresoManualCampos,
  type IngresoForm,
  ivaDe,
  rangoDelPeriodo,
} from './ingreso-manual-form'

export function AgregarIngresoManualModal({
  open,
  onClose,
  declarationId,
  es625,
  periodo,
  fiscalYear,
  periodValueId,
}: {
  open: boolean
  onClose: () => void
  declarationId: number
  es625: boolean
  periodo: string
  fiscalYear: number
  periodValueId: number
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<IngresoForm>(FORM_VACIO)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<ManualIncome | null>(null)

  const clear = () => {
    setForm(FORM_VACIO)
    setError(null)
    setSaved(null)
  }
  const close = () => {
    clear()
    onClose()
  }

  const monto = Number(form.subtotal)
  const montoValido = form.subtotal.trim() !== '' && Number.isFinite(monto) && monto > 0
  const tasaEfectiva: ManualIncomeIvaRate = es625 ? '16' : form.tasa
  const iva = montoValido ? ivaDe(monto, tasaEfectiva) : 0

  const save = async () => {
    if (!form.fecha) return setError('Elige la fecha del cobro.')
    if (!form.concepto.trim()) return setError('Escribe el concepto.')
    if (!montoValido) return setError('El subtotal debe ser mayor a cero.')
    if (es625 && !form.classificationId) return setError('Elige el tipo de servicio.')
    setSaving(true)
    setError(null)
    try {
      const res = await addManualIncome(declarationId, {
        incomeDate: form.fecha,
        concept: form.concepto.trim(),
        subtotal: monto,
        ivaRate: tasaEfectiva,
        classificationId: es625 ? Number(form.classificationId) : null,
        counterparty: form.contraparte.trim() || null,
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
        <IngresoGuardado saved={saved} />
      ) : (
        <IngresoManualCampos
          form={form}
          onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
          es625={es625}
          open={open}
          rango={rangoDelPeriodo(fiscalYear, periodValueId)}
          iva={iva}
          total={montoValido ? monto + iva : 0}
          error={error}
        />
      )}
    </Modal>
  )
}
