'use client'

import { useEffect, useState } from 'react'
import { Moon, Search, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export function DashboardHeader() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-end gap-3 w-full">
        <button
          disabled
          className="flex-1 max-w-[400px] px-4 py-2.5 rounded-full flex items-center gap-2 transition-all hover:shadow-sm"
          style={{ background: '#fff', border: '1px solid #e5e7eb', color: '#999' }}
        >
          <Search size={18} />
          <span className="text-sm">Buscar página, acción o documento...</span>
          <span className="ml-auto text-xs font-semibold opacity-40">⌘K</span>
        </button>
        <div className="p-2.5 rounded-lg" style={{ background: 'transparent' }} />
        <div className="p-2 rounded-full flex items-center justify-center" style={{ width: '32px', height: '32px', background: '#f3f4f6', border: '1px solid #e5e7eb' }} />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-end gap-3 w-full">
      {/* Buscador */}
      <button
        onClick={() => {}}
        className="flex-1 max-w-[400px] px-4 py-2.5 rounded-full flex items-center gap-2 transition-all hover:shadow-sm"
        style={{ background: '#fff', border: '1px solid #e5e7eb', color: '#999' }}
      >
        <Search size={18} />
        <span className="text-sm">Buscar página, acción o documento...</span>
        <span className="ml-auto text-xs font-semibold opacity-40">⌘K</span>
      </button>

      {/* Botones de tema */}
      <button
        onClick={() => setTheme('light')}
        className="p-2.5 rounded-lg transition-all"
        style={{
          background: theme === 'light' ? '#fef3c7' : 'transparent',
          color: theme === 'light' ? '#f59e0b' : '#999',
        }}
        title="Modo claro"
      >
        <Sun size={18} />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className="p-2 rounded-full transition-all flex items-center justify-center"
        style={{
          background: theme === 'dark' ? '#1e293b' : '#f3f4f6',
          color: theme === 'dark' ? '#fff' : '#9ca3af',
          width: '32px',
          height: '32px',
          border: theme === 'dark' ? 'none' : '1px solid #e5e7eb',
        }}
        title="Modo oscuro"
      >
        <Moon size={18} />
      </button>
    </div>
  )
}
