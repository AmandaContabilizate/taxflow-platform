'use client'

import { KeyRound, ShieldCheck, UserCheck } from 'lucide-react'
import { useState } from 'react'
import { RolesCatalog } from '../roles/roles-catalog'
import { UserRoles } from '../roles/user-roles'

const TABS = ['Catálogo de roles', 'Roles por usuario']

export function RolesScreen({ currentUserId, currentUserEmail }: { currentUserId?: string; currentUserEmail?: string }) {
  const [tab, setTab] = useState(0)

  return (
    <div className="flex flex-col gap-5 max-w-full">
      {/* Cómo funciona el modelo: rol → permisos → usuario */}
      <div
        className="rounded-2xl px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-4"
        style={{ background: 'var(--helpbox-bg)', border: '1px solid var(--helpbox-border)' }}
      >
        {[
          {
            Icon: ShieldCheck,
            title: '1 · El rol es el puesto',
            text: 'Ejemplo: Seller, Accounter, CommercialManager. Agrupa lo que ese puesto puede hacer.',
          },
          {
            Icon: KeyRound,
            title: '2 · Los permisos son las llaves',
            text: 'Cada permiso habilita una acción concreta en el sistema (ver roles, aprobar asignaciones, correr el cierre…). Sin el permiso, el servidor rechaza la acción.',
          },
          {
            Icon: UserCheck,
            title: '3 · El usuario recibe roles',
            text: 'En "Roles por usuario" asignas el puesto a cada persona. Al iniciar sesión, su token carga los permisos de su rol activo.',
          },
        ].map((s) => (
          <div key={s.title} className="flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--helpbox-accent-bg)', color: 'var(--helpbox-text)' }}
            >
              <s.Icon size={17} />
            </div>
            <div className="min-w-0">
              <div className="text-[12.5px] font-extrabold" style={{ color: 'var(--helpbox-text)' }}>
                {s.title}
              </div>
              <p className="text-[12px] mt-0.5 leading-snug" style={{ color: 'var(--helpbox-text)', opacity: 0.85 }}>
                {s.text}
              </p>
            </div>
          </div>
        ))}
      </div>

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

      {tab === 0 ? <RolesCatalog /> : <UserRoles initialUserId={currentUserId} selfUserId={currentUserId} selfEmail={currentUserEmail} />}
    </div>
  )
}
