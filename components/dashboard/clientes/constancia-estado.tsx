'use client'

import { FileCheck2, FileClock, FileX2, Loader2, UploadCloud } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { getConstanciaEstadoVendedor } from '@/features/diagnostico/actions/getConstanciaEstadoVendedor.action'
import type { CsfEsperaEstado } from '@/features/diagnostico/types'
import { Badge, Btn, CsfUploadModal } from '../ui'

interface Props {
  taxpayerId: number
  rfc: string
  /** Se llama tras subir una constancia (el padre recarga diagnóstico/resultado). */
  onChanged?: () => void
}

function fecha(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * Bloque "Constancia de situación fiscal" del tab Diagnóstico (backoffice), spec
 * spec-venta-con-constancia-subida.md §2 y §Cómo se enteraría (fila Vendedor):
 * chip del estado de la constancia (SAT · subida sin verificar · sin constancia) y, pasado
 * el tope de espera al SAT sin constancia, el botón "Subir constancia del cliente".
 * Misma regla del backend que ve el cliente; el vendedor no puede adelantarla.
 */
export function ConstanciaEstado({ taxpayerId, rfc, onChanged }: Props) {
  const [estado, setEstado] = useState<CsfEsperaEstado | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)

  const load = useCallback(async () => {
    const res = await getConstanciaEstadoVendedor(taxpayerId)
    if (res.success) {
      setEstado(res.value.estado)
      setError(null)
    } else {
      setError(res.error.message)
    }
    setLoading(false)
  }, [taxpayerId])

  useEffect(() => {
    setLoading(true)
    void load()
  }, [load])

  if (loading) {
    return (
      <div className="px-5 py-4 border-t flex items-center gap-2 text-[13px]" style={{ borderColor: 'var(--border)', color: 'var(--ink-500)' }}>
        <Loader2 size={15} className="animate-spin" /> Consultando la constancia…
      </div>
    )
  }

  if (error || !estado) {
    return (
      <div className="px-5 py-4 border-t text-[13px]" style={{ borderColor: 'var(--border)', color: 'var(--violet-ink)' }}>
        {error ?? 'Sin datos de constancia.'}
      </div>
    )
  }

  const chip = !estado.tieneConstancia
    ? { kind: 'coral' as const, icon: FileX2, label: 'Sin constancia' }
    : estado.constanciaVerificada
      ? { kind: 'brand' as const, icon: FileCheck2, label: `Constancia del SAT · ${fecha(estado.constanciaFecha)}` }
      : { kind: 'amber' as const, icon: FileClock, label: `Constancia sin verificar · subida ${fecha(estado.constanciaFecha)}` }
  const ChipIcon = chip.icon

  const mm = Math.floor(estado.segundosRestantes / 60)
  const ss = estado.segundosRestantes % 60

  return (
    <div className="px-5 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <div className="text-[13px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
          Constancia de situación fiscal
        </div>
        <Badge kind={chip.kind}>
          <span className="inline-flex items-center gap-1">
            <ChipIcon size={12} /> {chip.label}
          </span>
        </Badge>
      </div>

      {/* Backoffice: el botón está siempre que no haya constancia. La espera de 5 min es la
          regla del CLIENTE (primero intentar con el SAT); si el vendedor ya tiene el PDF en la
          mano, subirlo aquí es justo lo que desatora el caso (Amanda, 2026-09-22). */}
      {!estado.tieneConstancia && (
        <div className="flex items-center gap-3 flex-wrap">
          <Btn kind="brand" size="sm" onClick={() => setUploadOpen(true)}>
            <UploadCloud size={14} /> Subir constancia del cliente
          </Btn>
          <span className="text-[12.5px] tabular-nums" style={{ color: 'var(--ink-500)' }}>
            {!estado.tieneCiecCapturada
              ? 'El cliente no ha capturado su CIEC. Puedes subir la constancia que te mandó (PDF del SAT emitido hoy o ayer); la CIEC la seguirá necesitando para operar.'
              : estado.ciecEstado === 2
                ? 'CIEC inválida: puedes subir la constancia para venderle, pero el cliente debe corregir su CIEC para operar.'
                : estado.puedeSubirConstancia
                  ? `El SAT no respondió en ${estado.esperaMaxMinutos} min. Sube la que el cliente te mandó (PDF del SAT emitido hoy o ayer).`
                  : `El robot sigue intentando (${mm}:${ss.toString().padStart(2, '0')}). Si ya tienes el PDF del cliente, súbelo y no esperes.`}
          </span>
        </div>
      )}

      {estado.tieneConstancia && !estado.constanciaVerificada && (
        <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
          El régimen viene del PDF que se subió. Cuando el robot baje la del SAT la contrasta: si difiere, gana la del
          SAT y avisa a Gerencia contable.
        </div>
      )}

      <CsfUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        rfc={rfc}
        taxpayerId={taxpayerId}
        onUploaded={() => {
          void load()
          onChanged?.()
        }}
      />
    </div>
  )
}
