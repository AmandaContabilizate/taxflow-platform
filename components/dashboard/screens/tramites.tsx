import { Calendar, FileText, Key, MapPin, RefreshCcw } from 'lucide-react'
import { DISPLAY, MONO } from '../constants'
import { Badge, Btn, Card, Divider, HelpBox } from '../ui'

export function TramitesScreen() {
  const tramitesSat = [
    { Icon: MapPin, t: 'Cambio de domicilio fiscal', s: 'Si te mudaste, hay que avisarle al SAT' },
    { Icon: Calendar, t: 'Agendar cita en el SAT', s: 'Para trámites que requieren ir en persona' },
    { Icon: Key, t: 'Sellos digitales (CSD)', s: 'Necesarios para emitir facturas' },
    { Icon: RefreshCcw, t: 'Actualizar tu régimen', s: 'Si cambiaste de actividad' },
  ]
  const tramitesPrecios = [300, 200, 300, 300]

  return (
    <div className="flex flex-col gap-6 max-w-[1040px]">
      <HelpBox>
        Aquí están los trámites <strong>extra</strong> que puedes contratar cuando los necesites. Los que ya vienen
        incluidos en tu plan dicen <em>"Incluido"</em> y no te cobramos nada extra.
      </HelpBox>

      <div>
        <div className="text-[18px] font-bold mb-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
          Trámites con el SAT
        </div>
        <div className="text-[13.5px] mb-4" style={{ color: 'var(--ink-500)' }}>
          Nosotros los hacemos por ti, sin que tengas que ir a una oficina.
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tramitesSat.map((x, i) => (
            <div
              key={x.t}
              className="rounded-3xl p-5 flex flex-col gap-3"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--sh-1)' }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--brand-50)', color: 'var(--brand-700)' }}
                >
                  <x.Icon size={20} />
                </div>
                <Badge kind="brand">Incluido</Badge>
              </div>
              <div>
                <div className="font-bold text-[15px]">{x.t}</div>
                <div className="text-[12.5px] mt-1" style={{ color: 'var(--ink-500)' }}>
                  {x.s}
                </div>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[12px] font-semibold line-through" style={{ color: 'var(--ink-400)' }}>
                  ${tramitesPrecios[i]}
                </span>
                <Btn size="sm" kind="ghost">
                  Solicitar
                </Btn>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[18px] font-bold mb-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
          Declaraciones extras
        </div>
        <div className="text-[13.5px] mb-4" style={{ color: 'var(--ink-500)' }}>
          Estas no vienen en tu plan mensual y se cobran por separado.
        </div>
        <Card>
          <div>
            <div className="flex items-center gap-3 px-4 py-4">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--coral-soft)', color: '#9E3A15' }}
              >
                <FileText size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[14.5px]">Declaración complementaria mensual</div>
                <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                  Para corregir un mes que ya presentaste
                </div>
              </div>
              <span className="text-[14.5px] font-extrabold mr-1" style={MONO}>
                $218.90
              </span>
              <Btn size="sm" kind="ghost">
                Contratar
              </Btn>
            </div>
            <Divider />
            <div className="flex items-center gap-3 px-4 py-4" style={{ background: 'var(--brand-50)' }}>
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--card)', color: 'var(--brand-700)' }}
              >
                <FileText size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[14.5px]">Declaración anual</div>
                <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-700)' }}>
                  El reporte anual de todo tu año fiscal
                </div>
              </div>
              <span className="text-[14.5px] font-extrabold mr-1" style={MONO}>
                $934.00
              </span>
              <Btn size="sm" kind="brand">
                Contratar
              </Btn>
            </div>
            <Divider />
            <div className="flex items-center gap-3 px-4 py-4">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--amber-soft)', color: '#7B5312' }}
              >
                <FileText size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[14.5px]">Anual complementaria</div>
                <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                  Si tu declaración anual tuvo un error
                </div>
              </div>
              <span className="text-[14.5px] font-extrabold mr-1" style={MONO}>
                $1,276.00
              </span>
              <Btn size="sm" kind="ghost">
                Contratar
              </Btn>
            </div>
          </div>
        </Card>
      </div>

      <div className="rounded-3xl p-5" style={{ background: 'var(--card-muted)', border: '1px solid var(--border)' }}>
        <div className="text-[13px] leading-relaxed" style={{ color: 'var(--ink-500)' }}>
          Todos los precios incluyen IVA. La declaración anual no se incluye en el plan mensual y se cobra una vez al
          año.
        </div>
      </div>
    </div>
  )
}
