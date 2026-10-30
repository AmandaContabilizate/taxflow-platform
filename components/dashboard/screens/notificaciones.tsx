'use client'

import { useMemo, useState } from 'react'
import { AlertCircle, Bell, CheckCircle2, ImageIcon, Loader2, Mail, Send, Smartphone, Users } from 'lucide-react'
import { sendBroadcastPushAction, type BroadcastPushResponse } from '@/features/marketing/actions/sendBroadcastPush.action'
import { DISPLAY, MONO } from '../constants'
import { Btn, Card, HelpBox } from '../ui'

type Audiencia = 'emails' | 'registrados' | 'instalados-sin-registro'
type Categoria = 'Sistema' | 'SAT' | 'Contable' | 'Renovacion' | 'Alertas'
type SendChannel = 'push_inapp' | 'all' | 'email_only'

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
    hint: 'Dispositivos anónimos con token push',
    Icon: Smartphone,
  },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const TITULO_MAX = 65
const CUERPO_MAX = 1000

function parseEmails(raw: string): string[] {
  return raw
    .split(',')
    .map(e => e.trim())
    .filter(Boolean)
}

export function NotificacionesScreen() {
  const [audiencia, setAudiencia] = useState<Audiencia>('emails')
  const [categoria, setCategoria] = useState<Categoria>('Sistema')
  const [sendChannel, setSendChannel] = useState<SendChannel>('push_inapp')
  const [emails, setEmails] = useState('')
  const [titulo, setTitulo] = useState('')
  const [cuerpo, setCuerpo] = useState('')
  const [imagenUrl, setImagenUrl] = useState('')
  const [actionUrl, setActionUrl] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [envioResult, setEnvioResult] = useState<BroadcastPushResponse | null>(null)

  const lista = useMemo(() => parseEmails(emails), [emails])
  const invalidos = useMemo(() => lista.filter(e => !EMAIL_RE.test(e)), [lista])

  const isValidUrl = (val: string, allowRelative = false): boolean => {
    const trimmed = val.trim()
    if (!trimmed) return true
    if (/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(trimmed)) return false
    if (trimmed.includes(' ')) return false
    if (allowRelative && trimmed.startsWith('/')) return true
    try {
      const url = new URL(trimmed)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  }

  const isActionUrlValid = useMemo(() => isValidUrl(actionUrl, true), [actionUrl])
  const isImageUrlValid = useMemo(() => isValidUrl(imagenUrl, false), [imagenUrl])

  const destinatarioLabel =
    audiencia === 'emails'
      ? `${lista.length} ${lista.length === 1 ? 'correo' : 'correos'}`
      : AUDIENCIAS.find(a => a.id === audiencia)!.label.toLowerCase()

  const puedeEnviar =
    titulo.trim().length > 0 &&
    cuerpo.trim().length > 0 &&
    (audiencia !== 'emails' || (lista.length > 0 && invalidos.length === 0)) &&
    isActionUrlValid &&
    isImageUrlValid &&
    !enviando

  const enviar = async () => {
    setError(null)
    setEnviado(null)
    setEnvioResult(null)
    if (audiencia === 'emails' && lista.length === 0) {
      setError('Agrega al menos un correo destinatario.')
      return
    }
    if (invalidos.length > 0) {
      setError(`Correos con formato inválido: ${invalidos.join(', ')}`)
      return
    }
    if (!isActionUrlValid) {
      setError('La URL de destino no es válida (debe ser una dirección HTTPS/HTTP válida o una ruta relativa que empiece con / sin emojis ni espacios).')
      return
    }
    if (!isImageUrlValid) {
      setError('La URL de la imagen no es válida (debe ser una dirección HTTPS/HTTP válida sin emojis ni espacios).')
      return
    }
    setEnviando(true)
    try {
      const payload = {
        title: titulo.trim(),
        body: cuerpo.trim(),
        category: categoria,
        actionUrl: actionUrl.trim() || undefined,
        imageUrl: imagenUrl.trim() || undefined,
        targetAudience: audiencia === 'emails' ? 'SpecificUsers' : 'All',
        userIds: audiencia === 'emails' ? lista : undefined,
        sendChannel,
      }

      const result = await sendBroadcastPushAction(payload)
      if (!result.success) {
        setError(result.error.message || 'Error al enviar la notificación masiva')
        return
      }

      setEnvioResult(result.value)
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
    setActionUrl('')
    setEnviado(null)
    setError(null)
    setEnvioResult(null)
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
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: activo ? 'var(--nav-active-icon-bg)' : 'var(--ink-50)',
                          color: activo ? 'var(--nav-active-icon-fg)' : 'var(--ink-700)',
                        }}
                      >
                        <Icon size={15} />
                      </div>
                      <div className="text-[13px] font-bold leading-tight min-w-0">{label}</div>
                    </div>
                    <div
                      className="text-[11px] font-semibold leading-snug"
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
                <div className="flex items-center justify-between gap-3">
                  <label className="text-[12.5px] font-bold" style={{ color: 'var(--ink-700)' }}>
                    Correos (separados por coma)
                  </label>
                  <div className="flex items-center gap-2 text-[11.5px] font-semibold">
                    <span style={{ color: 'var(--ink-500)' }}>
                      {lista.length} {lista.length === 1 ? 'destinatario' : 'destinatarios'}
                    </span>
                    {invalidos.length > 0 && (
                      <span style={{ color: 'var(--destructive)' }}>
                        ({invalidos.length} inválidos)
                      </span>
                    )}
                  </div>
                </div>
                <textarea
                  value={emails}
                  onChange={e => setEmails(e.target.value)}
                  rows={1}
                  placeholder="ana@correo.com, luis@correo.com"
                  className="w-full rounded-xl px-3.5 py-2 text-[13px] outline-none resize-y"
                  style={{
                    background: 'var(--input)',
                    color: 'var(--foreground)',
                    border: `1px solid ${invalidos.length ? 'var(--destructive)' : 'var(--border)'}`,
                    ...MONO,
                  }}
                />
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="p-4 lg:p-5 grid gap-3.5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-start">
              {/* Columna 1: Categoría del aviso (3 columnas) */}
              <div className="md:col-span-3 flex flex-col gap-2">
                <div className="text-[14.5px] font-extrabold" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
                  Categoría del aviso
                </div>
                <div className="inline-grid grid-cols-2 items-stretch gap-1.5 w-fit">
                  {CATEGORIAS.map(cat => {
                    const activo = categoria === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategoria(cat.id)}
                        className="px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition flex items-center justify-start gap-1.5 border"
                        style={{
                          background: activo ? cat.badgeBg : 'var(--input)',
                          color: activo ? cat.badgeFg : 'var(--ink-600)',
                          borderColor: activo ? cat.badgeFg : 'var(--border)',
                        }}
                      >
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.badgeFg }} />
                        <span className="whitespace-nowrap">{cat.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Columna 2: Canal de envío (3 columnas) */}
              <div className="md:col-span-3 flex flex-col gap-2">
                <div className="text-[14.5px] font-extrabold" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
                  Canal de envío
                </div>
                <div className="inline-flex flex-col items-stretch gap-1.5 w-fit">
                  <button
                    type="button"
                    onClick={() => setSendChannel('push_inapp')}
                    className={`px-3.5 py-1.5 rounded-xl text-[11.5px] font-bold transition flex items-center gap-2 border ${
                      sendChannel === 'push_inapp'
                        ? 'bg-blue-500/15 text-blue-500 border-blue-500/40 shadow-sm'
                        : 'bg-background/80 text-muted-foreground border-border/70 hover:text-foreground hover:bg-accent/40'
                    }`}
                  >
                    <Bell className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                    <span className="whitespace-nowrap">Push + In-App</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSendChannel('all')}
                    className={`px-3.5 py-1.5 rounded-xl text-[11.5px] font-bold transition flex items-center gap-2 border ${
                      sendChannel === 'all'
                        ? 'bg-purple-500/15 text-purple-500 border-purple-500/40 shadow-sm'
                        : 'bg-background/80 text-muted-foreground border-border/70 hover:text-foreground hover:bg-accent/40'
                    }`}
                  >
                    <Mail className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
                    <span className="whitespace-nowrap">Push + In-App + Correo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSendChannel('email_only')}
                    className={`px-3.5 py-1.5 rounded-xl text-[11.5px] font-bold transition flex items-center gap-2 border ${
                      sendChannel === 'email_only'
                        ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/40 shadow-sm'
                        : 'bg-background/80 text-muted-foreground border-border/70 hover:text-foreground hover:bg-accent/40'
                    }`}
                  >
                    <Mail className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                    <span className="whitespace-nowrap">Solo Correo</span>
                  </button>
                </div>
              </div>

              {/* Columna 3: HelpBox Informativo (6 columnas) */}
              <div className="md:col-span-6 flex flex-col gap-2">
                <HelpBox>
                  Lo que verá el usuario en su dispositivo. Los avisos de difusión se envían directamente como notificaciones a sus dispositivos (móvil y web) y quedan guardados automáticamente en su Centro de Notificaciones.
                </HelpBox>
              </div>
            </div>

            <div className="grid gap-1.5 pt-2">
              <div className="text-[14.5px] font-extrabold mb-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
                Contenido
              </div>
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
                rows={3.5 as any}
                placeholder="Entra a la app para revisarla y hacer tu pago antes del día 17."
                className="w-full rounded-xl px-3.5 py-2 text-[13.5px] outline-none resize-y"
                style={{ background: 'var(--input)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[12.5px] font-bold" style={{ color: 'var(--ink-700)' }}>
                    URL de destino / Redirección <span style={{ color: 'var(--ink-500)' }}>(opcional)</span>
                  </label>
                  {!isActionUrlValid && (
                    <span className="text-[11px] font-bold" style={{ color: 'var(--destructive)' }}>
                      URL inválida
                    </span>
                  )}
                </div>
                <input
                  value={actionUrl}
                  onChange={e => setActionUrl(e.target.value)}
                  placeholder="https://contabilizate.com/promocion"
                  className="w-full rounded-xl px-3.5 py-2 text-[13px] outline-none transition"
                  style={{
                    background: 'var(--input)',
                    color: 'var(--foreground)',
                    border: `1px solid ${!isActionUrlValid ? 'var(--destructive)' : 'var(--border)'}`,
                    ...MONO,
                  }}
                />
                {!isActionUrlValid && (
                  <p className="text-[11px] font-medium" style={{ color: 'var(--destructive)' }}>
                    Debe ser una URL válida (ej. https://wa.me/...) o ruta (/...) sin emojis.
                  </p>
                )}
              </div>

              <div className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[12.5px] font-bold" style={{ color: 'var(--ink-700)' }}>
                    URL de la imagen <span style={{ color: 'var(--ink-500)' }}>(opcional)</span>
                  </label>
                  {!isImageUrlValid && (
                    <span className="text-[11px] font-bold" style={{ color: 'var(--destructive)' }}>
                      URL inválida
                    </span>
                  )}
                </div>
                <input
                  value={imagenUrl}
                  onChange={e => setImagenUrl(e.target.value)}
                  placeholder="https://cdn.contabilizate.com/banner.png"
                  className="w-full rounded-xl px-3.5 py-2 text-[13px] outline-none transition"
                  style={{
                    background: 'var(--input)',
                    color: 'var(--foreground)',
                    border: `1px solid ${!isImageUrlValid ? 'var(--destructive)' : 'var(--border)'}`,
                    ...MONO,
                  }}
                />
                {!isImageUrlValid && (
                  <p className="text-[11px] font-medium" style={{ color: 'var(--destructive)' }}>
                    Debe ser una URL HTTPS/HTTP válida sin emojis.
                  </p>
                )}
              </div>
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
                <div className="w-full h-[115px] flex items-center justify-center p-2 bg-muted/40 overflow-hidden">
                  <img
                    src={imagenUrl.trim()}
                    alt=""
                    className="max-w-full max-h-full object-contain rounded-md"
                    onError={e => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
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
                    className="text-[12px] font-semibold mt-0.5 leading-relaxed line-clamp-3"
                    style={{ color: 'var(--ink-500)' }}
                    title={cuerpo.trim()}
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

        <Card>
          <div className="p-4 lg:p-5 grid gap-4">
            <div className="flex items-start gap-2.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  background: envioResult ? 'rgba(16, 185, 129, 0.18)' : 'var(--hero-brand-soft)',
                  color: envioResult ? '#10B981' : 'var(--brand-700)',
                }}
              >
                <CheckCircle2 size={16} />
              </div>
              <div>
                <div className="text-[14px] font-extrabold" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
                  Resultado del Envío
                </div>
                <div className="text-[11.5px] font-semibold mt-0.5" style={{ color: 'var(--ink-500)' }}>
                  {envioResult
                    ? `Procesado envío de notificación Push masiva: ${envioResult.sentCount ?? 0} exitosas, ${envioResult.failedCount ?? 0} fallidas.`
                    : 'Aquí se mostrarán las métricas y el detalle de entrega al despachar la notificación.'}
                </div>
              </div>
            </div>

            {/* Grid 4 métricas */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl border" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
                <div className="text-[9.5px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
                  CUENTAS DESTINO
                </div>
                <div className="text-[18px] font-extrabold mt-0.5" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
                  {envioResult?.totalUsersTargeted ?? 0}
                </div>
              </div>

              <div className="p-2.5 rounded-xl border" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
                <div className="text-[9.5px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
                  DISPOSITIVOS DETECTADOS
                </div>
                <div className="text-[18px] font-extrabold mt-0.5" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
                  {envioResult?.totalTokensFound ?? 0}
                </div>
              </div>

              <div className="p-2.5 rounded-xl border" style={{ background: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                <div className="text-[9.5px] font-extrabold uppercase tracking-wider" style={{ color: '#10B981' }}>
                  ENTREGADOS OK
                </div>
                <div className="text-[18px] font-extrabold mt-0.5" style={{ ...DISPLAY, color: '#10B981' }}>
                  {envioResult?.sentCount ?? 0}
                </div>
              </div>

              <div className="p-2.5 rounded-xl border" style={{ background: 'var(--hero-coral-soft-bg)', borderColor: 'rgba(244, 63, 94, 0.3)' }}>
                <div className="text-[9.5px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--destructive)' }}>
                  FALLIDOS
                </div>
                <div className="text-[18px] font-extrabold mt-0.5" style={{ ...DISPLAY, color: 'var(--destructive)' }}>
                  {envioResult?.failedCount ?? 0}
                </div>
              </div>
            </div>

            {/* Lista de detalles de destinatarios */}
            {envioResult?.details && envioResult.details.length > 0 && (
              <div className="grid gap-2 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                <div className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
                  DETALLE DE DESTINATARIOS ({envioResult.details.length})
                </div>

                <div className="max-h-[220px] overflow-y-auto grid gap-2 pr-1">
                  {envioResult.details.map((d, idx) => {
                    const isSent = d.status === 'sent'
                    return (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl border text-[11.5px]"
                        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold truncate min-w-0" style={{ color: 'var(--ink-900)' }}>
                            {d.email || d.userId || 'Usuario'}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded-md text-[9.5px] font-extrabold flex-shrink-0"
                            style={{
                              background: isSent ? 'rgba(16, 185, 129, 0.18)' : 'var(--hero-coral-soft-bg)',
                              color: isSent ? '#10B981' : 'var(--destructive)',
                            }}
                          >
                            {isSent ? 'ENTREGADO' : 'FALLIDO'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-[10.5px]" style={{ color: 'var(--ink-500)' }}>
                          <span>Plataforma: <strong style={{ color: 'var(--ink-700)' }}>{d.platform || 'Web'}</strong></span>
                          {d.token && (
                            <span className="truncate max-w-[120px]" style={MONO}>
                              Token: {d.token.slice(0, 15)}...
                            </span>
                          )}
                        </div>

                        <div className="text-[10.5px] font-semibold mt-0.5" style={{ color: isSent ? '#10B981' : 'var(--destructive)' }}>
                          {isSent ? 'Enviado correctamente' : d.error || 'Error en entrega de token'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
