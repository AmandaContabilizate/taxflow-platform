import { BadgeCheck, Check, Eye, FileDown } from 'lucide-react'
import { DISPLAY, MONO } from '../constants'
import type { GoFn } from '../types'
import { Btn, Card, Divider, HelpBox } from '../ui'
import { NeedsSatConnect } from './needs-sat-connect'

interface Props {
  rfc: string | null
  go: GoFn
}

export function DocumentosScreen({ rfc, go }: Props) {
  const hasCsf = Boolean(rfc && rfc.length >= 12)
  if (!hasCsf) return <NeedsSatConnect go={go} feature="ver tus documentos" />

  const status = [
    { t: 'Estás al corriente con tus obligaciones', s: 'No debes nada al SAT' },
    { t: 'No apareces en listas negras', s: 'Tu RFC tiene buen historial' },
    { t: 'Tu RFC está activo', s: 'Puedes facturar sin problema' },
  ]
  const recibidas = [
    { t: 'Farmacia del Ahorro', s: '14 abr · Medicamentos', a: '$2,500' },
    { t: 'Gasolinera Express', s: '12 abr · Combustible', a: '$1,800' },
    { t: 'Office Depot', s: '10 abr · Material de oficina', a: '$3,200' },
    { t: 'Telmex', s: '8 abr · Teléfono', a: '$899' },
    { t: 'CFE', s: '5 abr · Luz', a: '$1,500' },
  ]

  return (
    <div className="flex flex-col gap-5 max-w-[960px]">
      <HelpBox>
        Aquí guardamos tu <strong>Constancia de Situación Fiscal</strong> y todas las facturas que el SAT registra a tu
        nombre. Las descargamos automáticamente por ti.
      </HelpBox>

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
              <div
                className="text-[12px] font-extrabold uppercase tracking-wider"
                style={{ color: 'var(--brand-700)' }}
              >
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

      <div>
        <div className="text-[16px] font-bold mb-1" style={{ color: 'var(--ink-700)' }}>
          🧾 Facturas que te enviaron
        </div>
        <div className="text-[13px] mb-3" style={{ color: 'var(--ink-500)' }}>
          Las facturas que tus proveedores te emitieron este mes. Las descargamos solas.
        </div>
        <Card>
          <div>
            {recibidas.map((r, i, arr) => (
              <div key={r.t}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--ink-50)', color: 'var(--ink-700)' }}
                  >
                    <FileDown size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14.5px] truncate">{r.t}</div>
                    <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                      {r.s}
                    </div>
                  </div>
                  <div className="text-[14.5px] font-extrabold" style={MONO}>
                    {r.a}
                  </div>
                </div>
                {i < arr.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
