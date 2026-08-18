'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { useRfcStore } from '@/features/taxpayers/stores/rfcStore'
import { MONO } from './constants'

interface RFCSelectorProps {
  compact?: boolean
}

export function RFCSelector({ compact = false }: RFCSelectorProps) {
  const { rfcs, selectedRfc, loading: loadingRfcs, setSelectedRfc } = useRfcStore()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative ${compact ? 'w-full' : 'w-52'}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loadingRfcs || rfcs.length === 0}
        className={`w-full appearance-none ${compact ? 'px-3 py-2 text-[12px]' : 'px-4 py-3 text-[13px]'} font-semibold leading-tight outline-none disabled:opacity-50 cursor-pointer transition-all duration-200 flex items-center justify-between rounded-xl`}
        style={{
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          border: isOpen ? '1.5px solid #5D50A5' : '1px solid rgba(231,228,244, 0.8)',
          color: '#332670',
          ...MONO,
        }}
      >
        <span>{selectedRfc || (loadingRfcs ? 'Cargando…' : 'Sin RFC')}</span>
        <ChevronDown
          size={compact ? 14 : 16}
          style={{
            color: '#857AC0',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms'
          }}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute top-full left-0 right-0 ${compact ? 'mt-1' : 'mt-1'} rounded-xl shadow-lg z-50 overflow-hidden`}
          style={{
            background: 'white',
            border: '1px solid #E7E4F4',
          }}
        >
          <div className={compact ? 'max-h-48' : 'max-h-64'}>
            {rfcs.map((rfc) => (
              <button
                key={rfc.rfc}
                onClick={() => {
                  setSelectedRfc(rfc.rfc)
                  setIsOpen(false)
                }}
                className={`w-full text-left ${compact ? 'px-3 py-2 text-[12px]' : 'px-4 py-3 text-[13px]'} font-semibold transition-colors duration-150 hover:bg-gray-50`}
                style={{
                  background: selectedRfc === rfc.rfc ? '#150C3D' : 'white',
                  color: selectedRfc === rfc.rfc ? 'white' : '#332670',
                  ...MONO,
                }}
              >
                {rfc.rfc}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Border glow en focus */}
      {isOpen && (
        <div
          className="absolute inset-0 rounded-xl opacity-100 transition-opacity duration-200 pointer-events-none"
          style={{
            border: '1.5px solid #5D50A5',
            boxShadow: '0 0 12px rgba(93,80,165, 0.15)'
          }}
        />
      )}
    </div>
  )
}
