import { AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'
import type { GoFn } from '../types'

interface Props {
  go: GoFn
  /**
   * 'efirma': CIEC inválida pero entra por e.firma. 'unverified': CIEC (0) validándose, D1.
   * 'constancia': entra a comprar con la constancia que subió; su CIEC sigue sin confirmar.
   */
  variant?: 'efirma' | 'unverified' | 'constancia'
}

const COPY: Record<NonNullable<Props['variant']>, { text: ReactNode; cta?: string }> = {
  efirma: {
    text: (
      <>
        <strong>Tu contraseña del SAT (CIEC) dejó de funcionar.</strong> Lo que ves aquí puede estar
        desactualizado; en cuanto la renueves volvemos a traer tus datos del SAT.
      </>
    ),
    cta: 'Actualiza tu CIEC',
  },
  unverified: {
    text: (
      <>
        <strong>Estamos validando tu CIEC, espera.</strong> No es algo que tengas que arreglar: en cuanto el
        SAT confirme tu contraseña, esta sección se actualiza sola.
      </>
    ),
  },
  constancia: {
    text: (
      <>
        <strong>Estás usando la constancia que subiste.</strong> Tu régimen ya está documentado y puedes
        contratar. En cuanto el SAT responda confirmaremos tu información automáticamente; si algo no
        coincide, te avisamos.
      </>
    ),
  },
}

/** Aviso persistente por estado de CIEC. Reutilizado por las 9 pantallas (E1). */
export function CiecWarningBanner({ go, variant = 'efirma' }: Props) {
  const { text, cta } = COPY[variant]
  return (
    <div
      className="rounded-2xl p-4 flex items-start gap-3"
      style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)', border: '1px solid var(--border)' }}
    >
      <AlertTriangle size={18} className="mt-0.5 shrink-0" />
      <div className="text-[13.5px] leading-relaxed">
        {text}
        {cta && (
          <>
            {' '}
            <button className="underline font-semibold" onClick={() => go('estatus-sat')}>
              {cta}
            </button>
            .
          </>
        )}
      </div>
    </div>
  )
}
