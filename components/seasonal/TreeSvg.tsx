import { useId } from 'react'

// Arbolito geométrico plano en paleta de marca (teal en tres tonos, estrella dorada, esferas
// dorado/morado/berry). Los focos tienen halo radial precalculado: lo único que se anima es su
// opacity (compositor), según el nivel de rendimiento vía [data-tier] en el contenedor.

const LIGHT_COLORS = ['#F2C76B', '#FFF4D6', '#7FF0D4', '#E0626B'] as const

// x, y, índice de color, duración (s), retraso (s): desfasados para que no parpadeen en sincronía.
const LIGHTS: Array<[number, number, number, number, number]> = [
  [24, 31.6, 0, 2.6, 0],
  [38.5, 31.2, 2, 3.2, 1.1],
  [19, 47.4, 1, 2.9, 0.6],
  [32, 50.4, 3, 3.6, 1.8],
  [45, 47.2, 0, 2.4, 0.3],
  [16.5, 62.2, 2, 3.4, 1.4],
  [32, 64.2, 1, 2.8, 0.9],
  [47.5, 61.4, 3, 3.1, 2.1],
]

const ORNAMENTS: Array<[number, number, string]> = [
  [25, 57.5, 'var(--season-gold)'],
  [41, 56, '#7339FD'],
  [38, 40.5, 'var(--season-berry)'],
  [26, 40, '#7339FD'],
  [32, 25.5, 'var(--season-gold)'],
]

export function TreeSvg() {
  const uid = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 64 80" width="100%" height="100%" aria-hidden focusable="false" className="block overflow-visible">
      <defs>
        {LIGHT_COLORS.map((c, i) => (
          <radialGradient key={c} id={`${uid}-halo-${i}`}>
            <stop offset="0%" stopColor={c} stopOpacity="0.95" />
            <stop offset="45%" stopColor={c} stopOpacity="0.35" />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>

      {/* Tronco */}
      <rect x="28.5" y="65" width="7" height="10" rx="1.5" fill="#8A6A4F" />

      {/* Ramas: de abajo hacia arriba, cada nivel más claro y encimado al anterior */}
      <polygon points="32,30 57,66 7,66" fill="#009B79" strokeLinejoin="round" stroke="#009B79" strokeWidth="2" />
      <polygon points="32,19 51,48 13,48" fill="#00AD87" strokeLinejoin="round" stroke="#00AD87" strokeWidth="2" />
      <polygon points="32,10 45,33 19,33" fill="#00C99A" strokeLinejoin="round" stroke="#00C99A" strokeWidth="2" />

      {/* Guirnaldas */}
      <g fill="none" stroke="var(--season-gold)" strokeOpacity="0.55" strokeWidth="0.6" strokeLinecap="round">
        <path d="M20,30.4 Q31,34.6 42.5,30" />
        <path d="M15.5,46 Q32,53 48.5,45.6" />
        <path d="M12,60.6 Q32,67 52.5,59.6" />
      </g>

      {/* Esferas */}
      {ORNAMENTS.map(([cx, cy, fill]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.3" fill={fill} />
      ))}

      {/* Focos: halo (animable) + punto */}
      {LIGHTS.map(([cx, cy, ci, dur, delay]) => (
        <g key={`${cx}-${cy}`}>
          <circle
            className="seasonal-light-halo"
            cx={cx}
            cy={cy}
            r="4.2"
            fill={`url(#${uid}-halo-${ci})`}
            style={{ ['--tw-dur' as string]: `${dur}s`, ['--tw-delay' as string]: `${delay}s` }}
          />
          <circle cx={cx} cy={cy} r="1.15" fill={LIGHT_COLORS[ci]} />
        </g>
      ))}

      {/* Estrella */}
      <polygon
        className="seasonal-star"
        points="32,1.6 33.53,5.9 37.9,6.1 34.47,8.8 35.6,13 32,10.6 28.4,13 29.53,8.8 26.1,6.1 30.47,5.9"
        fill="var(--season-gold)"
        stroke="var(--season-gold)"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function GiftSvg() {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden focusable="false" className="block">
      {/* Caja */}
      <rect x="3.5" y="10" width="17" height="11" rx="1.6" fill="#00AD87" />
      {/* Tapa */}
      <rect x="2.5" y="7" width="19" height="4.2" rx="1.2" fill="#00C99A" />
      {/* Listón */}
      <rect x="10.8" y="7" width="2.4" height="14" fill="var(--season-gold)" />
      {/* Moño */}
      <path
        d="M12 7 C9.5 3.2 6 4.4 7.4 6.6 C8.2 7.6 10.4 7.4 12 7 Z M12 7 C14.5 3.2 18 4.4 16.6 6.6 C15.8 7.6 13.6 7.4 12 7 Z"
        fill="var(--season-gold)"
      />
    </svg>
  )
}

/** Gorrito para la esquina del logo. */
export function HatSvg() {
  return (
    <svg viewBox="0 0 20 20" width="100%" height="100%" aria-hidden focusable="false" className="block">
      <path d="M3.5 14.5 C5 8 9 4.2 14.5 3.6 C13 6.4 13.4 10.4 16.5 14.5 Z" fill="var(--season-berry)" />
      {/* Contorno lavanda suave: sin él, el borde y el pompón blancos desaparecen sobre el sidebar claro. */}
      <rect x="2.6" y="13.6" width="14.8" height="3.6" rx="1.8" fill="#FFFFFF" stroke="#D9D3EC" strokeWidth="0.7" />
      <circle cx="15.2" cy="3.4" r="2.2" fill="#FFFFFF" stroke="#D9D3EC" strokeWidth="0.7" />
    </svg>
  )
}
