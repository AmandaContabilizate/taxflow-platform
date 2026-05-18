import { Check, FileText, Lock, MessageCircle, Sparkles, Stethoscope } from 'lucide-react'
import { DISPLAY } from '../constants'
import { Badge, Btn, Card, Divider, HelpBox, Pill, VideoSlot } from '../ui'

export function PlanScreen() {
  const incluye = [
    { i: Sparkles, t: '6 declaraciones al mes con apoyo de IA', s: 'Llevas 2 usadas este mes' },
    { i: FileText, t: '300 facturas (CFDI) por semestre', s: 'Has emitido 24' },
    { i: MessageCircle, t: 'Chat ilimitado con tu contador', s: 'Te responden en menos de 2 horas' },
    { i: Lock, t: 'Monitoreo de listas negras del SAT', s: 'Vigilamos tu RFC todo el día' },
    { i: Stethoscope, t: 'Diagnóstico fiscal con IA', s: 'Te avisamos cuando puedes ahorrar' },
  ]

  return (
    <div className="flex flex-col gap-6 max-w-[1040px]">
      <HelpBox>
        Aquí ves tu suscripción, qué tienes incluido y cómo cambiar de plan. Si quieres cancelar o pausar, también lo
        haces desde aquí.
      </HelpBox>

      <div
        className="rounded-3xl p-7 lg:p-8 text-white"
        style={{ background: 'linear-gradient(155deg,#1E1952 0%,#15113F 100%)', boxShadow: 'var(--sh-ink)' }}
      >
        <Pill kind="coral">Tu plan actual</Pill>
        <div className="text-[44px] lg:text-[56px] font-extrabold tracking-tight leading-none mt-4" style={DISPLAY}>
          Platinum
        </div>
        <div className="text-[14px] mt-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
          Pago mensual · se renueva el 28 de abril 2026
        </div>
        <div
          className="mt-5 pt-5 flex items-center justify-between flex-wrap gap-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}
        >
          <div>
            <div
              className="text-[11.5px] font-extrabold uppercase tracking-wider"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              Próximo cargo
            </div>
            <div className="text-[32px] font-extrabold tracking-tight mt-1" style={DISPLAY}>
              $470<span className="text-[18px]" style={{ color: 'rgba(255,255,255,0.6)' }}>.25</span>
            </div>
            <div className="text-[12.5px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Pesos · IVA incluido
            </div>
          </div>
          <Btn size="md" style={{ background: '#fff', color: 'var(--ink-900)', boxShadow: 'none' }}>
            Cambiar método de pago
          </Btn>
        </div>
      </div>

      <div>
        <div className="text-[18px] font-bold mb-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
          Lo que incluye tu plan
        </div>
        <div className="text-[13.5px] mb-4" style={{ color: 'var(--ink-500)' }}>
          Todo esto ya está cubierto sin que pagues extra.
        </div>
        <Card>
          <div>
            {incluye.map((it, i, arr) => (
              <div key={it.t}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--brand-50)', color: 'var(--brand-700)' }}
                  >
                    <it.i size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14.5px]">{it.t}</div>
                    <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                      {it.s}
                    </div>
                  </div>
                  <Check size={18} color="var(--brand-500)" />
                </div>
                {i < arr.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div
        className="rounded-3xl p-6 lg:p-7"
        style={{
          background: 'linear-gradient(160deg,var(--coral-soft) 0%,#FFFAF4 100%)',
          border: '1px solid rgba(255,136,98,0.35)',
        }}
      >
        <div className="flex items-center gap-3 flex-wrap mb-3">
          <Badge kind="coral">Te ahorras 47%</Badge>
        </div>
        <div className="text-[26px] font-extrabold tracking-tight" style={DISPLAY}>
          ¿Y si pagas 6 meses de una vez?
        </div>
        <div className="text-[14px] mt-2 max-w-[520px] leading-relaxed" style={{ color: 'var(--ink-700)' }}>
          En vez de pagar $470.25 cada mes (= $2,821.50 al semestre), pagas <strong>$1,495 una sola vez</strong> y
          olvidas el cargo por 6 meses.
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Btn kind="primary" size="lg">
            Cambiar a plan semestral
          </Btn>
          <Btn kind="ghost" size="lg">
            Comparar planes
          </Btn>
        </div>
      </div>

      <Btn block kind="ghost" style={{ color: '#B01F1F' }}>
        Cancelar mi suscripción
      </Btn>

      <VideoSlot title="¿Qué cubre cada plan?" duration="2 min" />
    </div>
  )
}
