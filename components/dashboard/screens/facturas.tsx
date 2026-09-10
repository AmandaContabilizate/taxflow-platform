import { useHasRfc, useRfcStore } from '@/features/taxpayers/stores/rfcStore'
import type { GoFn } from '../types'
import { CiecWarningBanner, HelpBox } from '../ui'
import { getCiecBlockStatus, isConnectedByEfirmaOnly, isSatConnected } from '../sat-connection.utils'
import { CiecBlockedScreen } from './ciec-blocked'
import { NeedsSatConnect } from './needs-sat-connect'
import { TimbrameSSOCard } from '../timbrame/timbrame-sso-card'

interface Props {
  go: GoFn
}

export function FacturasScreen({ go }: Props) {
  const { hasRfc, loading } = useHasRfc()
  const { selectedRfcInfo } = useRfcStore()
  if (loading) return null
  if (!hasRfc) return <NeedsSatConnect go={go} feature="emitir facturas" />
  // D1: facturación es de las tres pantallas que también bloquean en estado 0 (sin verificar).
  const ciecBlock = getCiecBlockStatus(selectedRfcInfo)
  if (!isSatConnected(selectedRfcInfo) && !ciecBlock) return <NeedsSatConnect go={go} feature="emitir facturas" />
  if (ciecBlock) return <CiecBlockedScreen go={go} state={ciecBlock} />

  return (
    <div className="flex flex-col gap-5">
      {isConnectedByEfirmaOnly(selectedRfcInfo) && <CiecWarningBanner go={go} variant="efirma" />}
      <HelpBox>
        Bienvenido a tu módulo de facturación electrónica. Haz clic en el botón a continuación para ingresar al portal interactivo oficial de <strong>Timbrame</strong> y gestionar tus comprobantes fiscales.
      </HelpBox>

      <TimbrameSSOCard go={go} />
    </div>
  )
}
