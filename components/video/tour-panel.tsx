'use client'

/**
 * "Tour rápido por tu panel" — video vertical (1080x1920, 30 fps, ~69 s) con voz.
 *
 * Identidad (Manual Contabilízate 2023):
 * - Paleta: Medium Spring Green #06FF94 · Caribbean Green #00D3A1 · Persian Green #00AD87
 *           Blue-Violet #7339FD · Russian Violet #221158
 * - Portada/cierre: degradado verde→violeta (como la portada del manual); interiores en
 *   Russian Violet. Logo SIEMPRE monocromático (blanco), nunca con degradado encima.
 * - Tipografía: encabezados con la display de la app (fallback de Basic Sans), textos sans.
 *
 * Animación (criterio Emil): entradas con spring sin rebote exagerado, ease-out fuerte,
 * stagger corto en listas, nada aparece desde scale(0).
 */

import { Audio } from '@remotion/media'
import { AbsoluteFill, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'

export const TOUR_FPS = 30

const C = {
  spring: '#06FF94',
  caribbean: '#00D3A1',
  persian: '#00AD87',
  violet: '#7339FD',
  russian: '#221158',
  white: '#FFFFFF',
} as const

const FONT_DISPLAY = "'Basic Sans', var(--font-display), 'Segoe UI', system-ui, sans-serif"
const FONT_BODY = "'Assistant', var(--font-sans), 'Segoe UI', system-ui, sans-serif"

/**
 * Locución generada con gTTS (Google Translate TTS, es) — el mismo motor que
 * welcome-voice.mp3, para que ambos videos suenen con la misma voz.
 * Duración por escena (frames a 30fps) = audio real + 1 s de respiro.
 * Al reemplazar la locución, recalcular con scratchpad/gen-voz-gtts.ps1,
 * que imprime los frames de cada pista.
 */
const SCENES = [
  { voz: 'videos/tour/voz-1.mp3', frames: 240 }, // 1 Portada           (7s audio)
  { voz: 'videos/tour/voz-2.mp3', frames: 300 }, // 2 Inicio            (9s)
  { voz: 'videos/tour/voz-3.mp3', frames: 360 }, // 3 Vista fiscal      (11s)
  { voz: 'videos/tour/voz-4.mp3', frames: 240 }, // 4 Declaraciones     (7s)
  { voz: 'videos/tour/voz-5.mp3', frames: 300 }, // 5 Facturas + Bóveda (9s)
  { voz: 'videos/tour/voz-6.mp3', frames: 210 }, // 6 Estatus SAT       (6s)
  { voz: 'videos/tour/voz-7.mp3', frames: 330 }, // 7 Cierre            (10s)
] as const

export const TOUR_DURATION_FRAMES = SCENES.reduce((a, s) => a + s.frames, 0)

/* ============================== Bloques base ============================== */

/** Logo Cz monocromático (blanco por default), fiel al manual: C gruesa + z. */
function LogoCz({ size = 200, color = C.white }: { size?: number; color?: string }) {
  // La C: arco de ~300° con puntas redondeadas, abertura hacia la derecha.
  const r = 40
  const stroke = 24
  const circumference = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{ display: 'block' }}>
      <circle
        cx="52"
        cy="60"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${circumference * 0.78} ${circumference}`}
        transform="rotate(48 52 60)"
      />
      <text
        x="96"
        y="74"
        fontFamily={FONT_DISPLAY}
        fontWeight={900}
        fontSize="34"
        fill={color}
        textAnchor="middle"
      >
        z
      </text>
    </svg>
  )
}

/** Entrada estándar: fade + subida corta con spring (sin partir de scale 0). */
function useEnter(delay = 0) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = spring({ frame: frame - delay, fps, config: { damping: 200 } })
  return {
    opacity: s,
    transform: `translateY(${interpolate(s, [0, 1], [28, 0])}px) scale(${interpolate(s, [0, 1], [0.96, 1])})`,
  }
}

/** Salida al final de la escena (últimos 12 frames). */
function useExit(sceneFrames: number) {
  const frame = useCurrentFrame()
  return interpolate(frame, [sceneFrames - 12, sceneFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function Kicker({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const st = useEnter(delay)
  return (
    <div
      style={{
        ...st,
        fontFamily: FONT_BODY,
        fontWeight: 800,
        fontSize: 30,
        letterSpacing: 6,
        textTransform: 'uppercase',
        color: C.spring,
      }}
    >
      {children}
    </div>
  )
}

function Title({ children, delay = 4, size = 96 }: { children: React.ReactNode; delay?: number; size?: number }) {
  const st = useEnter(delay)
  return (
    <div
      style={{
        ...st,
        fontFamily: FONT_DISPLAY,
        fontWeight: 900,
        fontSize: size,
        lineHeight: 1.05,
        letterSpacing: -2,
        color: C.white,
      }}
    >
      {children}
    </div>
  )
}

function Sub({ children, delay = 8 }: { children: React.ReactNode; delay?: number }) {
  const st = useEnter(delay)
  return (
    <div
      style={{
        ...st,
        fontFamily: FONT_BODY,
        fontWeight: 500,
        fontSize: 40,
        lineHeight: 1.35,
        color: 'rgba(255,255,255,0.75)',
        maxWidth: 780,
      }}
    >
      {children}
    </div>
  )
}

/** Tarjeta blanca simulando UI del panel. */
function MockCard({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const st = useEnter(delay)
  return (
    <div
      style={{
        ...st,
        background: C.white,
        borderRadius: 36,
        padding: '36px 40px',
        boxShadow: '0 30px 60px rgba(0,0,0,0.35)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function CheckDot({ size = 40 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: 'rgba(0,173,135,0.14)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" stroke={C.persian} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    </div>
  )
}

/** Renglón de lista simulado: check + barras de "texto". */
function MockRow({ delay = 0, w1 = 260, w2 = 150, pill, pillBg = 'rgba(0,173,135,0.14)', pillFg = C.persian }: {
  delay?: number; w1?: number; w2?: number; pill?: string; pillBg?: string; pillFg?: string
}) {
  const st = useEnter(delay)
  return (
    <div style={{ ...st, display: 'flex', alignItems: 'center', gap: 24, padding: '22px 0' }}>
      <CheckDot />
      <div style={{ flex: 1 }}>
        <div style={{ height: 20, width: w1, borderRadius: 10, background: '#2A2547', opacity: 0.85 }} />
        <div style={{ height: 14, width: w2, borderRadius: 7, background: '#B9B4D6', marginTop: 12 }} />
      </div>
      {pill && (
        <div
          style={{
            fontFamily: FONT_BODY,
            fontWeight: 800,
            fontSize: 26,
            color: pillFg,
            background: pillBg,
            borderRadius: 999,
            padding: '10px 26px',
            whiteSpace: 'nowrap',
          }}
        >
          {pill}
        </div>
      )}
    </div>
  )
}

/** Aro de score (verde de marca). */
function ScoreRing({ delay = 0 }: { delay?: number }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames: 45 })
  const r = 70
  const circ = 2 * Math.PI * r
  return (
    <div style={{ position: 'relative', width: 190, height: 190, opacity: s }}>
      <svg width="190" height="190" viewBox="0 0 190 190">
        <circle cx="95" cy="95" r={r} fill="none" stroke="rgba(34,17,88,0.10)" strokeWidth="18" />
        <circle
          cx="95" cy="95" r={r} fill="none"
          stroke={C.caribbean} strokeWidth="18" strokeLinecap="round"
          strokeDasharray={`${circ * s} ${circ}`}
          transform="rotate(-90 95 95)"
        />
      </svg>
      <div
        style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: FONT_DISPLAY, fontWeight: 900, color: C.russian,
        }}
      >
        <div style={{ fontSize: 54 }}>{Math.round(100 * s)}</div>
        <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 22, color: C.persian }}>score</div>
      </div>
    </div>
  )
}

/** Layout común de escena interior: kicker + título + sub + mock, sobre Russian Violet. */
function Escena({
  frames, kicker, titulo, sub, children,
}: {
  frames: number; kicker: string; titulo: string; sub: string; children: React.ReactNode
}) {
  const exit = useExit(frames)
  return (
    <AbsoluteFill style={{ background: C.russian, opacity: exit }}>
      {/* Resplandor sutil de marca, arriba a la derecha */}
      <div
        style={{
          position: 'absolute', top: -300, right: -300, width: 900, height: 900, borderRadius: 450,
          background: `radial-gradient(circle, ${C.violet}33, transparent 65%)`,
        }}
      />
      <div style={{ position: 'absolute', inset: 0, padding: '150px 90px', display: 'flex', flexDirection: 'column', gap: 34 }}>
        <Kicker>{kicker}</Kicker>
        <Title>{titulo}</Title>
        <Sub>{sub}</Sub>
        <div style={{ marginTop: 40 }}>{children}</div>
      </div>
    </AbsoluteFill>
  )
}

/* ============================== Escenas ============================== */

function EscenaPortada({ frames }: { frames: number }) {
  const exit = useExit(frames)
  const logo = useEnter(0)
  return (
    <AbsoluteFill
      style={{
        // Portada del manual: degradado verde → violeta
        background: `linear-gradient(135deg, ${C.persian} 0%, #2E6FD8 45%, ${C.violet} 100%)`,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: exit,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>
        <div style={logo}>
          <LogoCz size={300} />
        </div>
        <Title delay={8} size={104}>Tour por tu panel</Title>
        <Sub delay={14}>Todo lo que Contabilízate hace por ti, en un minuto</Sub>
      </div>
    </AbsoluteFill>
  )
}

