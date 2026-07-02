'use client'

import { useState } from 'react'
import { AlertTriangle, BadgeCheck, Check, Download, Eye, FileDown } from 'lucide-react'
import { useHasRfc, useSelectedRfc } from '@/features/taxpayers/stores/rfcStore'
import { DISPLAY, MONO } from '../constants'
import type { GoFn } from '../types'
import { Badge, Btn, Card, Divider, HelpBox, SummaryStat, Tabs } from '../ui'
import { NeedsSatConnect } from './needs-sat-connect'

interface Props {
  go: GoFn
}

type Estado = 'deducible' | 'revisar'

interface Factura {
  emisor: string
  rfc: string
  meta: string
  monto: string
  estado: Estado
}

const RECIBIDAS: Factura[] = [
  { emisor: 'Farmacia del Ahorro', rfc: 'FDA010101XXX', meta: '14 abr · Medicamentos', monto: '$2,500', estado: 'deducible' },
  { emisor: 'Gasolinera Express', rfc: 'GEX150101XXX', meta: '12 abr · Combustible', monto: '$1,800', estado: 'deducible' },
  { emisor: 'Office Depot', rfc: 'ODE920101XXX', meta: '10 abr · Material oficina', monto: '$3,200', estado: 'deducible' },
  { emisor: 'Telmex', rfc: 'TMX931208XXX', meta: '08 abr · Servicio telefónico', monto: '$899', estado: 'deducible' },
  { emisor: 'CFE', rfc: 'CFE370814XXX', meta: '05 abr · Energía eléctrica', monto: '$1,500', estado: 'deducible' },
  { emisor: 'Restaurante La Parroquia', rfc: 'RLP010101XXX', meta: '03 abr · Alimentos', monto: '$450', estado: 'revisar' },
]

const EMITIDAS: Factura[] = [
  { emisor: 'Constructora del Norte', rfc: 'CNO980215XXX', meta: '15 abr · Servicios profesionales', monto: '$48,000', estado: 'deducible' },
  { emisor: 'Grupo Comercial Delta', rfc: 'GCD050510XXX', meta: '11 abr · Consultoría', monto: '$35,000', estado: 'deducible' },
  { emisor: 'Distribuidora Pacífico', rfc: 'DPA110320XXX', meta: '06 abr · Servicios profesionales', monto: '$28,500', estado: 'deducible' },
  { emisor: 'Innovación Digital SA', rfc: 'IDI170808XXX', meta: '02 abr · Consultoría', monto: '$16,500', estado: 'deducible' },
]

const CANCELADAS: Factura[] = [
  { emisor: 'Grupo Comercial Delta', rfc: 'GCD050510XXX', meta: '09 abr · Consultoría', monto: '$12,000', estado: 'revisar' },
]

const TABS = ['Recibidas', 'Emitidas', 'Canceladas'] as const
const DATA: Factura[][] = [RECIBIDAS, EMITIDAS, CANCELADAS]

export function DocumentosScreen({ go }: Props) {
  const { hasRfc, loading } = useHasRfc()
  const rfc = useSelectedRfc()
  const [tab, setTab] = useState(0)
  if (loading) return null
  if (!hasRfc) return <NeedsSatConnect go={go} feature="ver tu bóveda" />

  const status = [
    { t: 'Estás al corriente con tus obligaciones', s: 'No debes nada al SAT' },
    { t: 'No apareces en listas negras', s: 'Tu RFC tiene buen historial' },
    { t: 'Tu RFC está activo', s: 'Puedes facturar sin problema' },
  ]
  const facturas = DATA[tab]

  return (
    <div className="flex flex-col gap-5 max-w-[960px]">
      <HelpBox>
        Esta es tu <strong>bóveda digital</strong>: aquí guardamos tu Constancia de Situación Fiscal y todas las
        facturas que el SAT registra a tu nombre. Las descargamos automáticamente por ti.
      </HelpBox>

      {/* Constancia de Situación Fiscal */}
      <div>
        <div className="text-[16px] font-bold mb-3" style={{ color: 'var(--ink-700)' }}>
          📄 Tu Constancia de Situación Fiscal
        </div>
        <div
          className="rounded-3xl p-6"
          style={{ background: 'var(--hero-brand-soft)', border: '1px solid var(--brand-200)' }}
        >
          <div className="flex items-center gap-4 flex-wrap">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(140deg,#10DA92,#00A068)' }}
            >
              <BadgeCheck size={28} color="#fff" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--brand-700)' }}>
                Vigente · al día
              </div>
              <div className="text-[20px] font-extrabold tracking-tight mt-1" style={DISPLAY}>
                Está lista cuando la necesites
              </div>
              <div className="text-[13px] mt-1" style={{ ...MONO, color: 'var(--ink-500)' }}>
                RFC: {rfc}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-5 flex-wrap">
            <Btn kind="primary">
              <Eye size={16} /> Ver documento
            </Btn>
            <Btn kind="ghost">
              <FileDown size={16} /> Descargar PDF
            </Btn>
          </div>
        </div>
      </div>

      {/* Situación ante el SAT */}
      <div>
        <div className="text-[16px] font-bold mb-3" style={{ color: 'var(--ink-700)' }}>
          ✅ Tu situación ante el SAT
        </div>
        <Card>
          <div>
            {status.map((it, i, arr) => (
              <div key={it.t}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--brand-50)', color: 'var(--brand-700)' }}
                  >
                    <Check size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14.5px]">{it.t}</div>
                    <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                      {it.s}
                    </div>
                  </div>
                </div>
                {i < arr.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bóveda de facturas (CFDI) */}
      <div>
        <div className="text-[16px] font-bold mb-3" style={{ color: 'var(--ink-700)' }}>
          🧾 Tus facturas (CFDI)
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <SummaryStat label="Emitidas" value="$128K" hint="5 facturas" />
          <SummaryStat label="Recibidas" value="$10K" hint="6 facturas" />
          <SummaryStat label="Deducible" value="$9.9K" hint="95% ✓" tone="ok" />
        </div>

        {/* Tabs + descarga */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <Tabs items={[...TABS]} active={tab} onChange={setTab} />
          <Btn kind="ghost" size="sm">
            <Download size={16} /> Descargar XML + PDF
          </Btn>
        </div>

        <Card>
          {facturas.length === 0 ? (
            <div className="px-4 py-10 text-center text-[13.5px]" style={{ color: 'var(--ink-500)' }}>
              No hay facturas en esta sección.
            </div>
          ) : (
            <div>
              {facturas.map((f, i, arr) => {
                const isRevisar = f.estado === 'revisar'
                return (
                  <div key={`${f.rfc}-${f.meta}`}>
                    <div className="flex items-center gap-3 px-4 py-3.5">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={
                          isRevisar
                            ? { background: 'var(--amber-soft)', color: '#7B5312' }
                            : { background: 'var(--brand-50)', color: 'var(--brand-700)' }
                        }
                      >
                        {isRevisar ? <AlertTriangle size={20} /> : <FileDown size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[14.5px] truncate">{f.emisor}</div>
                        <div className="text-[12px] mt-0.5 truncate" style={{ ...MONO, color: 'var(--ink-500)' }}>
                          {f.rfc} · {f.meta}
                        </div>
                      </div>
                      <div className="text-[14.5px] font-extrabold" style={MONO}>
                        {f.monto}
                      </div>
                      <Badge kind={isRevisar ? 'amber' : 'brand'}>{isRevisar ? 'Revisar' : 'Deducible'}</Badge>
                    </div>
                    {i < arr.length - 1 && <Divider />}
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
