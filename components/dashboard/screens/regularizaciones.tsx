'use client'

import { DECLARATION_KIND } from '@/features/operations/types'
import { PaidPendingList } from '../operaciones/paid-pending-list'

export function RegularizacionesScreen() {
  return (
    <PaidPendingList
      kind={DECLARATION_KIND.REGULARIZATION}
      help="Declaraciones de regularización ya pagadas y pendientes de presentar. Búscalas por cliente, RFC o periodo y dales seguimiento."
      emptyText="No hay regularizaciones pendientes"
    />
  )
}