function EscenaInicio({ frames }: { frames: number }) {
  return (
    <Escena frames={frames} kicker="Inicio" titulo="Tu resumen del día" sub="Constancia, opinión de cumplimiento y tu score fiscal — de un vistazo.">
      <MockCard delay={12}>
        <MockRow delay={14} pill="Lista" />
        <div style={{ height: 2, background: 'rgba(34,17,88,0.08)' }} />
        <MockRow delay={18} w1={300} w2={180} pill="Lista" />
      </MockCard>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -60, marginRight: 40 }}>
        <MockCard delay={24} style={{ borderRadius: 999, padding: 28 }}>
          <ScoreRing delay={28} />
        </MockCard>
      </div>
    </Escena>
  )
}

function EscenaVistaFiscal({ frames }: { frames: number }) {
  return (
    <Escena frames={frames} kicker="Vista fiscal" titulo="Tu vida fiscal en un solo lugar" sub="Tu régimen, tu razón social y tus herramientas, siempre a la mano.">
      <MockCard delay={12}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div
            style={{
              width: 84, height: 84, borderRadius: 24, flexShrink: 0,
              background: 'rgba(115,57,253,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={C.violet} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ height: 22, width: 380, borderRadius: 11, background: '#2A2547' }} />
            <div style={{ height: 15, width: 240, borderRadius: 8, background: '#B9B4D6', marginTop: 14 }} />
          </div>
        </div>
      </MockCard>
      <div style={{ display: 'flex', gap: 28, marginTop: 28 }}>
        {[0, 1, 2].map((i) => (
          <MockCard key={i} delay={20 + i * 5} style={{ flex: 1, padding: '30px 28px' }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(0,173,135,0.14)', marginBottom: 20 }} />
            <div style={{ height: 16, width: '80%', borderRadius: 8, background: '#2A2547' }} />
          </MockCard>
        ))}
      </div>
    </Escena>
  )
}

function EscenaDeclaraciones({ frames }: { frames: number }) {
  return (
    <Escena frames={frames} kicker="Declaraciones" titulo="Tus impuestos, mes con mes" sub="Tu contador las prepara. Tú solo revisas y autorizas.">
      <MockCard delay={12}>
        <MockRow delay={14} pill="Presentada" />
        <div style={{ height: 2, background: 'rgba(34,17,88,0.08)' }} />
        <MockRow delay={19} w1={230} pill="Presentada" />
        <div style={{ height: 2, background: 'rgba(34,17,88,0.08)' }} />
        <MockRow delay={24} w1={280} w2={190} pill="En curso" pillBg="rgba(115,57,253,0.12)" pillFg={C.violet} />
      </MockCard>
    </Escena>
  )
}

function EscenaFacturas({ frames }: { frames: number }) {
  return (
    <Escena frames={frames} kicker="Facturación · Bóveda" titulo="Factura y guarda todo" sub="Emite tus CFDI y encuentra cada documento en tu bóveda digital.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <MockCard delay={12}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(6,255,148,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke={C.persian} strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            </div>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 38, color: C.russian }}>Nueva factura</div>
          </div>
        </MockCard>
        <MockCard delay={20}>
          <div style={{ display: 'flex', gap: 22 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ flex: 1, height: 130, borderRadius: 20, background: i === 0 ? 'rgba(115,57,253,0.12)' : 'rgba(34,17,88,0.06)' }} />
            ))}
          </div>
          <div style={{ height: 16, width: 300, borderRadius: 8, background: '#B9B4D6', marginTop: 24 }} />
        </MockCard>
      </div>
    </Escena>
  )
}

