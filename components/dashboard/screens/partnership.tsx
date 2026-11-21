'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { getPartnerApiStatus } from '@/features/partnership/actions/partnerTaxpayers.action'
import { ApiKeysTab } from '../partnership/api-keys-tab'
import { CorsTab } from '../partnership/cors-tab'
import { TaxpayersTab } from '../partnership/taxpayers-tab'
import { WebhooksTab } from '../partnership/webhooks-tab'
import { KeysTab } from '../partnership/keys-tab'
import { LoginsTab } from '../partnership/logins-tab'
import { useHasPermission } from '../permissions'
import { Tabs } from '../ui'

type TabId = 'cors' | 'keys' | 'api-keys' | 'webhooks' | 'taxpayers' | 'logins'

/**
 * Integraciones. CORS, Keys (SSO / llaves de firma) y Logins siguen visibles para el administrador
 * del aliado como antes; API Keys solo con Empresa.IntegracionesApiKeys y Contribuyentes solo con
 * Empresa.IntegracionesContribuyentes (Partner API v1).
 */
export function PartnershipScreen() {
  const canApiKeys = useHasPermission('Empresa.IntegracionesApiKeys')
  const canTaxpayers = useHasPermission('Empresa.IntegracionesContribuyentes')
  const canWebhooks = useHasPermission('Empresa.IntegracionesWebhooks')
  const tabs = useMemo(() => {
    const list: { id: TabId; label: string }[] = [
      { id: 'cors', label: 'CORS' },
      { id: 'keys', label: 'Keys' },
    ]
    if (canApiKeys) list.push({ id: 'api-keys', label: 'API Keys' })
    if (canWebhooks) list.push({ id: 'webhooks', label: 'Webhooks' })
    if (canTaxpayers) list.push({ id: 'taxpayers', label: 'Contribuyentes' })
    list.push({ id: 'logins', label: 'Ver Logins' })
    return list
  }, [canApiKeys, canTaxpayers, canWebhooks])
  const [tab, setTab] = useState(0)
  const [apiStatus, setApiStatus] = useState<{ fullySuspended: boolean; onboardingBlocked: boolean } | null>(null)
  useEffect(() => {
    if (!canApiKeys && !canTaxpayers) return
    void getPartnerApiStatus().then((r) => {
      if (r.success) setApiStatus(r.value)
    })
  }, [canApiKeys, canTaxpayers])
  const current = tabs[Math.min(tab, tabs.length - 1)].id

  return (
    <div className="flex flex-col gap-5 max-w-full">
      {apiStatus && (apiStatus.fullySuspended || apiStatus.onboardingBlocked) && (
        <div
          className="flex items-start gap-2 rounded-xl px-4 py-3 text-[13px] font-semibold"
          style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)' }}
        >
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            {apiStatus.fullySuspended
              ? 'La API para aliados de su empresa está suspendida: todas las llamadas responden 403. Comuníquese con su ejecutivo de Contabilízate.'
              : 'Las altas e invitaciones de contribuyentes por la API están bloqueadas. Las consultas siguen funcionando. Comuníquese con su ejecutivo de Contabilízate.'}
          </span>
        </div>
      )}

      <Tabs items={tabs.map((t) => t.label)} active={tab} onChange={setTab} />

      {current === 'cors' && <CorsTab />}
      {current === 'keys' && <KeysTab />}
      {current === 'api-keys' && <ApiKeysTab />}
      {current === 'webhooks' && <WebhooksTab />}
      {current === 'taxpayers' && <TaxpayersTab />}
      {current === 'logins' && <LoginsTab />}
    </div>
  )
}
