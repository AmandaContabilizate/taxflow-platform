'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  Crown,
  Loader2,
  Palette,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react'
import {
  getNotificationInfo,
  saveNotificationInfo,
} from '@/features/settings/actions/notificationPreferences.action'
import type { NotificationChannelPref, NotificationTypePref } from '@/features/settings/types'
import { DISPLAY } from '../constants'
import { Btn, Card, ErrorState, NoAccessState, Tabs, isForbiddenError } from '../ui'

/**
 * Hub de Configuración (sección SISTEMA): "Configuración del sistema" (gobierno,
 * fase 2) y "Preferencias generales" con tabs — Notificaciones es funcional
 * (preferencias POR USUARIO vía /Notification/info); General, Marca y Operativas
 * llegarán con su tabla de workspace. Cada card/tab se pinta solo con su claim.
 */
export function ConfiguracionScreen({ permissions }: { permissions: string[] }) {
  const perms = useMemo(() => new Set(permissions), [permissions])
  const canRead = perms.has('Sistema.ReadConfiguracion')
  const canNotifs = perms.has('Sistema.ManageNotificacionesInternas')
  const canGobierno = perms.has('Sistema.ReadConfiguracionSistema')

  const [view, setView] = useState<'hub' | 'preferencias'>('hub')

  if (!canRead && !canNotifs && !canGobierno) return <NoAccessState />

  if (view === 'preferencias') {
    return <PreferenciasGenerales canNotifs={canNotifs} onBack={() => setView('hub')} />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        {canGobierno && (
          <Card>
            <div className="p-6 flex flex-col gap-4 h-full">
              <div className="flex items-start justify-between gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'var(--ink-900)', color: '#fff' }}
                >
                  <ShieldCheck size={22} />
                </div>
                <span
                  className="inline-flex items-center gap-1.5 text-[11.5px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--ink-900)', color: '#fff' }}
                >
                  <Crown size={12} /> Solo Super Admin
                </span>
              </div>
              <div>
                <div className="text-[17px] font-extrabold tracking-tight" style={DISPLAY}>
                  Configuración del sistema
                </div>
                <div className="text-[13px] mt-1" style={{ color: 'var(--ink-500)' }}>
                  Integraciones, OAuth, API keys, webhooks, auditoría, feature flags y seguridad de
                  la plataforma.
                </div>
              </div>
              <div className="mt-auto">
                <Btn kind="primary" size="md" disabled>
                  Abrir gobierno de plataforma <ArrowRight size={15} />
                </Btn>
                <div className="text-[11.5px] font-semibold mt-2" style={{ color: 'var(--ink-400)' }}>
                  Próximamente — en construcción
                </div>
              </div>
            </div>
          </Card>
        )}

        {(canRead || canNotifs) && (
          <Card>
            <div className="p-6 flex flex-col gap-4 h-full">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--ink-50)', color: 'var(--ink-700)' }}
              >
                <Settings size={22} />
              </div>
              <div>
                <div className="text-[17px] font-extrabold tracking-tight" style={DISPLAY}>
                  Preferencias generales
                </div>
                <div className="text-[13px] mt-1" style={{ color: 'var(--ink-500)' }}>
                  General, marca, notificaciones internas y preferencias operativas del equipo.
                </div>
              </div>
              <div className="mt-auto">
                <Btn kind="ghost" size="md" onClick={() => setView('preferencias')}>
                  Abrir preferencias <ArrowRight size={15} />
                </Btn>
              </div>
            </div>
          </Card>
        )}
      </div>

      {canGobierno && (
        <div
          className="flex items-start gap-3 px-4 py-3.5 rounded-2xl"
          style={{ background: 'var(--ink-50)', border: '1px solid var(--border)' }}
        >
          <Crown size={17} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--ink-700)' }} />
          <div>
            <div className="text-[13.5px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
              Estás ingresado con acceso total al sistema
            </div>
            <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
              Todas las acciones críticas quedan registradas en el log de auditoría.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const PREF_TABS = ['General', 'Marca', 'Notificaciones', 'Preferencias operativas'] as const

function PreferenciasGenerales({ canNotifs, onBack }: { canNotifs: boolean; onBack: () => void }) {
  // Notificaciones es la única tab funcional; abre ahí directo cuando hay permiso.
  const [tab, setTab] = useState(canNotifs ? 2 : 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition hover:opacity-80 active:scale-[0.97]"
          style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
          aria-label="Volver a Configuración"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <div className="text-[16px] font-extrabold tracking-tight" style={DISPLAY}>
            Preferencias generales
          </div>
          <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
            Configuración operativa del backoffice. Para gobierno de plataforma usa{' '}
            <b>Configuración del sistema</b>.
          </div>
        </div>
      </div>

      <Tabs items={[...PREF_TABS]} active={tab} onChange={setTab} />

      {tab === 2 && canNotifs ? (
        <NotificacionesTab />
      ) : tab === 2 ? (
        <NoAccessState />
      ) : (
        <Card>
          <div className="px-6 py-12 flex flex-col items-center gap-2 text-center">
            {tab === 1 ? (
              <Palette size={26} style={{ color: 'var(--ink-400)' }} />
            ) : (
              <SlidersHorizontal size={26} style={{ color: 'var(--ink-400)' }} />
            )}
            <div className="text-[14px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
              {PREF_TABS[tab]} — próximamente
            </div>
            <div className="text-[12.5px] max-w-[420px]" style={{ color: 'var(--ink-500)' }}>
              Esta sección guardará configuración del workspace (aún no existe su almacenamiento).
              Por ahora, la tab funcional es Notificaciones.
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

/** Switch compacto reutilizado del editor de roles (mismo lenguaje visual). */
function Switch({ on, disabled, title }: { on: boolean; disabled?: boolean; title?: string }) {
  return (
    <span
      title={title}
      className="w-9 h-[22px] rounded-full flex-shrink-0 relative"
      style={{
        background: on ? 'var(--brand-500)' : 'var(--border-strong)',
        opacity: disabled ? 0.45 : 1,
        transition: 'background-color 180ms ease',
      }}
    >
      <span
        className="absolute w-4 h-4 rounded-full"
        style={{
          top: 3,
          left: 3,
          background: '#fff',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.25)',
          transform: on ? 'translateX(14px)' : 'none',
          transition: 'transform 200ms cubic-bezier(0.23, 1, 0.32, 1)',
        }}
      />
    </span>
  )
}

function NotificacionesTab() {
  const [channels, setChannels] = useState<NotificationChannelPref[]>([])
  const [prefs, setPrefs] = useState<NotificationTypePref[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await getNotificationInfo()
    if (res.success) {
      setChannels(res.value.userSuscriptions)
      setPrefs(res.value.usersPreferences)
    } else {
      setError(res.error.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Internas (INTERNA_*) al frente — son las del equipo; las del cliente después.
  const internas = prefs.filter((p) => p.preferenceType.startsWith('INTERNA_'))
  const deCliente = prefs.filter((p) => !p.preferenceType.startsWith('INTERNA_'))

  function toggleType(typeId: number) {
    setPrefs((prev) => prev.map((p) => (p.typeId === typeId ? { ...p, status: !p.status } : p)))
    setDirty(true)
    setSavedAt(null)
  }

  function toggleChannel(chanelId: number) {
    setChannels((prev) =>
      prev.map((c) => (c.chanelId === chanelId ? { ...c, status: !c.status } : c)),
    )
    setDirty(true)
    setSavedAt(null)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    const res = await saveNotificationInfo({
      // WebPush (canal 3) nunca se ENCIENDE desde aquí (requiere token del navegador);
      // el switch de encendido está deshabilitado, así que su estado no cambia.
      userSuscriptions: channels.map((c) => ({ chanelId: c.chanelId, status: c.status })),
      usersPreferences: prefs.map((p) => ({ typeId: p.typeId, status: p.status })),
    })
    setSaving(false)
    if (res.success) {
      setDirty(false)
      setSavedAt(Date.now())
    } else {
      setSaveError(res.error.message)
    }
  }

  if (loading) {
    return (
      <Card>
        <div className="px-6 py-12 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
          <Loader2 size={17} className="animate-spin" /> Cargando tus preferencias…
        </div>
      </Card>
    )
  }
  if (error) {
    return isForbiddenError(error) ? <NoAccessState /> : <ErrorState message={error} />
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="px-5 py-4 border-b flex items-center justify-between gap-3 flex-wrap" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--brand-100)', color: 'var(--brand-700)' }}
            >
              <Bell size={19} />
            </div>
            <div>
              <div className="text-[14.5px] font-extrabold" style={DISPLAY}>
                Notificaciones internas
              </div>
              <div className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
                Estas preferencias son tuyas: cada miembro del equipo decide qué avisos recibe.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {savedAt && !dirty && (
              <span className="inline-flex items-center gap-1 text-[12px] font-bold" style={{ color: 'var(--brand-700)' }}>
                <Check size={13} /> Guardado
              </span>
            )}
            {saveError && (
              <span className="inline-flex items-center gap-1 text-[12px] font-bold" style={{ color: '#9E3A15' }}>
                <AlertCircle size={13} /> {saveError}
              </span>
            )}
            <Btn kind="brand" size="sm" onClick={handleSave} disabled={!dirty || saving}>
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Guardando…
                </>
              ) : (
                'Guardar cambios'
              )}
            </Btn>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-5">
          {internas.length > 0 ? (
            <PrefGroup
              label="Avisos del equipo"
              hint="Eventos operativos del backoffice"
              items={internas}
              onToggle={toggleType}
            />
          ) : (
            <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
              No hay tipos de notificación interna en el catálogo.
            </div>
          )}
          {deCliente.length > 0 && (
            <PrefGroup
              label="Avisos de tu cuenta"
              hint="Los mismos tipos que ve un cliente en la app"
              items={deCliente}
              onToggle={toggleType}
            />
          )}
        </div>
      </Card>

      <Card>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="text-[14px] font-extrabold" style={DISPLAY}>
            Canales de entrega
          </div>
          <div className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
            Por dónde quieres recibir los avisos que tengas encendidos.
          </div>
        </div>
        <div className="p-3 grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {channels.map((c) => {
            const pushOffLock = c.chanelId === 3 && !c.status
            return (
              <button
                key={c.chanelId}
                type="button"
                disabled={pushOffLock}
                onClick={() => toggleChannel(c.chanelId)}
                role="switch"
                aria-checked={c.status}
                className="rounded-xl px-3.5 py-3 flex items-center gap-3 text-left cursor-pointer active:scale-[0.99] disabled:cursor-not-allowed"
                style={{
                  background: c.status ? 'var(--hero-brand-soft)' : 'transparent',
                  border: `1px solid ${c.status ? 'color-mix(in oklab, var(--brand-500) 45%, var(--border))' : 'var(--border)'}`,
                  transition: 'background-color 150ms ease, border-color 150ms ease',
                  opacity: pushOffLock ? 0.6 : 1,
                }}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-bold" style={{ color: 'var(--ink-900)' }}>
                    {c.chanelName}
                  </span>
                  <span className="block text-[11.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                    {pushOffLock
                      ? 'Se activa desde el navegador (requiere permiso de push)'
                      : c.chanelDescription}
                  </span>
                </span>
                <Switch on={c.status} disabled={pushOffLock} />
              </button>
            )
          })}
          {channels.length === 0 && (
            <div className="text-[12.5px] px-2 py-3" style={{ color: 'var(--ink-500)' }}>
              No hay canales configurados en el catálogo.
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

function PrefGroup({
  label,
  hint,
  items,
  onToggle,
}: {
  label: string
  hint: string
  items: NotificationTypePref[]
  onToggle: (typeId: number) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline gap-2 px-0.5">
        <span className="text-[11px] font-extrabold uppercase tracking-[0.08em]" style={{ color: 'var(--ink-500)' }}>
          {label}
        </span>
        <span className="text-[11px]" style={{ color: 'var(--ink-400)' }}>
          {hint}
        </span>
      </div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        {items.map((p) => (
          <button
            key={p.typeId}
            type="button"
            onClick={() => onToggle(p.typeId)}
            role="switch"
            aria-checked={p.status}
            className="rounded-xl px-3.5 py-3 flex items-center gap-3 text-left cursor-pointer active:scale-[0.99]"
            style={{
              background: p.status ? 'var(--hero-brand-soft)' : 'transparent',
              border: `1px solid ${p.status ? 'color-mix(in oklab, var(--brand-500) 45%, var(--border))' : 'var(--border)'}`,
              transition: 'background-color 150ms ease, border-color 150ms ease',
            }}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold leading-tight" style={{ color: 'var(--ink-900)' }}>
                {p.preferenceDescription.replace(/^Interna:\s*/i, '')}
              </span>
              <span className="block text-[10px] font-mono mt-0.5 truncate" style={{ color: 'var(--ink-400)' }}>
                {p.preferenceType}
              </span>
            </span>
            <Switch on={p.status} />
          </button>
        ))}
      </div>
    </div>
  )
}
