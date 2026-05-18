import { AlertCircle, Calendar, HelpCircle, Zap } from 'lucide-react'
import { DISPLAY, MONO } from '../constants'
import type { GoFn } from '../types'
import { Badge, Btn, Card, Divider, HelpBox, Pill, SummaryStat, VideoSlot } from '../ui'
import { NeedsSatConnect } from './needs-sat-connect'

interface Props {
  rfc: string | null
  go: GoFn
}

export function DiagnosticoScreen({ rfc, go }: Props) {
  const hasCsf = Boolean(rfc && rfc.length >= 12)
  if (!hasCsf) return <NeedsSatConnect go={go} feature="ver tu diagnóstico fiscal" />

  const adeudos = ['Noviembre 2025', 'Diciembre 2025', 'Enero 2026', 'Febrero 2026', 'Marzo 2026']
  const oportunidades = [
    { t: 'Deducciones personales', a: '+$3,100', d: 'Gastos médicos, colegiaturas y donativos pueden bajar tus impuestos.' },
    { t: 'Gastos de tu actividad', a: '+$4,100', d: 'Gasolina, mantenimiento y teléfono que usas para trabajar.' },
    { t: 'Revisión de retenciones', a: '+$1,560', d: 'Verifica que las plataformas estén reteniendo lo correcto.' },
  ]

  return (
    <div className="flex flex-col gap-6 max-w-[1040px]">
      <HelpBox>
        <strong>¿Qué es un diagnóstico fiscal?</strong> Es un análisis de tu situación con el SAT. Te decimos qué está
        bien, qué hay que arreglar y dónde puedes ahorrar.
      </HelpBox>

      <div
        className="rounded-3xl p-7 lg:p-8"
        style={{ background: 'var(--hero-coral-soft-bg)', border: '1px solid var(--coral-soft)' }}
      >
        <Pill kind="coral">
          <AlertCircle size={14} /> Requiere atención
        </Pill>
        <div
          className="text-[28px] lg:text-[34px] font-extrabold tracking-tight leading-tight mt-4 max-w-[680px]"
          style={DISPLAY}
        >
          Tu situación fiscal está <span style={{ color: '#9E3A15' }}>regular</span>
        </div>
        <div className="text-[14.5px] mt-3 leading-relaxed max-w-[600px]" style={{ color: 'var(--ink-700)' }}>
          Revisamos tus últimas 9 facturas y 3 declaraciones. La buena noticia: podrías ahorrar{' '}
          <strong>$8,760 MXN</strong> con unos ajustes simples.
        </div>
        <div className="flex flex-wrap gap-3 mt-6">
          <Btn kind="brand" size="lg">
            <Zap size={18} /> Empezar a regularizar
          </Btn>
          <Btn kind="ghost" size="lg" onClick={() => go('ayuda')}>
            <HelpCircle size={18} /> No entiendo qué significa
          </Btn>
        </div>
      </div>

      <div>
        <div className="text-[18px] font-bold mb-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
          Tu año en números
        </div>
        <div className="text-[13.5px] mb-4" style={{ color: 'var(--ink-500)' }}>
          Lo que el SAT sabe de ti hasta hoy.
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryStat label="Ingresos" value="$336K" hint="Lo que has reportado este año" />
          <SummaryStat label="Gastos" value="$112K" hint="33% de tus ingresos" />
          <SummaryStat label="Facturas emitidas" value="24" hint="2 aún sin cobrar" />
          <SummaryStat label="Pendientes" value="5" hint="Declaraciones por presentar" tone="warn" />
        </div>
      </div>

      <div>
        <div className="text-[18px] font-bold mb-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
          Lo que debes al SAT
        </div>
        <div className="text-[13.5px] mb-4" style={{ color: 'var(--ink-500)' }}>
          $4,850 MXN en total. Te ayudamos a regularizarte mes por mes.
        </div>
        <Card>
          <div>
            {adeudos.map((m, i, arr) => (
              <div key={m}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--amber-soft)', color: '#7B5312' }}
                  >
                    <Calendar size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14.5px]">{m}</div>
                    <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                      Impuestos sin pagar
                    </div>
                  </div>
                  <div className="text-[14.5px] font-extrabold" style={MONO}>
                    $970
                  </div>
                  <Badge kind="amber">Pendiente</Badge>
                </div>
                {i < arr.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div>
        <div className="text-[18px] font-bold mb-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
          💡 Dónde puedes ahorrar
        </div>
        <div className="text-[13.5px] mb-4" style={{ color: 'var(--ink-500)' }}>
          Cosas que probablemente no estás aprovechando.
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {oportunidades.map(o => (
            <div
              key={o.t}
              className="rounded-3xl p-5"
              style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-200)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-[14.5px]" style={{ color: 'var(--brand-900)' }}>
                  {o.t}
                </div>
                <Badge kind="brand">{o.a}</Badge>
              </div>
              <div className="text-[13px] leading-relaxed" style={{ color: 'var(--ink-700)' }}>
                {o.d}
              </div>
            </div>
          ))}
        </div>
      </div>

      <VideoSlot title="¿Cómo se calcula mi diagnóstico fiscal?" duration="3 min" />
    </div>
  )
}
