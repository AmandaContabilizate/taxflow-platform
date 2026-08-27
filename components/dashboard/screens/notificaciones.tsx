'use client'

import { useMemo, useState } from 'react'
import { AlertCircle, Bell, CheckCircle2, ImageIcon, Loader2, Send, Smartphone, Users } from 'lucide-react'
import { sendBroadcastPushAction } from '@/features/marketing/actions/sendBroadcastPush.action'
import { DISPLAY, MONO } from '../constants'
import { Btn, Card, HelpBox } from '../ui'

type Audiencia = 'emails' | 'registrados' | 'instalados-sin-registro'
type Categoria = 'Sistema' | 'SAT' | 'Contable' | 'Renovacion' | 'Alertas'

const CATEGORIAS: { id: Categoria; label: string; badgeBg: string; badgeFg: string }[] = [
  { id: 'Sistema', label: 'Sistema', badgeBg: 'rgba(59, 130, 246, 0.18)', badgeFg: '#3B82F6' },
  { id: 'SAT', label: 'SAT', badgeBg: 'rgba(245, 158, 11, 0.18)', badgeFg: '#F59E0B' },
  { id: 'Contable', label: 'Contable', badgeBg: 'rgba(16, 185, 129, 0.18)', badgeFg: '#10B981' },
  { id: 'Renovacion', label: 'Renovación', badgeBg: 'rgba(139, 92, 246, 0.18)', badgeFg: '#8B5CF6' },
  { id: 'Alertas', label: 'Alertas', badgeBg: 'rgba(244, 63, 94, 0.18)', badgeFg: '#F43F5E' },
]

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
  const [categoria, setCategoria] = useState<Categoria>('Sistema')
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

  const enviar = async () => {
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
    try {
      const payload = {
        title: titulo.trim(),
        body: cuerpo.trim(),
        category: categoria,
        imageUrl: imagenUrl.trim() || undefined,
        targetAudience: audiencia === 'emails' ? 'SpecificUsers' : 'All',
        userIds: audiencia === 'emails' ? lista : undefined,
      }

      const result = await sendBroadcastPushAction(payload)
      if (!result.success) {
        setError(result.error.message || 'Error al enviar la notificación masiva')
        return
      }

      setEnviado(result.value.message || `Notificación enviada con éxito a ${destinatarioLabel}.`)
    } catch (err: any) {
      console.error('Error al enviar difusión:', err)
      setError(err.message || 'Error al enviar la notificación masiva')
    } finally {
      setEnviando(false)
    }
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
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
      <div className="grid gap-4">
        <Card>
          <div className="p-4 lg:p-5 grid gap-3.5">
            <div>
              <div className="text-[14.5px] font-extrabold" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
                Destinatarios
              </div>
              <div className="text-[12px] font-semibold mt-0.5" style={{ color: 'var(--ink-500)' }}>
                Elige a quién le llega esta notificación
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              {AUDIENCIAS.map(({ id, label, hint, Icon }) => {
                const activo = audiencia === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setAudiencia(id)}
                    className="text-left rounded-xl p-3 transition"
                    style={{
                      background: activo ? 'var(--nav-active-bg)' : 'var(--card)',
                      color: activo ? 'var(--nav-active-fg)' : 'var(--foreground)',
                      border: `1px solid ${activo ? 'transparent' : 'var(--border)'}`,
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center mb-2"
                      style={{
                        background: activo ? 'var(--nav-active-icon-bg)' : 'var(--ink-50)',
                        color: activo ? 'var(--nav-active-icon-fg)' : 'var(--ink-700)',
                      }}
                    >
                      <Icon size={15} />
                    </div>
                    <div className="text-[13px] font-bold leading-tight">{label}</div>
                    <div
                      className="text-[11px] font-semibold mt-0.5 leading-snug"
                      style={{ color: activo ? 'var(--nav-active-hint)' : 'var(--ink-500)' }}
                    >
                      {hint}
                    </div>
                  </button>
                )
              })}
            </div>

            {audiencia === 'emails' && (
              <div className="grid gap-1.5 mt-1">
                <label className="text-[12.5px] font-bold" style={{ color: 'var(--ink-700)' }}>
                  Correos (separados por coma)
                </label>
                <textarea
                  value={emails}
                  onChange={e => setEmails(e.target.value)}
                  rows={2}
                  placeholder="ana@correo.com, luis@correo.com"
                  className="w-full rounded-xl px-3.5 py-2 text-[13px] outline-none resize-y"
                  style={{
                    background: 'var(--input)',
                    color: 'var(--foreground)',
                    border: `1px solid ${invalidos.length ? 'var(--destructive)' : 'var(--border)'}`,
                    ...MONO,
                  }}
                />
                <div className="flex items-center justify-between gap-3 text-[11.5px] font-semibold">
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
          <div className="p-4 lg:p-5 grid gap-3.5">
            <div>
              <div className="text-[14.5px] font-extrabold" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
                Contenido
              </div>
              <div className="text-[12px] font-semibold mt-0.5" style={{ color: 'var(--ink-500)' }}>
                Lo que verá el usuario en su dispositivo
              </div>
            </div>

            <div className="grid gap-1.5">
              <label className="text-[12.5px] font-bold" style={{ color: 'var(--ink-700)' }}>
                Categoría del aviso
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIAS.map(cat => {
                  const activo = categoria === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoria(cat.id)}
                      className="px-3 py-1.5 rounded-xl text-[12px] font-bold transition flex items-center gap-1.5"
                      style={{
                        background: activo ? cat.badgeBg : 'var(--input)',
                        color: activo ? cat.badgeFg : 'var(--ink-600)',
                        border: `1.5px solid ${activo ? cat.badgeFg : 'var(--border)'}`,
                      }}
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.badgeFg }} />
                      <span>{cat.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[12.5px] font-bold" style={{ color: 'var(--ink-700)' }}>
                  Título
                </label>
                <span className="text-[11.5px] font-semibold" style={{ color: 'var(--ink-500)' }}>
                  {titulo.length}/{TITULO_MAX}
                </span>
              </div>
              <input
                value={titulo}
                onChange={e => setTitulo(e.target.value.slice(0, TITULO_MAX))}
                placeholder="Tu declaración de mayo ya está lista"
                className="w-full rounded-xl px-3.5 py-2 text-[13.5px] outline-none"
                style={{ background: 'var(--input)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
              />
            </div>

            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[12.5px] font-bold" style={{ color: 'var(--ink-700)' }}>
                  Cuerpo
                </label>
                <span className="text-[11.5px] font-semibold" style={{ color: 'var(--ink-500)' }}>
                  {cuerpo.length}/{CUERPO_MAX}
                </span>
              </div>
              <textarea
                value={cuerpo}
                onChange={e => setCuerpo(e.target.value.slice(0, CUERPO_MAX))}
                rows={2.5 as any}
                placeholder="Entra a la app para revisarla y hacer tu pago antes del día 17."
                className="w-full rounded-xl px-3.5 py-2 text-[13.5px] outline-none resize-y"
                style={{ background: 'var(--input)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-[12.5px] font-bold" style={{ color: 'var(--ink-700)' }}>
                URL de la imagen <span style={{ color: 'var(--ink-500)' }}>(opcional)</span>
              </label>
              <input
                value={imagenUrl}
                onChange={e => setImagenUrl(e.target.value)}
                placeholder="https://cdn.contabilizate.com/banner.png"
                className="w-full rounded-xl px-3.5 py-2 text-[13px] outline-none"
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
                className="rounded-xl px-3.5 py-2 flex items-start gap-2 text-[12.5px] font-semibold"
                style={{ background: 'var(--hero-coral-soft-bg)', color: 'var(--destructive)' }}
              >
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {enviado && (
              <div
                className="rounded-xl px-3.5 py-2 flex items-start gap-2 text-[12.5px] font-semibold"
                style={{ background: 'var(--hero-brand-soft)', color: 'var(--brand-700)' }}
              >
                <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0" />
                <span>{enviado}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <Btn onClick={enviar} disabled={!puedeEnviar}>
                {enviando ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {enviando ? 'Enviando…' : 'Enviar notificación'}
              </Btn>
              <Btn kind="ghost" onClick={limpiar}>
                Limpiar
              </Btn>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4">
        <Card>
          <div className="p-4 lg:p-5 grid gap-3.5">
            <div className="text-[14.5px] font-extrabold" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
              Vista previa
            </div>

            <div
              className="rounded-xl overflow-hidden"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
            >
              {imagenUrl.trim() ? (
                <img
                  src={imagenUrl.trim()}
                  alt=""
                  className="w-full object-cover"
                  style={{ maxHeight: 140 }}
                  onError={e => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div
                  className="flex flex-col items-center justify-center gap-1.5 py-6"
                  style={{ color: 'var(--ink-500)' }}
                >
                  <ImageIcon size={18} />
                  <span className="text-[11.5px] font-semibold">Sin imagen</span>
                </div>
              )}
              <div className="p-3.5 flex items-start gap-3" style={{ background: 'var(--card)' }}>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--hero-brand-soft)', color: 'var(--brand-700)' }}
                >
                  <Bell size={14} />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-bold leading-snug" style={{ color: 'var(--ink-900)' }}>
                    {titulo.trim() || 'Título de la notificación'}
                  </div>
                  <div
                    className="text-[12px] font-semibold mt-0.5 leading-relaxed"
                    style={{ color: 'var(--ink-500)' }}
                  >
                    {cuerpo.trim() || 'Aquí aparece el cuerpo del mensaje que recibirá el usuario.'}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[12px] font-semibold" style={{ color: 'var(--ink-500)' }}>
              Se enviará a: <span style={{ color: 'var(--ink-700)' }}>{destinatarioLabel}</span>
            </div>
          </div>
        </Card>

        <HelpBox>
          Los avisos de difusión se envían directamente como notificaciones a los dispositivos de los usuarios (móvil y web) y quedan guardados automáticamente en su Centro de Notificaciones.
        </HelpBox>
      </div>
    </div>
  )
}
