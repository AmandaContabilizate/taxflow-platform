import { Lock, Zap } from 'lucide-react'
import { DISPLAY } from '../constants'
import type { GoFn } from '../types'
import { Btn, HelpBox } from '../ui'

interface Props {
  go: GoFn
  feature: string
}

export function NeedsSatConnect({ go, feature }: Props) {
  return (
    <div className="flex flex-col gap-5 max-w-[640px]">
      <div
        className="rounded-3xl p-7"
        style={{ background: 'var(--hero-info)', border: '1px solid var(--hero-info-border)' }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: 'var(--hero-info-icon-bg)' }}
        >
          <Lock color="#fff" size={26} />
        </div>
        <div className="text-[26px] font-extrabold tracking-tight mt-4" style={DISPLAY}>
          Primero conectemos con el SAT
        </div>
        <div className="text-[14.5px] mt-3 leading-relaxed" style={{ color: 'var(--ink-700)' }}>
          Para poder {feature}, necesitamos tu permiso para conectarnos al SAT. Es rápido y solo lo haces una vez.
        </div>
        <div className="mt-5">
          <Btn kind="brand" size="lg" onClick={() => go('estatus-sat')}>
            <Zap size={18} /> Conectar ahora
          </Btn>
        </div>
      </div>
      <HelpBox>Tus datos se guardan cifrados. No los compartimos con nadie ni los vemos en texto plano.</HelpBox>
    </div>
  )
}
