'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'

/** Select genérico de filtro, sin acoplamiento a ningún modelo. Compartido por
 *  comprobantes y recálculo. */
export function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: [T, string][]
}) {
  return (
    <label className="flex flex-col gap-1 min-w-[150px] flex-1">
      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full px-3 py-2.5 rounded-lg text-[13px]"
        style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  )
}

/** Modal selector de columnas, parametrizado por `defs`. Las columnas fijas
 *  (las que no aparecen en `defs`) no se listan aquí. */
export function ColumnsModal<K extends string>({
  open,
  onOpenChange,
  defs,
  selected,
  onChange,
  fixedColumnsHint,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  defs: { key: K; label: string }[]
  selected: K[]
  onChange: (next: K[]) => void
  /** Texto que describe las columnas fijas, ej. "Fecha y Folio / UUID siempre se muestran." */
  fixedColumnsHint: string
}) {
  const toggle = (key: K) => {
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Columnas de la tabla</DialogTitle>
          <DialogDescription>{fixedColumnsHint}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1 max-h-[55vh] overflow-y-auto -mx-1 px-1">
          {defs.map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-muted"
            >
              <Checkbox checked={selected.includes(key)} onCheckedChange={() => toggle(key)} />
              <span className="text-[13px]" style={{ color: 'var(--foreground)' }}>
                {label}
              </span>
            </label>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
