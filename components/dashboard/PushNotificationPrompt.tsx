'use client'

import { useState, useEffect } from 'react'
import { Bell, X, CheckCircle2 } from 'lucide-react'
import { registerPushTokenAction } from '@/features/notifications/actions/registerPushToken.action'

interface PushNotificationPromptProps {
  userId?: string | null
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function PushNotificationPrompt({ userId }: PushNotificationPromptProps) {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activated, setActivated] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((e) => console.error('[SW Error]', e))
    }

    const autoPrompt = async () => {
      const dismissed = sessionStorage.getItem('push_prompt_dismissed')
      if (Notification.permission === 'default' && !dismissed) {
        setVisible(true)
        // Invocar la solicitud nativa del navegador en automático
        try {
          await handleActivate()
        } catch {
          // Ignorar bloqueos automáticos silenciosos
        }
      } else if (Notification.permission === 'granted') {
        // Asegurar registro de suscripción WebPush activa
        handleActivate().catch(() => {})
      }
    }

    const timer = setTimeout(autoPrompt, 1000)
    return () => clearTimeout(timer)
  }, [userId])

  const handleActivate = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    setLoading(true)

    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        // Suscribirse a notificaciones WebPush nativas en Chrome/Edge/Safari
        if ('serviceWorker' in navigator && userId) {
          try {
            const registration = await navigator.serviceWorker.ready
            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_KEY || 'BCghqt_-po6BnjkILA7dGJlQPuJzmTA_Hf8xcyH3fifg3sD8nqo9-b6HArT1IEub0F4OVGBftQcBYNuQ7Ih5glY'
            const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey)

            let pushSubscription = await registration.pushManager.getSubscription()
            if (!pushSubscription) {
              pushSubscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey as BufferSource,
              })
            }

            if (pushSubscription) {
              const tokenJsonStr = JSON.stringify(pushSubscription.toJSON())
              await registerPushTokenAction({ userId: userId, token: tokenJsonStr, platformId: 4 })
            }
          } catch (swErr) {
            console.error('[WebPush Native Subscription Error]', swErr)
          }
        }

        setActivated(true)
        setTimeout(() => setVisible(false), 3000)
      } else {
        setVisible(false)
      }
    } catch (err) {
      console.error('Error activando notificaciones:', err)
      setVisible(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    sessionStorage.setItem('push_prompt_dismissed', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="w-full mb-6 p-4 rounded-2xl border bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/30 dark:border-emerald-500/20 shadow-sm transition-all animate-in fade-in slide-in-from-top-2">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
            {activated ? <CheckCircle2 className="w-5 h-5" /> : <Bell className="w-5 h-5 animate-bounce" />}
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              {activated ? '¡Notificaciones Activadas!' : 'Activa Notificaciones en este Dispositivo'}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed max-w-2xl">
              {activated
                ? 'Este dispositivo ya está listo para recibir alertas de vencimientos del SAT y avisos importantes de Contabilízate.'
                : 'Recibe alertas al instante sobre tus fechas límite del SAT, recordatorios de declaraciones y notificaciones de facturación.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!activated && (
            <>
              <button
                type="button"
                onClick={handleActivate}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
              >
                {loading ? 'Activando...' : 'Activar Notificaciones'}
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                title="Ahora no"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
