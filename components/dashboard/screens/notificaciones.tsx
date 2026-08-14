'use client'

import { useMemo, useState } from 'react'
import { AlertCircle, Bell, CheckCircle2, ImageIcon, Loader2, Send, Smartphone, Users } from 'lucide-react'
import { DISPLAY, MONO } from '../constants'
import { Btn, Card, HelpBox } from '../ui'

type Audiencia = 'emails' | 'registrados' | 'instalados-sin-registro'

const AUDIENCIAS: { id: Audiencia; label: string; hint: string; Icon: typeof Users }[] = [
  {
    id: 'emails',
    label: 'Correos específicos',
    hint: 'Uno o varios correos separados por coma',
    Icon: Send,
  },
  {
    id: 'registrados',
    label: 'Todos los usuarios registrados',
    hint: 'Cuentas con registro completo en la plataforma',
    Icon: Users,
  },
  {
    id: 'instalados-sin-registro',
    label: 'Instalaron la app sin registrarse',
    hint: 'Descargaron la app pero nunca crearon su cuenta',
    Icon: Smartphone,
  },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const TITULO_MAX = 65
const CUERPO_MAX = 240

function parseEmails(raw: string): string[] {
  return raw
    .split(',')
    .map(e => e.trim())
    .filter(Boolean)
}

export function NotificacionesScreen() {
  const [audiencia, setAudiencia] = useState<Audiencia>('emails')
  const [emails, setEmails] = useState('')
  const [titulo, setTitulo] = useState('')
  const [cuerpo, setCuerpo] = useState('')
  const [imagenUrl, setImagenUrl] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const lista = useMemo(() => parseEmails(emails), [emails])
  const invalidos = useMemo(() => lista.filter(e => !EMAIL_RE.test(e)), [lista])

  const destinatarioLabel =
    audiencia === 'emails'
      ? `${lista.length} ${lista.length === 1 ? 'correo' : 'correos'}`
      : AUDIENCIAS.find(a => a.id === audiencia)!.label.toLowerCase()

  const puedeEnviar =
    titulo.trim().length > 0 &&
    cuerpo.trim().length > 0 &&
    (audiencia !== 'emails' || (lista.length > 0 && invalidos.length === 0)) &&
    !enviando

  const enviar = () => {
    setError(null)
    setEnviado(null)
    if (audiencia === 'emails' && lista.length === 0) {
      setError('Agrega al menos un correo destinatario.')
      return
    }
    if (invalidos.length > 0) {
      setError(`Correos con formato inválido: ${invalidos.join(', ')}`)
      return
    }
    setEnviando(true)
    setTimeout(() => {
      setEnviando(false)
      setEnviado(`Notificación enviada a ${destinatarioLabel}.`)
    }, 900)
  }

  const limpiar = () => {
    setEmails('')
    setTitulo('')
    setCuerpo('')
    setImagenUrl('')
    setEnviado(null)
    setError(null)
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] items-start">
      <div className="grid gap-5">
        <Card>
          <div className="p-5 lg:p-6 grid gap-5">
            <div>
              <div className="text-[15px] font-extrabold" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
                Destinatarios
              </div>
              <div className="text-[13px] font-semibold mt-0.5" style={{ color: 'var(--ink-500)' }}>
                Elige a quién le llega esta notificación
              </div>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-3">
              {AUDIENCIAS.map(({ id, label, hint, Icon }) => {
                const activo = audiencia === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setAudiencia(id)}
                    className="text-left rounded-2xl p-4 transition"
                    style={{
                      background: activo ? 'var(--nav-active-bg)' : 'var(--card)',
                      color: activo ? 'var(--nav-active-fg)' : 'var(--foreground)',
                      border: `1px solid ${activo ? 'transparent' : 'var(--border)'}`,
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center mb-2.5"
                      style={{
                        background: activo ? 'var(--nav-active-icon-bg)' : 'var(--ink-50)',
                        color: activo ? 'var(--nav-active-icon-fg)' : 'var(--ink-700)',
                      }}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="text-[13.5px] font-bold leading-tight">{label}</div>
                    <div
                      className="text-[12px] font-semibold mt-1 leading-snug"
                      style={{ color: activo ? 'var(--nav-active-hint)' : 'var(--ink-500)' }}
                    >
                      {hint}
                    </div>
                  </button>
                )
              })}
            </div>

            {audiencia === 'emails' && (
              <div className="grid gap-2">
                <label className="text-[13px] font-bold" style={{ color: 'var(--ink-700)' }}>
                  Correos (separados por coma)
                </label>
                <textarea
                  value={emails}
                  onChange={e => setEmails(e.target.value)}
                  rows={3}
                  placeholder="ana@correo.com, luis@correo.com"
                  className="w-full rounded-2xl px-4 py-3 text-[14px] outline-none resize-y"
                  style={{
                    background: 'var(--input)',
                    color: 'var(--foreground)',
                    border: `1px solid ${invalidos.length ? 'var(--destructive)' : 'var(--border)'}`,
                    ...MONO,
                  }}
                />
                <div className="flex items-center justify-between gap-3 text-[12px] font-semibold">
                  <span style={{ color: 'var(--ink-500)' }}>
                    {lista.length} {lista.length === 1 ? 'destinatario' : 'destinatarios'}
                  </span>
                  {invalidos.length > 0 && (
                    <span style={{ color: 'var(--destructive)' }}>
                      {invalidos.length} con formato inválido
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="p-5 lg:p-6 grid gap-5">
            <div>
              <div className="text-[15px] font-extrabold" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
                Contenido
              </div>
              <div className="text-[13px] font-semibold mt-0.5" style={{ color: 'var(--ink-500)' }}>
                Lo que verá el usuario en su dispositivo
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-bold" style={{ color: 'var(--ink-700)' }}>
                  Título
                </label>
                <span className="text-[12px] font-semibold" style={{ color: 'var(--ink-500)' }}>
                  {titulo.length}/{TITULO_MAX}
                </span>
              </div>
              <input
                value={titulo}
                onChange={e => setTitulo(e.target.value.slice(0, TITULO_MAX))}
                placeholder="Tu declaración de mayo ya está lista"
                className="w-full rounded-2xl px-4 py-3 text-[14px] outline-none"
                style={{ background: 'var(--input)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-bold" style={{ color: 'var(--ink-700)' }}>
                  Cuerpo
                </label>
                <span className="text-[12px] font-semibold" style={{ color: 'var(--ink-500)' }}>
                  {cuerpo.length}/{CUERPO_MAX}
                </span>
              </div>
              <textarea
                value={cuerpo}
                onChange={e => setCuerpo(e.target.value.slice(0, CUERPO_MAX))}
                rows={4}
                placeholder="Entra a la app para revisarla y hacer tu pago antes del día 17."
                className="w-full rounded-2xl px-4 py-3 text-[14px] outline-none resize-y"
                style={{ background: 'var(--input)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-[13px] font-bold" style={{ color: 'var(--ink-700)' }}>
                URL de la imagen <span style={{ color: 'var(--ink-500)' }}>(opcional)</span>
              </label>
              <input
                value={imagenUrl}
                onChange={e => setImagenUrl(e.target.value)}
                placeholder="https://cdn.contabilizate.com/banner.png"
                className="w-full rounded-2xl px-4 py-3 text-[14px] outline-none"
                style={{
                  background: 'var(--input)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  ...MONO,
                }}
              />
            </div>

            {error && (
              <div
                className="rounded-2xl px-4 py-3 flex items-start gap-2.5 text-[13px] font-semibold"
                style={{ background: 'var(--hero-coral-soft-bg)', color: 'var(--destructive)' }}
              >
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {enviado && (
              <div
                className="rounded-2xl px-4 py-3 flex items-start gap-2.5 text-[13px] font-semibold"
                style={{ background: 'var(--hero-brand-soft)', color: 'var(--brand-700)' }}
              >
                <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                <span>{enviado}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Btn onClick={enviar} disabled={!puedeEnviar}>
                {enviando ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {enviando ? 'Enviando…' : 'Enviar notificación'}
              </Btn>
              <Btn kind="ghost" onClick={limpiar}>
                Limpiar
              </Btn>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-5">
        <Card>
          <div className="p-5 lg:p-6 grid gap-4">
            <div className="text-[15px] font-extrabold" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
              Vista previa
            </div>

            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
            >
              {imagenUrl.trim() ? (
                <img
                  src={imagenUrl.trim()}
                  alt=""
                  className="w-full object-cover"
                  style={{ maxHeight: 160 }}
                  onError={e => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div
                  className="flex flex-col items-center justify-center gap-1.5 py-8"
                  style={{ color: 'var(--ink-500)' }}
                >
                  <ImageIcon size={20} />
                  <span className="text-[12px] font-semibold">Sin imagen</span>
                </div>
              )}
              <div className="p-4 flex items-start gap-3" style={{ background: 'var(--card)' }}>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--hero-brand-soft)', color: 'var(--brand-700)' }}
                >
                  <Bell size={15} />
                </div>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-bold leading-snug" style={{ color: 'var(--ink-900)' }}>
                    {titulo.trim() || 'Título de la notificación'}
                  </div>
                  <div
                    className="text-[12.5px] font-semibold mt-1 leading-relaxed"
                    style={{ color: 'var(--ink-500)' }}
                  >
                    {cuerpo.trim() || 'Aquí aparece el cuerpo del mensaje que recibirá el usuario.'}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[12.5px] font-semibold" style={{ color: 'var(--ink-500)' }}>
              Se enviará a: <span style={{ color: 'var(--ink-700)' }}>{destinatarioLabel}</span>
            </div>
          </div>
        </Card>

        <HelpBox>
          Este formulario todavía no está conectado al servicio de notificaciones: el envío es
          simulado y no llega a ningún usuario.
        </HelpBox>
      </div>
    </div>
  )
}
