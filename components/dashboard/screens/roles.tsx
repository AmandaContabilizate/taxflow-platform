'use client'

import { useState } from 'react'
import { RolesCatalog } from '../roles/roles-catalog'
import { UserRoles } from '../roles/user-roles'

const TABS = ['Catálogo de roles', 'Roles por usuario']

export function RolesScreen({ currentUserId }: { currentUserId?: string }) {
  const [tab, setTab] = useState(0)

  return (
    <div className="flex flex-col gap-5 max-w-full">
      <div className="inline-flex gap-1.5 p-1.5 rounded-full self-start" style={{ background: 'var(--muted)' }}>
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className="px-4 py-2 rounded-full text-[13px] font-bold transition"
            style={
              i === tab
                ? { background: 'var(--card)', color: 'var(--ink-900)', boxShadow: 'var(--sh-1)' }
                : { background: 'transparent', color: 'var(--ink-500)' }
            }
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 0 ? <RolesCatalog /> : <UserRoles initialUserId={currentUserId} selfUserId={currentUserId} />}
    </div>
  )
}
