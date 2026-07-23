import { Clock, MessageCircle, Sparkles } from 'lucide-react'
import { useHasRfc } from '@/features/taxpayers/stores/rfcStore'
import { DISPLAY } from '../constants'
import type { GoFn } from '../types'
import { Badge, Btn, Card, HelpBox, Pill } from '../ui'
import { NeedsSatConnect } from './needs-sat-connect'

interface Props {
  go: GoFn
}

// Único color literal: el azul de marca Timbrame (identidad fija, no cambia con el tema)
const TIMBRAME_BLUE = '#2541E8'

export function FacturasScreen({ go }: Props) {
  const { hasRfc, loading } = useHasRfc()
  if (loading) return null
  if (!hasRfc) return <NeedsSatConnect go={go} feature="emitir facturas" />

  return (
    <div className="flex flex-col gap-5">
      <HelpBox>
        Estamos terminando la conexión con <strong>Timbrame</strong>, nuestro proveedor de facturación electrónica
        autorizado por el SAT. En cuanto esté lista, podrás emitir tus CFDI directo desde aquí.
      </HelpBox>

      <Card>
        <div className="p-8 lg:p-10 text-center relative overflow-hidden">
          {/* Halo azul de marca — sutil, funciona en ambos temas */}
          <div
            className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, ${TIMBRAME_BLUE}33 0%, transparent 70%)` }}
          />

          <div className="relative flex flex-col items-center gap-5">
            <Pill kind="default">
              <Clock size={12} /> Próximamente
            </Pill>

            {/* Wordmark estilizado tipo Timbrame */}
            <div className="flex items-center gap-3 mt-1">
              <span
                className="text-[52px] lg:text-[64px] font-extrabold tracking-tight leading-none"
                style={{ ...DISPLAY, color: 'var(--foreground)' }}
              >
                timb
                <span style={{ color: TIMBRAME_BLUE }}>r</span>
                ame
              </span>
              <img
                src="/detecnoicon.png"
                alt="Detecno"
                className="w-12 h-12 lg:w-14 lg:h-14 flex-shrink-0"
              />
            </div>
            <div
              className="text-[10.5px] font-extrabold tracking-[0.35em] -mt-2"
              style={{ color: 'var(--ink-500)' }}
            >
              POWERED BY DETECNO
            </div>

            <div
              className="text-[22px] lg:text-[26px] font-extrabold tracking-tight max-w-[520px] mt-4"
              style={{ ...DISPLAY, color: 'var(--ink-900)' }}
            >
              Estamos conectando con Timbrame
            </div>
            <div className="text-[14px] max-w-[480px]" style={{ color: 'var(--ink-500)' }}>
              Pronto vas a poder emitir, cancelar y consultar tus facturas (CFDI 4.0) sin salir de Contabilízate. Te
              avisaremos en cuanto esté lista la integración.
            </div>

            <div className="flex flex-wrap gap-3 justify-center mt-3">
              <Badge kind="brand">
                <Sparkles size={10} /> CFDI 4.0
              </Badge>
              <Badge kind="default">PAC certificado por el SAT</Badge>
            </div>

            <div className="mt-5">
              <Btn size="lg" kind="ghost">
                <MessageCircle size={18} /> Avísame cuando esté listo
              </Btn>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
