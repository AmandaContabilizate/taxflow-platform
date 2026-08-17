'use client'

import { useState } from 'react'
import { Megaphone, Send, CheckCircle2, AlertTriangle, Users, Shield, RefreshCw, RotateCcw, Link as LinkIcon, Image as ImageIcon } from 'lucide-react'
import { sendBroadcastPushAction } from '@/features/marketing/actions/sendBroadcastPush.action'
import type { BroadcastPushRequest, BroadcastPushResponse } from '@/features/marketing/tools/types'
import { DISPLAY } from '../constants'
import { Btn, Card } from '../ui'

function formatErrorMessage(rawError?: string): string {
  if (!rawError) return 'Error desconocido'
  const errLower = rawError.toLowerCase()
  if (errLower.includes('notregistered') || errLower.includes('unregistered')) {
    return 'Dispositivo no registrado o suscripción caducada'
  }
  if (errLower.includes('not a valid fcm') || errLower.includes('invalidregistration')) {
    return 'El token de este dispositivo no es válido'
  }
  if (errLower.includes('mismatchsenderid')) {
    return 'El dispositivo pertenece a otro proyecto'
  }
  if (errLower.includes('link options should be a valid https url')) {
    return 'La URL de destino debe ser una dirección HTTPS válida'
  }
  return rawError
}

