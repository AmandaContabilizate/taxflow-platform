'use client'

import { useState, useEffect, useRef } from 'react'
import {
  ExternalLink,
  Cloud,
  ShoppingCart,
  Settings,
  Loader2,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react'
import { getTimbramePortalAccess } from '@/features/timbrame/actions/getTimbramePortalAccess.action'
import { DISPLAY } from '../constants'
import type { GoFn } from '../types'
import { Btn, Card, Pill } from '../ui'

interface Props {
  go: GoFn
}

const TIMBRAME_BLUE = '#7339FD'

export function TimbrameSSOCard({ go }: Props) {
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [ssoUrl, setSsoUrl] = useState<string | null>(null)
  const checkAccessRef = useRef(false)

  useEffect(() => {
    if (checkAccessRef.current) return
    checkAccessRef.current = true

    const verifyAccess = async () => {
      setLoading(true)
      setErrorMsg(null)
      setErrorCode(null)

      const result = await getTimbramePortalAccess()

      if (result.success && result.value?.token && result.value?.portalUrl) {
        const url = `${result.value.portalUrl}?token=${result.value.token}`
        setSsoUrl(url)
        window.open(url, '_blank', 'noopener,noreferrer')
      } else if (!result.success) {
        setErrorMsg(
          result.error.message ||
            'Ocurrió un error al conectar con el portal de facturación.'
        )
        setErrorCode(result.error.errorCode || null)
      }
      setLoading(false)
    }

    void verifyAccess()
  }, [])

  const handleAccessPortal = () => {
    if (ssoUrl) {
      window.open(ssoUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const getFriendlyErrorMessage = () => {
    if (errorCode === 'TIMBRAME_NO_PENDING_DECLARATIONS') {
      return (
        errorMsg ||
        'Para acceder al módulo de Facturación necesitas contar con un plan activo contratado con nosotros. Te invitamos a adquirir uno para comenzar a emitir tus comprobantes.'
      )
    }
    if (errorCode === 'TIMBRAME_USER_NOT_FOUND') {
      return (
        errorMsg ||
        'Antes de generar una factura, debes agregar tu RFC y configurar tus datos fiscales en la sección de Perfil.'
      )
    }
    if (errorCode === 'TIMBRAME_REGISTRATION_FAILED') {
      return (
        errorMsg ||
        'No se pudo completar el registro automático. Asegúrate de tener al menos un régimen fiscal activo configurado en tu perfil.'
      )
    }
    return errorMsg
  }

  const isWarning = errorCode === 'TIMBRAME_NO_PENDING_DECLARATIONS'

  return (
    <Card>
      <div className="p-6 lg:p-8 relative overflow-hidden flex flex-col gap-6">
        {/* Halo decorativo con color de marca Timbrame */}
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none opacity-40 dark:opacity-20"
          style={{
            background: `radial-gradient(circle, ${TIMBRAME_BLUE}44 0%, transparent 70%)`,
          }}
        />

        {/* Header con identidad de marca Timbrame + Powered by Detecno */}
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: `${TIMBRAME_BLUE}15`,
                color: TIMBRAME_BLUE,
              }}
            >
              <Cloud size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="text-2xl font-extrabold tracking-tight"
                  style={{ ...DISPLAY, color: 'var(--foreground)' }}
                >
                  timb<span style={{ color: TIMBRAME_BLUE }}>r</span>ame
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--ink-500)' }}>
                Portal de Facturación Electrónica (CFDI 4.0)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <img
              src="/detecnoicon.png"
              alt="Detecno"
              className="w-7 h-7 flex-shrink-0"
            />
            <span
              className="text-[10px] font-extrabold tracking-[0.25em]"
              style={{ color: 'var(--ink-500)' }}
            >
              POWERED BY DETECNO
            </span>
          </div>
        </div>

        {/* Descripción general */}
        <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-700)' }}>
          Ingresa directamente al portal interactivo oficial de facturación de{' '}
          <strong>Tímbrame</strong> para emitir facturas, gestionar tus
          catálogos de clientes, productos y consultar el historial completo
          de tus comprobantes fiscales con inicio de sesión único (SSO).
        </p>

        {/* Estado de carga */}
        {loading && (
          <div className="flex items-center gap-3 py-4 text-sm font-medium text-muted-foreground">
            <Loader2 className="animate-spin text-primary" size={20} />
            <span>Verificando acceso a Facturación...</span>
          </div>
        )}

        {/* Mensaje de error / restricción */}
        {!loading && errorMsg && (
          <div
            className={`p-4 rounded-xl border flex flex-col gap-3.5 ${
              isWarning
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {isWarning ? (
                <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
              ) : (
                <AlertCircle className="text-rose-500 flex-shrink-0 mt-0.5" size={20} />
              )}
              <p className="text-sm font-medium leading-normal">
                {getFriendlyErrorMessage()}
              </p>
            </div>

            {/* Acciones contextuales segun error */}
            <div className="flex flex-wrap gap-2 pt-1">
              {errorCode === 'TIMBRAME_NO_PENDING_DECLARATIONS' && (
                <Btn size="md" kind="primary" onClick={() => go('plan')}>
                  <ShoppingCart size={16} /> Contratar Plan
                </Btn>
              )}

              {(errorCode === 'TIMBRAME_USER_NOT_FOUND' ||
                errorCode === 'TIMBRAME_REGISTRATION_FAILED') && (
                <Btn size="md" kind="ghost" onClick={() => go('cuenta')}>
                  <Settings size={16} /> Configurar Datos Fiscales
                </Btn>
              )}
            </div>
          </div>
        )}

        {/* Botón de acceso exitoso (manual si se bloqueó popup) */}
        {!loading && ssoUrl && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Btn size="lg" kind="primary" onClick={handleAccessPortal}>
                <ExternalLink size={18} /> Ingresar al Portal de Facturación
              </Btn>
              <Pill kind="brand">
                <ShieldCheck size={12} /> Conexión SSO Segura
              </Pill>
            </div>
            <p className="text-xs italic text-muted-foreground">
              * Si no fuiste redirigido automáticamente, haz clic en el botón
              para abrir el portal o permite las ventanas emergentes en tu
              navegador.
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
