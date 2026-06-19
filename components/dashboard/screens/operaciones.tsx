'use client'

import { DECLARATION_KIND } from '@/features/operations/types'
import { PaidPendingList } from '../operaciones/paid-pending-list'

export function OperacionesScreen() {
  return (
    <PaidPendingList
      kind={DECLARATION_KIND.FUTURE_PLAN}
      help="Declaraciones de planes a futuro ya pagadas y pendientes de presentar. Búscalas por cliente, RFC o periodo y dales seguimiento."
      emptyText="No hay declaraciones de planes a futuro pendientes"
    />
  )
}