export function MarketingScreen() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [actionUrl, setActionUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [targetAudience, setTargetAudience] = useState<'All' | 'Role' | 'SpecificUsers'>('SpecificUsers')
  const [roleName, setRoleName] = useState('SERVICE CUSTOMER')
  const [userIdsText, setUserIdsText] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BroadcastPushResponse | null>(null)

  const handleReset = () => {
    setTitle('')
    setBody('')
    setActionUrl('')
    setImageUrl('')
    setTargetAudience('SpecificUsers')
    setRoleName('SERVICE CUSTOMER')
    setUserIdsText('')
    setError(null)
    setResult(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) {
      setError('El título y el mensaje son requeridos.')
      return
    }

    setError(null)
    setLoading(true)
    setResult(null)

    const userIds = userIdsText
      .split(/[\n,]+/)
      .map((id) => id.trim())
      .filter((id) => id.length > 0)

    const payload: BroadcastPushRequest = {
      title: title.trim(),
      body: body.trim(),
      actionUrl: actionUrl.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      targetAudience,
      roleName: targetAudience === 'Role' ? roleName.trim() : undefined,
      userIds: targetAudience === 'SpecificUsers' ? userIds : undefined,
      dbOrigin: 2, // 2 = SQL Server (MSSQL)
    }

    const res = await sendBroadcastPushAction(payload)
    setLoading(false)

    if (res.success) {
      setResult(res.value)
    } else {
      setError(res.error?.message || 'Error al enviar la notificación masiva.')
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Formulario de creación */}
        <div className="lg:col-span-7 flex flex-col">
          <Card className="p-6 flex-1 flex flex-col">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1 justify-between">
              <h3 className="text-lg font-bold" style={{ color: 'var(--ink-900)' }}>
                Configuración del Mensaje
              </h3>

              {/* Mensajes de Alerta */}
              {error && (
                <div className="p-4 rounded-xl flex items-center gap-3 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-sm font-semibold">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Título */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider mb-2" style={{ color: 'var(--ink-500)' }}>
                  Título del Mensaje *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: ¡Nueva actualización disponible!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border transition text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  style={{
                    background: 'var(--card)',
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)',
                  }}
                />
              </div>

              {/* Cuerpo / Mensaje */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider mb-2" style={{ color: 'var(--ink-500)' }}>
                  Contenido / Mensaje *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ej: Revisa las nuevas funciones disponibles en Contabox Pro."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border transition text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  style={{
                    background: 'var(--card)',
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)',
                  }}
                />
              </div>

              {/* Audiencia Selector */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider mb-2" style={{ color: 'var(--ink-500)' }}>
                  Audiencia Destino *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetAudience('SpecificUsers')}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      targetAudience === 'SpecificUsers'
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    style={targetAudience !== 'SpecificUsers' ? { borderColor: 'var(--border)', color: 'var(--foreground)' } : {}}
                  >
                    <Users className="w-4 h-4" />
                    <span>Por Específico</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetAudience('Role')}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      targetAudience === 'Role'
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    style={targetAudience !== 'Role' ? { borderColor: 'var(--border)', color: 'var(--foreground)' } : {}}
                  >
                    <Shield className="w-4 h-4" />
                    <span>Por Rol</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetAudience('All')}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      targetAudience === 'All'
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    style={targetAudience !== 'All' ? { borderColor: 'var(--border)', color: 'var(--foreground)' } : {}}
                  >
                    <Users className="w-4 h-4" />
                    <span>Todos</span>
                  </button>
                </div>
              </div>

              {/* Condicional Rol */}
              {targetAudience === 'Role' && (
                <div className="p-4 rounded-xl border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
                  <label className="block text-xs font-extrabold uppercase tracking-wider mb-2 text-emerald-800 dark:text-emerald-300">
                    Nombre del Rol
                  </label>
                  <select
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  >
                    <option value="SERVICE CUSTOMER">SERVICE CUSTOMER</option>
                    <option value="Administrator">Administrator</option>
                    <option value="User">User</option>
                    <option value="ACCOUNTINGMANAGER">ACCOUNTINGMANAGER</option>
                  </select>
                </div>
              )}

              {/* Condicional Usuarios Específicos */}
              {targetAudience === 'SpecificUsers' && (
                <div className="p-4 rounded-xl border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
                  <label className="block text-xs font-extrabold uppercase tracking-wider mb-2 text-emerald-800 dark:text-emerald-300">
                    Emails o RFCs de Usuario (separados por línea o coma)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="envios@test.contabilizate.com&#10;servicios2@contabilizate.com&#10;COSV021014JI0"
                    value={userIdsText}
                    onChange={(e) => setUserIdsText(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  />
                </div>
              )}

              {/* Campos opcionales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider mb-2" style={{ color: 'var(--ink-500)' }}>
                    URL de Destino (Opcional)
                  </label>
                  <div className="relative">
                    <LinkIcon className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                    <input
                      type="url"
                      placeholder="https://app.contabilizate.com/updates"
                      value={actionUrl}
                      onChange={(e) => setActionUrl(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider mb-2" style={{ color: 'var(--ink-500)' }}>
                    URL de Imagen (Opcional)
                  </label>
                  <div className="relative">
                    <ImageIcon className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                    <input
                      type="url"
                      placeholder="https://.../banner.png"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="mt-2 flex items-center gap-3">
                <Btn
                  kind="primary"
                  type="submit"
                  size="md"
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" /> Procesando envío masivo...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Send className="w-5 h-5" /> Despachar Notificación Masiva
                    </span>
                  )}
                </Btn>
                <Btn
                  kind="ghost"
                  type="button"
                  size="md"
                  onClick={handleReset}
                  disabled={loading}
                >
                  <RotateCcw className="w-4 h-4" /> Nueva Difusión
                </Btn>
              </div>
            </form>
          </Card>
        </div>

        {/* Panel de Métricas / Resultados */}
        <div className="lg:col-span-5 flex flex-col">
          {result ? (() => {
            const rawObj = (result as any)?.data ?? (result as any)?.Data ?? result
            const totalUsersTargeted = rawObj.totalUsersTargeted ?? rawObj.TotalUsersTargeted ?? 0
            const totalTokensFound = rawObj.totalTokensFound ?? rawObj.TotalTokensFound ?? 0
            const sentCount = rawObj.sentCount ?? rawObj.SentCount ?? 0
            const failedCount = rawObj.failedCount ?? rawObj.FailedCount ?? 0
            const message = rawObj.message ?? rawObj.Message ?? ''
            const detailsList: Record<string, string | undefined>[] = rawObj.details ?? rawObj.Details ?? []

            return (
              <Card className="p-6 flex flex-col gap-4 border-emerald-500/50 shadow-md flex-1">
                <div className="flex items-center gap-3 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                  <h3 className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                    Resultado del Envío
                  </h3>
                </div>
                <p className="text-xs font-semibold leading-relaxed" style={{ color: 'var(--ink-600)' }}>
                  {message}
                </p>

                {/* Grid de Métricas */}
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Cuentas Destino</div>
                    <div className="text-2xl font-black mt-1" style={{ color: 'var(--ink-900)' }}>{totalUsersTargeted}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Dispositivos Detectados</div>
                    <div className="text-2xl font-black mt-1" style={{ color: 'var(--ink-900)' }}>{totalTokensFound}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Entregados OK</div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{sentCount}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">Fallidos</div>
                    <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{failedCount}</div>
                  </div>
                </div>

                {/* Detalle por destinatario */}
                {detailsList.length > 0 && (
                  <div className="mt-3 flex-1 flex flex-col min-h-0">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider mb-3" style={{ color: 'var(--ink-500)' }}>
                      Detalle de Destinatarios ({detailsList.length})
                    </h4>
                    <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[380px]">
                      {detailsList.map((d, i) => {
                        const emailVal = d.email ?? d.Email
                        const rfcVal = d.rfc ?? d.Rfc
                        const userIdVal = d.userId ?? d.UserId ?? ''
                        const statusVal = d.status ?? d.Status ?? 'sent'
                        const tokenVal = d.token ?? d.Token ?? ''
                        const platformVal = d.platform ?? d.Platform ?? 'Web'
                        const msgIdVal = d.messageId ?? d.MessageId
                        const errVal = d.error ?? d.Error

                        const isSent = statusVal.toLowerCase() === 'sent'

                        return (
                          <div key={i} className="p-3 rounded-xl border text-xs flex flex-col gap-1.5 transition hover:shadow-sm" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                            <div className="flex items-center justify-between font-bold">
                              <span className="truncate max-w-[200px] text-sm text-emerald-700 dark:text-emerald-300">
                                {emailVal || rfcVal || `Usuario: ${userIdVal.substring(0, 8)}...`}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-extrabold ${isSent ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                                {isSent ? 'Entregado' : 'Error'}
                              </span>
                            </div>
                            {rfcVal && emailVal && (
                              <div className="text-[11px] font-semibold text-gray-500">RFC: <span className="font-mono text-gray-700 dark:text-gray-300">{rfcVal}</span></div>
                            )}
                            <div className="flex items-center justify-between text-[11px] text-gray-400">
                              <span>Plataforma: <strong className="text-gray-600 dark:text-gray-300">{platformVal}</strong></span>
                              <span className="font-mono text-[10px]">Token: {tokenVal.substring(0, 10)}...</span>
                            </div>
                            {isSent ? (
                              <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Enviado correctamente</div>
                            ) : (
                              <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">{formatErrorMessage(errVal)}</div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </Card>
            )
          })() : (
            <Card className="p-6 flex flex-col items-center justify-center text-center flex-1">
              <Megaphone className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-3" />
              <h3 className="text-base font-bold" style={{ color: 'var(--ink-700)' }}>
                Estado de la Campaña
              </h3>
              <p className="text-xs mt-1 max-w-xs" style={{ color: 'var(--ink-400)' }}>
                Configura el mensaje y presiona &quot;Despachar Notificación Masiva&quot; para visualizar las métricas en tiempo real.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default MarketingScreen
