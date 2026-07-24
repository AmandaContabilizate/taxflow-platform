'use client'

import { useState } from 'react'
import { CorsTab } from '../partnership/cors-tab'
import { KeysTab } from '../partnership/keys-tab'
import { LoginsTab } from '../partnership/logins-tab'
import { Tabs } from '../ui'

const TABS = ['CORS', 'Keys', 'Ver Logins']

export function PartnershipScreen() {
  const [tab, setTab] = useState(0)

  return (
    <div className="flex flex-col gap-5 max-w-full">
      <Tabs items={TABS} active={tab} onChange={setTab} />

      {tab === 0 && <CorsTab />}
      {tab === 1 && <KeysTab />}
      {tab === 2 && <LoginsTab />}
    </div>
  )
}
