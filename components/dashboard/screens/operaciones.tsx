'use client'

import { PurchasedDeclarations } from '../operaciones/purchased-declarations'

interface CurrentUser {
  userId: string
  fullName: string
}

export function OperacionesScreen({ currentUser }: { currentUser: CurrentUser }) {
  return <PurchasedDeclarations mode="future" currentUser={currentUser} />
}
