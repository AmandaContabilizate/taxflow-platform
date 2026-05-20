import { FileText, MessageCircle } from 'lucide-react'
import { useHasRfc } from '@/features/taxpayers/stores/rfcStore'
import { DISPLAY } from '../constants'
import type { GoFn } from '../types'
import { Btn, Card, Divider, HelpBox, Tabs, VideoSlot } from '../ui'
import { NeedsSatConnect } from './needs-sat-connect'

interface Props {
  go: GoFn
}

export function DeclaracionesScreen({ go }: Props) {
  const { hasRfc, loading } = useHasRfc()
  if (loading) return null
  if (!hasRfc) return <NeedsSatConnect go={go} feature="ver tus declaraciones" />

  return (
    <div className="flex flex-col gap-5 max-w-[920px]">
      <HelpBox>
        <strong>¿Qué es una declaración?</strong> Es el reporte mensual que entregas al SAT con lo que ganaste y lo que
        vas a pagar de impuestos. Tu contador la prepara y tú solo la autorizas.
      </HelpBox>

      <Tabs items={['Pendientes', 'En proceso', 'Presentadas']} active={0} />

      <div>
        <div className="text-[16px] font-bold mb-3" style={{ color: 'var(--ink-700)' }}>
          📌 La que toca este mes
        </div>
        <div
          className="rounded-3xl p-6 lg:p-7 text-white"
          style={{
            background: 'linear-gradient(155deg,#10DA92 0%,#00A068 75%)',
            boxShadow: 'var(--sh-brand)',
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div
                className="text-[12px] font-bold uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.85)' }}
              >
                Declaración de marzo 2026
              </div>
              <div className="text-[32px] font-extrabold tracking-tight mt-2" style={DISPLAY}>
                Vence mañana
              </div>
              <div className="text-[14px] mt-2 max-w-[420px]" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Tu contador ya revisó 9 de 12 facturas. Cuando termine, recibirás un aviso para que la autorices.
              </div>
            </div>
          </div>
          <div className="mt-5 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.25)' }}>
            <div className="h-full rounded-full" style={{ width: '78%', background: '#fff' }} />
          </div>
          <div className="text-[12.5px] mt-2 font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
            78% lista
          </div>
          <div className="flex gap-3 mt-5 flex-wrap">
            <Btn size="lg" style={{ background: '#fff', color: 'var(--ink-900)', boxShadow: 'none' }}>
              Ver detalle
            </Btn>
            <Btn
              size="lg"
              kind="ghost"
              style={{
                background: 'rgba(255,255,255,0.12)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.25)',
              }}
            >
              <MessageCircle size={18} /> Hablar con mi contador
            </Btn>
          </div>
        </div>
      </div>

      <div>
        <div className="text-[16px] font-bold mb-1" style={{ color: 'var(--ink-700)' }}>
          Meses pendientes de antes
        </div>
        <div className="text-[13px] mb-3" style={{ color: 'var(--ink-500)' }}>
          Estas declaraciones aún no se han presentado. Te ayudamos a regularizarte sin estrés.
        </div>
        <Card>
          <div>
            {['Diciembre 2025', 'Enero 2026', 'Febrero 2026'].map((m, i, arr) => (
              <div key={m}>
                <div className="flex items-center gap-3 px-4 py-4">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--amber-soft)', color: '#7B5312' }}
                  >
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14.5px]">{m}</div>
                    <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
                      Pendiente · te ayudamos a presentarla
                    </div>
                  </div>
                  <Btn size="sm" kind="ghost">
                    Resolver
                  </Btn>
                </div>
                {i < arr.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div>
        <div className="text-[16px] font-bold mb-3" style={{ color: 'var(--ink-700)' }}>
          ¿Necesitas entender mejor?
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <VideoSlot title="¿Qué es una declaración mensual?" duration="3 min" />
          <VideoSlot title="¿Qué pasa si no presento a tiempo?" duration="2 min" />
        </div>
      </div>
    </div>
  )
}
