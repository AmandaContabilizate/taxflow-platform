'use client'

import { PurchasedDeclarations } from '../operaciones/purchased-declarations'

interface CurrentUser {
  userId: string
  fullName: string
}

/** Igual que Centro de operaciones, pero acotado a periodos posteriores al mes actual. */
export function DeclaracionesFuturasScreen({ currentUser }: { currentUser: CurrentUser }) {
  return <PurchasedDeclarations mode="future" futureOnly currentUser={currentUser} />
}