function EscenaEstatus({ frames }: { frames: number }) {
  return (
    <Escena frames={frames} kicker="Estatus SAT" titulo="Te cuidamos las espaldas" sub="Revisamos listas y cumplimiento todos los días. Si algo cambia, te avisamos.">
      <MockCard delay={12} style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
        <div style={{ width: 96, height: 96, borderRadius: 28, background: 'rgba(0,211,161,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke={C.persian} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 44, color: C.russian }}>Estatus limpio</div>
          <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 28, color: '#6E679B', marginTop: 8 }}>Sin alertas en listas del SAT</div>
        </div>
      </MockCard>
    </Escena>
  )
}

function EscenaCierre({ frames }: { frames: number }) {
  const exit = useExit(frames)
  const logo = useEnter(0)
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${C.persian} 0%, #2E6FD8 45%, ${C.violet} 100%)`,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: exit,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 44, padding: '0 90px', textAlign: 'center' }}>
        <div style={logo}>
          <LogoCz size={240} />
        </div>
        <Title delay={8} size={92}>Estamos contigo</Title>
        <Sub delay={14}>Tu plan, tu contador y tus dudas resueltas por chat — todo desde tu panel.</Sub>
        <div style={{ ...useEnter(22), fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 52, color: C.white, letterSpacing: -1 }}>
          contabilízate
        </div>
      </div>
    </AbsoluteFill>
  )
}

/* ============================== Composición ============================== */

const SCENE_COMPONENTS = [
  EscenaPortada,
  EscenaInicio,
  EscenaVistaFiscal,
  EscenaDeclaraciones,
  EscenaFacturas,
  EscenaEstatus,
  EscenaCierre,
] as const

export function TourPanelVideo() {
  const frame = useCurrentFrame()
  let from = 0
  return (
    <AbsoluteFill style={{ background: C.russian }}>
      {SCENES.map((scene, i) => {
        const Comp = SCENE_COMPONENTS[i]
        const seq = (
          <Sequence key={i} from={from} durationInFrames={scene.frames}>
            <Comp frames={scene.frames} />
            <Audio src={staticFile(scene.voz)} />
          </Sequence>
        )
        from += scene.frames
        return seq
      })}

      {/* Barra de progreso (verde de marca, lineal — es constante, no expresiva) */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 14, background: 'rgba(255,255,255,0.12)' }}>
        <div
          style={{
            height: '100%',
            width: `${(frame / TOUR_DURATION_FRAMES) * 100}%`,
            background: C.spring,
          }}
        />
      </div>
    </AbsoluteFill>
  )
}
