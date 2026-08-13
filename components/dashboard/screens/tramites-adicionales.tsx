'use client'

import { ProceduresList } from '../operaciones/procedures-list'
import type { GoFn } from '../types'

interface Props {
  go: GoFn
}

export function TramitesAdicionalesScreen({ go }: Props) {
  return <ProceduresList go={go} />
}
