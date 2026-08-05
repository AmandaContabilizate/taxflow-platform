import { useHasRfc } from '@/features/taxpayers/stores/rfcStore'
import type { GoFn } from '../types'
import { HelpBox } from '../ui'
import { NeedsSatConnect } from './needs-sat-connect'
import { TimbrameSSOCard } from '../timbrame/timbrame-sso-card'

interface Props {
  go: GoFn
}

export function FacturasScreen({ go }: Props) {
  const { hasRfc, loading } = useHasRfc()
  if (loading) return null
  if (!hasRfc) return <NeedsSatConnect go={go} feature="emitir facturas" />

  return (
    <div className="flex flex-col gap-5">
      <HelpBox>
        Bienvenido a tu módulo de facturación electrónica. Haz clic en el botón a continuación para ingresar al portal interactivo oficial de <strong>Timbrame</strong> y gestionar tus comprobantes fiscales.
      </HelpBox>

      <TimbrameSSOCard go={go} />
    </div>
  )
}
