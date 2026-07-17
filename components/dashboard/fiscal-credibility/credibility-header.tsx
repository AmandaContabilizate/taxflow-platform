import { DISPLAY } from '../constants'

interface StatusPillProps {
  dot: string
  bg: string
  border: string
  color: string
  label: string
}

function StatusPill({ dot, bg, border, color, label }: StatusPillProps) {
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-bold"
      style={{ background: bg, color, border: `1px solid ${border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />
      {label}
    </div>
  )
}

interface CredibilityHeaderProps {
  csfMissing: boolean
  csfErrored: boolean
  csfForbidden: boolean
  rfcNotFound: boolean
}

export function CredibilityHeader({ csfMissing, csfErrored, csfForbidden, rfcNotFound }: CredibilityHeaderProps) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-3 mb-1">
      <div>
        <div className="text-[20px] font-extrabold" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
          Tu credibilidad fiscal
        </div>
        <div className="text-[13.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
          Los documentos oficiales que te respaldan
        </div>
      </div>
      {csfMissing && (
        <StatusPill
          dot="var(--brand-500)"
          bg="var(--hero-info)"
          border="var(--hero-info-border)"
          color="var(--ink-700)"
          label="Falta tu CSF"
        />
      )}
      {csfErrored && (
        <StatusPill
          dot="#B8862C"
          bg="var(--hero-amber)"
          border="var(--hero-amber-border)"
          color="#7B5312"
          label="Servicio en pruebas"
        />
      )}
      {csfForbidden && (
        <StatusPill
          dot="#8B1E1E"
          bg="var(--danger-soft)"
          border="rgba(139,30,30,0.18)"
          color="#8B1E1E"
          label="Sin acceso"
        />
      )}
      {rfcNotFound && !csfMissing && !csfErrored && !csfForbidden && (
        <StatusPill
          dot="#9E3A15"
          bg="var(--coral-soft)"
          border="rgba(158,58,21,0.18)"
          color="#9E3A15"
          label="RFC no encontrado"
        />
      )}
    </div>
  )
}
