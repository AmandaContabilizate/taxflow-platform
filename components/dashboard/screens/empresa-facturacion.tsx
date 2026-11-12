'use client'

import { EstadosCuentaPanel } from '../empresa/estados-cuenta'

/** Facturación de mi empresa (spec §5.5): estados de cuenta mensuales, liga de pago de Stripe o transferencia. */
export function EmpresaFacturacionScreen({ partnershipId }: { partnershipId?: number } = {}) {
  return (
    <div className="flex flex-col gap-5 max-w-full">
      <EstadosCuentaPanel mode="empresa" partnershipId={partnershipId} />
    </div>
  )
}
