import { AbsoluteFill, useCurrentFrame, interpolate, Easing, staticFile } from 'remotion'
import { Audio } from '@remotion/media'

export const WelcomeVideo = () => {
  const frame = useCurrentFrame()

  // Background
  const bgOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // ===== SCENE 1: TITLE =====
  const scene1In = interpolate(frame, [20, 80], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })

  const scene1Out = interpolate(frame, [240, 290], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  })

  const scene1Opacity = Math.min(scene1In, scene1Out)
  const scene1Scale = interpolate(frame, [20, 80], [0.5, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })

  const scene1Rotate = interpolate(frame, [20, 80], [-15, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })

  // ===== SCENE 2: DASHBOARD MAIN =====
  const scene2In = interpolate(frame, [260, 330], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })

  const scene2Out = interpolate(frame, [490, 540], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  })

  const scene2Opacity = Math.min(scene2In, scene2Out)
  const scene2Y = interpolate(frame, [260, 330], [100, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })

  const scene2Rotate = interpolate(frame, [260, 330], [10, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })

  // ===== SCENE 3: CREDIBILITY =====
  const scene3In = interpolate(frame, [540, 610], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })

  const scene3Out = interpolate(frame, [750, 800], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  })

  const scene3Opacity = Math.min(scene3In, scene3Out)
  const scene3Y = interpolate(frame, [540, 610], [100, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })

  const scene3Rotate = interpolate(frame, [540, 610], [-10, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })

  // ===== SCENE 4: MIS DECLARACIONES =====
  const scene4In = interpolate(frame, [800, 870], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })

  const scene4Out = interpolate(frame, [1050, 1100], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  })

  const scene4Opacity = Math.min(scene4In, scene4Out)
  const scene4Y = interpolate(frame, [800, 870], [100, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })

  const scene4Rotate = interpolate(frame, [800, 870], [8, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })

  // ===== SCENE 5: LANDING PAGE =====
  const scene5In = interpolate(frame, [1080, 1150], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })

  const scene5Opacity = interpolate(frame, [1080, 1150], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const scene5Rotate = interpolate(frame, [1080, 1150], [-12, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })

  // Glow effect
  const glowOpacity = interpolate(frame % 60, [0, 30, 60], [0.5, 1, 0.5], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Background shapes
  const shape1Rotate = interpolate(frame, [0, 1200], [0, 360], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Particle animations - Slower, longer cycle
  const particle1Y = interpolate(frame % 600, [0, 600], [0, 1920], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const particle2Y = interpolate((frame + 75) % 600, [0, 600], [0, 1920], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const particle3Y = interpolate((frame + 150) % 600, [0, 600], [0, 1920], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const particle4Y = interpolate((frame + 225) % 600, [0, 600], [0, 1920], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const particle5Y = interpolate((frame + 300) % 600, [0, 600], [0, 1920], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const particle6Y = interpolate((frame + 375) % 600, [0, 600], [0, 1920], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const particle7Y = interpolate((frame + 450) % 600, [0, 600], [0, 1920], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const particle8Y = interpolate((frame + 525) % 600, [0, 600], [0, 1920], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill>
      {/* Audio */}
      <Audio src={staticFile('welcome-voice.mp3')} volume={1} />

      {/* Background gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, #120A33 0%, #1A0F47 25%, #221158 50%, #332670 75%, #1A0F47 100%)',
          opacity: bgOpacity,
        }}
      />

      {/* Animated background shapes */}
      <svg
        width={1080}
        height={1920}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.15,
        }}
      >
        <circle
          cx={100}
          cy={200}
          r={200}
          fill="none"
          stroke="rgba(0,173,135, 0.3)"
          strokeWidth={2}
          style={{
            transform: `rotate(${shape1Rotate}deg)`,
            transformOrigin: '100px 200px',
          }}
        />
      </svg>

      {/* Falling particles - Snow effect */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.4,
          pointerEvents: 'none',
        }}
      >
        {/* Stream 1 - Left */}
        <div style={{ position: 'absolute', left: '8%', width: '6px', height: '6px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,173,135, 0.9), transparent)', filter: 'blur(0.8px)', top: `${particle1Y}px` }} />
        <div style={{ position: 'absolute', left: '8%', width: '5px', height: '5px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,173,135, 0.7), transparent)', filter: 'blur(1px)', top: `${particle2Y}px` }} />
        <div style={{ position: 'absolute', left: '8%', width: '4px', height: '4px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,173,135, 0.6), transparent)', filter: 'blur(0.5px)', top: `${particle3Y}px` }} />
        <div style={{ position: 'absolute', left: '8%', width: '5px', height: '5px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,173,135, 0.5), transparent)', filter: 'blur(1.2px)', top: `${particle4Y}px` }} />

        {/* Stream 2 - Left-Center */}
        <div style={{ position: 'absolute', left: '22%', width: '6px', height: '6px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,173,135, 0.8), transparent)', filter: 'blur(0.8px)', top: `${particle2Y}px` }} />
        <div style={{ position: 'absolute', left: '22%', width: '5px', height: '5px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,173,135, 0.6), transparent)', filter: 'blur(1px)', top: `${particle3Y}px` }} />
        <div style={{ position: 'absolute', left: '22%', width: '4px', height: '4px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,173,135, 0.7), transparent)', filter: 'blur(0.5px)', top: `${particle4Y}px` }} />
        <div style={{ position: 'absolute', left: '22%', width: '5px', height: '5px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,173,135, 0.5), transparent)', filter: 'blur(1.2px)', top: `${particle5Y}px` }} />

        {/* Stream 3 - Center */}
        <div style={{ position: 'absolute', left: '37%', width: '6px', height: '6px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,173,135, 0.85), transparent)', filter: 'blur(0.8px)', top: `${particle3Y}px` }} />
        <div style={{ position: 'absolute', left: '37%', width: '5px', height: '5px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,173,135, 0.65), transparent)', filter: 'blur(1px)', top: `${particle4Y}px` }} />
        <div style={{ position: 'absolute', left: '37%', width: '4px', height: '4px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,173,135, 0.6), transparent)', filter: 'blur(0.5px)', top: `${particle5Y}px` }} />
        <div style={{ position: 'absolute', left: '37%', width: '5px', height: '5px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,173,135, 0.5), transparent)', filter: 'blur(1.2px)', top: `${particle6Y}px` }} />

        {/* Stream 4 - Right-Center */}
        <div style={{ position: 'absolute', left: '52%', width: '6px', height: '6px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,173,135, 0.8), transparent)', filter: 'blur(0.8px)', top: `${particle4Y}px` }} />
        <div style={{ position: 'absolute', left: '52%', width: '5px', height: '5px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,173,135, 0.6), transparent)', filter: 'blur(1px)', top: `${particle5Y}px` }} />
        <div style={{ position: 'absolute', left: '52%', width: '4px', height: '4px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,173,135, 0.7), transparent)', filter: 'blur(0.5px)', top: `${particle6Y}px` }} />
        <div style={{ position: 'absolute', left: '52%', width: '5px', height: '5px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,173,135, 0.5), transparent)', filter: 'blur(1.2px)', top: `${particle7Y}px` }} />

        {/* Stream 5 - Right */}
        <div style={{ position: 'absolute', left: '67%', width: '6px', height: '6px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,173,135, 0.9), transparent)', filter: 'blur(0.8px)', top: `${particle5Y}px` }} />
        <div style={{ position: 'absolute', left: '67%', width: '5px', height: '5px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,173,135, 0.7), transparent)', filter: 'blur(1px)', top: `${particle6Y}px` }} />
        <div style={{ position: 'absolute', left: '67%', width: '4px', height: '4px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,173,135, 0.6), transparent)', filter: 'blur(0.5px)', top: `${particle7Y}px` }} />
        <div style={{ position: 'absolute', left: '67%', width: '5px', height: '5px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,173,135, 0.5), transparent)', filter: 'blur(1.2px)', top: `${particle8Y}px` }} />

        {/* Stream 6 - Far Right */}
        <div style={{ position: 'absolute', left: '82%', width: '6px', height: '6px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,173,135, 0.85), transparent)', filter: 'blur(0.8px)', top: `${particle6Y}px` }} />
        <div style={{ position: 'absolute', left: '82%', width: '5px', height: '5px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,173,135, 0.65), transparent)', filter: 'blur(1px)', top: `${particle7Y}px` }} />
        <div style={{ position: 'absolute', left: '82%', width: '4px', height: '4px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,173,135, 0.6), transparent)', filter: 'blur(0.5px)', top: `${particle8Y}px` }} />
        <div style={{ position: 'absolute', left: '82%', width: '5px', height: '5px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,173,135, 0.5), transparent)', filter: 'blur(1.2px)', top: `${particle1Y}px` }} />

        {/* Stream 7 - Extra dense left */}
        <div style={{ position: 'absolute', left: '15%', width: '5px', height: '5px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,173,135, 0.7), transparent)', filter: 'blur(0.8px)', top: `${particle7Y}px` }} />
        <div style={{ position: 'absolute', left: '15%', width: '4px', height: '4px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,173,135, 0.5), transparent)', filter: 'blur(1px)', top: `${particle8Y}px` }} />

        {/* Stream 8 - Extra dense center */}
        <div style={{ position: 'absolute', left: '45%', width: '5px', height: '5px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,173,135, 0.7), transparent)', filter: 'blur(0.8px)', top: `${particle8Y}px` }} />
        <div style={{ position: 'absolute', left: '45%', width: '4px', height: '4px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,173,135, 0.5), transparent)', filter: 'blur(1px)', top: `${particle1Y}px` }} />

        {/* Stream 9 - Extra dense right */}
        <div style={{ position: 'absolute', left: '75%', width: '5px', height: '5px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,173,135, 0.7), transparent)', filter: 'blur(0.8px)', top: `${particle1Y}px` }} />
        <div style={{ position: 'absolute', left: '75%', width: '4px', height: '4px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,173,135, 0.5), transparent)', filter: 'blur(1px)', top: `${particle2Y}px` }} />
      </div>

      {/* ===== SCENE 1: TITLE ===== */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: scene1Opacity,
          zIndex: 10,
        }}
      >
        <div
          style={{
            transform: `scale(${scene1Scale}) rotateZ(${scene1Rotate}deg)`,
            textAlign: 'center',
            transformOrigin: 'center',
          }}
        >
          <div
            style={{
              fontSize: '56px',
              fontWeight: '900',
              color: 'white',
              lineHeight: '1.1',
              letterSpacing: '-2px',
              marginBottom: '12px',
              textShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
            }}
          >
            Tu contador
            <br />
            <span style={{ background: 'linear-gradient(135deg, #00AD87 0%, #00AD87 100%)', backgroundClip: 'text', color: 'transparent', WebkitBackgroundClip: 'text' }}>
              digital
            </span>
          </div>
          <div
            style={{
              fontSize: '20px',
              color: '#D2CDE9',
              fontWeight: '500',
            }}
          >
            Contabilidad fácil y confiable
          </div>
        </div>
      </div>

      {/* ===== SCENE 2: DASHBOARD MAIN ===== */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: scene2Opacity,
          zIndex: 10,
          padding: '40px',
        }}
      >
        <div
          style={{
            transform: `translateY(${scene2Y}px) rotateZ(${scene2Rotate}deg)`,
            background: 'linear-gradient(135deg, #1A0F47 0%, #221158 100%)',
            borderRadius: '28px',
            padding: '28px',
            color: 'white',
            boxShadow: `0 40px 100px rgba(0,173,135, ${glowOpacity * 0.3}), 0 20px 60px rgba(0, 0, 0, 0.3)`,
            border: '1px solid rgba(0,173,135, 0.2)',
            maxWidth: '600px',
            width: '100%',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                display: 'inline-block',
                background: 'rgba(0,173,135, 0.15)',
                border: '1px solid rgba(0,173,135, 0.4)',
                color: '#00AD87',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '700',
                letterSpacing: '0.5px',
              }}
            >
              ● SAT SINCRONIZADO
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', marginBottom: '28px' }}>
            <svg width="100" height="100" style={{ minWidth: '100px' }}>
              <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(0,173,135, 0.2)" strokeWidth="3" />
              <circle
                cx="50"
                cy="50"
                r="35"
                fill="none"
                stroke="url(#scoreGradient)"
                strokeWidth="3"
                strokeDasharray={2 * Math.PI * 35}
                strokeDashoffset={2 * Math.PI * 35}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7339FD" />
                  <stop offset="100%" stopColor="#E84D4D" />
                </linearGradient>
              </defs>
              <text x="50" y="55" textAnchor="middle" fontSize="24" fontWeight="bold" fill="white">
                0
              </text>
              <text x="50" y="72" textAnchor="middle" fontSize="11" fill="#857AC0">
                /100
              </text>
            </svg>

            <div>
              <div style={{ fontSize: '11px', color: '#D2CDE9', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '6px' }}>
                TU SCORE FISCAL
              </div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: 'white', lineHeight: '1.2' }}>
                Necesita
                <br />
                atención
              </div>
              <div style={{ fontSize: '12px', color: '#857AC0', marginTop: '8px', lineHeight: '1.5' }}>
                Suma +100 pts regularizando 1 declaración
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'linear-gradient(135deg, rgba(0,173,135, 0.1) 0%, rgba(0,173,135, 0.05) 100%)',
              border: '1.5px solid rgba(0,173,135, 0.3)',
              borderRadius: '20px',
              padding: '18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '10px', color: '#D2CDE9', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '4px' }}>
                📋 TU ACCIÓN DE HOY
              </div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: 'white' }}>
                Regulariza tus
                <br />
                declaraciones
              </div>
            </div>
            <div
              style={{
                background: 'linear-gradient(135deg, #00AD87 0%, #00AD87 100%)',
                color: 'white',
                padding: '10px 18px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '700',
                boxShadow: '0 8px 20px rgba(0,173,135, 0.4)',
              }}
            >
              Ver →
            </div>
          </div>
        </div>
      </div>

      {/* ===== SCENE 3: CREDIBILITY ===== */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: scene3Opacity,
          zIndex: 10,
          padding: '40px',
        }}
      >
        <div
          style={{
            transform: `translateY(${scene3Y}px) rotateZ(${scene3Rotate}deg)`,
            width: '100%',
            maxWidth: '600px',
          }}
        >
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '20px', fontWeight: '900', color: 'white', marginBottom: '4px' }}>
              Tu credibilidad fiscal
            </div>
            <div style={{ fontSize: '13px', color: '#D2CDE9' }}>
              Los documentos oficiales que te respaldan
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {[
              { icon: '✓', title: 'CONSTANCIA', subtitle: 'Lista', date: '28 julio' },
              { icon: '📋', title: 'OPINIÓN', subtitle: 'Para consultar', date: 'Oficial SAT' },
            ].map((card, i) => (
              <div
                key={i}
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #F6F5FB 100%)',
                  borderRadius: '16px',
                  padding: '16px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(0,173,135, 0.1)',
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{card.icon}</div>
                <div style={{ fontSize: '10px', color: '#5D50A5', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '4px' }}>
                  {card.title}
                </div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#221158' }}>
                  {card.subtitle}
                </div>
                <div style={{ fontSize: '10px', color: '#857AC0', marginTop: '4px' }}>
                  {card.date}
                </div>
              </div>
            ))}

            <div
              style={{
                gridColumn: '1 / -1',
                background: 'linear-gradient(135deg, #ffffff 0%, #F6F5FB 100%)',
                borderRadius: '16px',
                padding: '16px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(0,173,135, 0.1)',
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🛡️</div>
              <div style={{ fontSize: '10px', color: '#5D50A5', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '4px' }}>
                LISTAS NEGRAS SAT
              </div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#221158' }}>
                Estatus limpio
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== SCENE 4: MIS DECLARACIONES ===== */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: scene4Opacity,
          zIndex: 10,
          padding: '40px',
        }}
      >
        <div
          style={{
            transform: `translateY(${scene4Y}px) rotateZ(${scene4Rotate}deg)`,
            width: '100%',
            maxWidth: '600px',
          }}
        >
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '20px', fontWeight: '900', color: 'white', marginBottom: '4px' }}>
              Mis declaraciones
            </div>
            <div style={{ fontSize: '13px', color: '#D2CDE9' }}>
              Tus impuestos mes con mes
            </div>
          </div>

          <div
            style={{
              background: 'linear-gradient(135deg, #9D73FE 0%, #7339FD 100%)',
              borderRadius: '18px',
              padding: '24px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 10px 30px rgba(157,115,254, 0.3)',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: 'var(--violet-ink)', fontWeight: '800', letterSpacing: '0.5px', marginBottom: '6px' }}>
                REGULARIZAR EL PASADO
              </div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#2A1C64' }}>
                7 meses
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#2A1C64' }}>0%</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {['Julio 2026', 'Junio 2026', 'Mayo 2026'].map((month, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>
                    {month}
                  </div>
                  <div style={{ fontSize: '11px', color: '#857AC0', marginTop: '2px' }}>
                    No presentada
                  </div>
                </div>
                <div
                  style={{
                    background: '#E84D4D',
                    color: 'white',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontWeight: '700',
                  }}
                >
                  URGENTE
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== SCENE 5: LANDING PAGE ===== */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: scene5Opacity,
          zIndex: 10,
          padding: '40px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '700px',
            textAlign: 'center',
            transform: `rotateZ(${scene5Rotate}deg)`,
            transformOrigin: 'center',
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: 'inline-block',
              background: 'rgba(0,173,135, 0.15)',
              border: '1px solid rgba(0,173,135, 0.4)',
              color: '#00AD87',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              letterSpacing: '0.5px',
              marginBottom: '20px',
            }}
          >
            ✨ Potenciado con Inteligencia Artificial
          </div>

          {/* Main heading */}
          <div
            style={{
              fontSize: '48px',
              fontWeight: '900',
              color: 'white',
              lineHeight: '1.2',
              letterSpacing: '-1px',
              marginBottom: '16px',
            }}
          >
            Tu contabilidad
            <br />
            en <span style={{ background: 'linear-gradient(135deg, #00AD87 0%, #00AD87 100%)', backgroundClip: 'text', color: 'transparent', WebkitBackgroundClip: 'text' }}>automático</span>
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: '14px',
              color: '#D2CDE9',
              lineHeight: '1.6',
              marginBottom: '28px',
            }}
          >
            Plataforma contable con IA para personas físicas y empresas en México. Declaraciones inteligentes, facturación electrónica, trámites SAT y mucho más.
          </div>

          {/* CTA Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              marginBottom: '20px',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #00AD87 0%, #00AD87 100%)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(0,173,135, 0.3)',
              }}
            >
              Comenzar Gratis
            </div>
            <div
              style={{
                background: 'transparent',
                color: 'white',
                padding: '12px 24px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '700',
              }}
            >
              Conoce los planes →
            </div>
          </div>

          {/* Stats */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              marginTop: '40px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {[
              { number: '50K+', label: 'Usuarios activos' },
              { number: '99%', label: 'Satisfacción' },
              { number: '5/8', label: 'Soporte' },
            ].map((stat, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: '900',
                    color: '#00AD87',
                    marginBottom: '4px',
                  }}
                >
                  {stat.number}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: '#857AC0',
                    fontWeight: '600',
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}
