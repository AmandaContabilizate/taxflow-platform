'use client'

import { useMemo, useState } from 'react'
import { ApiKeysTab } from '../partnership/api-keys-tab'
import { CorsTab } from '../partnership/cors-tab'
import { KeysTab } from '../partnership/keys-tab'
import { LoginsTab } from '../partnership/logins-tab'
import { useHasPermission } from '../permissions'
import { Tabs } from '../ui'

type TabId = 'cors' | 'keys' | 'api-keys' | 'logins'

/**
 * Integraciones. CORS, Keys (SSO / llaves de firma) y Logins siguen visibles para el administrador
 * del aliado como antes; API Keys solo con Empresa.IntegracionesApiKeys (Partner API v1).
 */
export function PartnershipScreen() {
  const canApiKeys = useHasPermission('Empresa.IntegracionesApiKeys')
  const tabs = useMemo(() => {
    const list: { id: TabId; label: string }[] = [
      { id: 'cors', label: 'CORS' },
      { id: 'keys', label: 'Keys' },
    ]
    if (canApiKeys) list.push({ id: 'api-keys', label: 'API Keys' })
    list.push({ id: 'logins', label: 'Ver Logins' })
    return list
  }, [canApiKeys])
  const [tab, setTab] = useState(0)
  const current = tabs[Math.min(tab, tabs.length - 1)].id

  return (
    <div className="flex flex-col gap-5 max-w-full">
      <Tabs items={tabs.map((t) => t.label)} active={tab} onChange={setTab} />

      {current === 'cors' && <CorsTab />}
      {current === 'keys' && <KeysTab />}
      {current === 'api-keys' && <ApiKeysTab />}
      {current === 'logins' && <LoginsTab />}
    </div>
  )
}
