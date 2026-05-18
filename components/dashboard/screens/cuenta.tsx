import { Bell, ChevronRight, Lock, LogOut, MessageCircle, Settings } from 'lucide-react'
import { DISPLAY, MONO } from '../constants'
import { Btn, Card, Divider } from '../ui'

interface Props {
  fullName: string
  email: string
  rfc: string | null
  initials: string
  onLogout: () => void
  signingOut: boolean
}

export function CuentaScreen({ fullName, email, rfc, initials, onLogout, signingOut }: Props) {
  const preferencias = [
    { Icon: Bell, t: 'Notificaciones', s: 'Avisos de fechas importantes' },
    { Icon: Lock, t: 'Seguridad', s: 'Contraseña y verificación' },
    { Icon: Settings, t: 'Datos personales', s: 'Nombre, correo, teléfono' },
  ]

  return (
    <div className="flex flex-col gap-5 max-w-[760px]">
      <div className="rounded-3xl p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-4 flex-wrap">
          <div
            className="w-[68px] h-[68px] rounded-full flex items-center justify-center text-white text-[28px] font-extrabold flex-shrink-0"
            style={{ ...DISPLAY, background: 'linear-gradient(135deg,#10DA92,#00B073)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[22px] font-extrabold tracking-tight" style={DISPLAY}>
              {fullName}
            </div>
            <div className="text-[13px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
              {email}
            </div>
            {rfc && (
              <div className="text-[12.5px] mt-1" style={{ ...MONO, color: 'var(--ink-400)' }}>
                RFC: {rfc}
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="text-[15px] font-bold mb-3" style={{ color: 'var(--ink-700)' }}>
          Tu contador
        </div>
        <Card>
          <button className="w-full px-5 py-4 flex items-center gap-4 text-left">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-extrabold"
              style={{ ...DISPLAY, background: 'linear-gradient(135deg,#7B6FE0,#403A8D)' }}
            >
              K
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[15px]">Karla M.</div>
              <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                Te responde por chat hoy mismo
              </div>
            </div>
            <Btn size="sm" kind="primary">
              <MessageCircle size={14} /> Escribir
            </Btn>
          </button>
        </Card>
      </div>

      <div>
        <div className="text-[15px] font-bold mb-3" style={{ color: 'var(--ink-700)' }}>
          Preferencias
        </div>
        <Card>
          <div>
            {preferencias.map((it, i, arr) => (
              <div key={it.t}>
                <button className="w-full px-4 py-3.5 flex items-center gap-3 text-left transition hover:bg-[var(--ink-50)]">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--ink-50)', color: 'var(--ink-700)' }}
                  >
                    <it.Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14.5px]">{it.t}</div>
                    <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                      {it.s}
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--ink-300)' }} />
                </button>
                {i < arr.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Btn
        block
        kind="ghost"
        onClick={signingOut ? undefined : onLogout}
        disabled={signingOut}
        style={{ color: '#B01F1F', borderColor: 'var(--danger-soft)' }}
      >
        <LogOut size={16} /> {signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
      </Btn>

      <div className="text-center text-[11px] font-semibold mt-2" style={{ color: 'var(--ink-400)' }}>
        Contabilízate · Hecho con cariño en México
      </div>
    </div>
  )
}
