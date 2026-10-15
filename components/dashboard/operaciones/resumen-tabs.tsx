'use client'

import { Download, Mail, MessageSquarePlus } from 'lucide-react'
import { memo } from 'react'
import type { DeclarationGeneral, DeclarationSubject } from '@/features/operations/types'
import { ResumenDeclaracion } from './resumen-declaracion'
import { declarationStatusBadge } from '../declaraciones/parts'
import { MONO } from '../constants'
import { Badge } from '../ui'

/* -------------------------------------------------------------------------- */
/*  Props compartidas por Clasificación y Reporte Cliente                      */
/* -------------------------------------------------------------------------- */

interface ResumenProps {
  declarationId: number
  general: DeclarationGeneral | null
  periodo: string
  fiscalYear: number
}

/* -------------------------------------------------------------------------- */
/*  Tab: Clasificación                                                        */
/* -------------------------------------------------------------------------- */

export const ClasificacionTab = memo(function ClasificacionTab({
  declarationId,
  general,
  periodo,
  fiscalYear,
}: ResumenProps) {
  return (
    <ResumenDeclaracion
      declarationId={declarationId}
      general={general}
      periodo={periodo}
      fiscalYear={fiscalYear}
    />
  )
})

/* -------------------------------------------------------------------------- */
/*  Tab: Reporte Cliente                                                      */
/* -------------------------------------------------------------------------- */

export const ReporteClienteTab = memo(function ReporteClienteTab({
  d,
  declarationId,
  general,
  periodo,
  fiscalYear,
  onGoToComments,
}: ResumenProps & { d: DeclarationSubject; onGoToComments: () => void }) {
  const initials =
    d.legalName
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || 'C'

  return (
    <div className="flex flex-col gap-5">
      {/* Report header card */}
      <div className="rounded-3xl p-5" style={{ background: 'var(--hero-info)', border: '1px solid var(--hero-info-border)' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-extrabold flex-shrink-0"
              style={{ background: 'var(--violet)', color: '#fff' }}
            >
              {initials}
            </div>
            <div>
              <h3 className="text-[18px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
                Reporte Fiscal — {d.periodo}
              </h3>
              <div className="flex gap-2 mt-2 flex-wrap">
                <MiniField label="Cliente" value={d.legalName} />
                <MiniField label="RFC" value={d.rfc} mono />
                <MiniField label="Ejercicio" value={String(d.fiscalYear)} />
              </div>
            </div>
          </div>
          <div className="text-right">
            {general ? (
              <Badge kind={declarationStatusBadge(general.statusCode, general.statusDescription).kind}>
                {declarationStatusBadge(general.statusCode, general.statusDescription).label}
              </Badge>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold" style={{ background: 'var(--ink-50)', color: 'var(--ink-500)' }}>
                Cargando estatus…
              </span>
            )}
            <div className="text-[11.5px] mt-1" style={{ color: 'var(--ink-500)' }}>
              {d.accountantName ? `Revisado por ${d.accountantName}` : 'Revisado por contador certificado'}
            </div>
          </div>
        </div>

        {/* "Descargar Reporte PDF" y "Enviar por Email" no tienen handler todavía: se
            conservan tal cual, sin inventarles comportamiento. */}
        <div className="flex gap-2 mt-4 flex-wrap">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12.5px] font-bold" style={{ background: 'var(--sky)', color: '#fff' }}>
            <Download size={15} /> Descargar Reporte PDF
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12.5px] font-bold" style={{ background: 'linear-gradient(135deg,#00D3A1 0%,#00AD87 100%)', color: '#fff' }}>
            <Mail size={15} /> Enviar por Email
          </button>
          <button
            onClick={onGoToComments}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12.5px] font-bold"
            style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
          >
            <MessageSquarePlus size={15} /> Agregar Comentario
          </button>
        </div>
      </div>
      {/* Resumen y desglose del periodo, con los datos del EP de cálculos */}
      <ResumenDeclaracion
        declarationId={declarationId}
        general={general}
        periodo={periodo}
        fiscalYear={fiscalYear}
      />
    </div>
  )
})

function MiniField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg px-3 py-1.5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-500)' }}>{label}</div>
      <div className="text-[12.5px] font-bold" style={{ ...(mono ? MONO : {}), color: 'var(--ink-900)' }}>{value}</div>
    </div>
  )
}
