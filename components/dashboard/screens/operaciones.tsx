'use client'

import { DeclarationsByTaxpayer } from '../operaciones/declarations-by-taxpayer'

interface CurrentUser {
  userId: string
  fullName: string
}

export function OperacionesScreen({ currentUser }: { currentUser: CurrentUser }) {
  return <DeclarationsByTaxpayer currentUser={currentUser} />
}
