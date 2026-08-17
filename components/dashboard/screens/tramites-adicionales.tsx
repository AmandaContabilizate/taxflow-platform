'use client'

import { ProceduresList } from '../operaciones/procedures-list'
import type { GoFn } from '../types'

interface Props {
  go: GoFn
}

// ProceduresList no navega hacia fuera; se conserva la prop go por la firma
// homogénea de screens en components/dashboard/index.tsx.
export function TramitesAdicionalesScreen(_props: Props) {
  return <ProceduresList />
}
