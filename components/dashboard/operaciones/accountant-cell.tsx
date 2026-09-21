import { Users } from 'lucide-react'

interface Props {
  accountantName?: string | null
  accountantUserId?: string | null
}

/**
 * Celda "Contador" de los listados operativos (Centro de operaciones, Declaraciones futuras,
 * Declaraciones rechazadas): mismo dato y misma lectura que la columna de Clientes. Sin
 * asignación se dice explícito, no se deja un guion.
 */
export function AccountantCell({ accountantName, accountantUserId }: Props) {
  const assigned = Boolean(accountantUserId || accountantName)
  if (!assigned) {
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap"
        style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)' }}
      >
        Sin asignar
      </span>
    )
  }
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <Users size={13} className="shrink-0" style={{ color: 'var(--ink-500)' }} />
      <span className="font-semibold text-[13px] truncate" style={{ color: 'var(--ink-900)' }}>
        {accountantName ?? '—'}
      </span>
    </div>
  )
}
