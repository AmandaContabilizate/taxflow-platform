'use client'

import { format, setYear } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { DayPicker } from 'react-day-picker'
import * as Popover from '@radix-ui/react-popover'
import 'react-day-picker/dist/style.css'

const dayPickerStyles = `
  .rdp-selected:not([disabled]) {
    background-color: var(--brand-700) !important;
    color: #fff !important;
  }
  .rdp-selected:not([disabled]):hover {
    background-color: var(--brand-800) !important;
  }
`

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  placeholder?: string
}

export function DatePicker({ value, onChange, placeholder = 'Seleccionar fecha' }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [showYearPicker, setShowYearPicker] = useState(false)
  const [yearRange, setYearRange] = useState(new Date().getFullYear() - 5)

  const selectedDate = value ? new Date(value + 'T00:00:00') : undefined
  const currentYear = selectedDate?.getFullYear() || new Date().getFullYear()

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const isoDate = date.toISOString().split('T')[0]
      onChange(isoDate)
      setOpen(false)
    }
  }

  const handleYearSelect = (year: number) => {
    if (selectedDate) {
      const newDate = setYear(selectedDate, year)
      handleSelect(newDate)
    } else {
      const newDate = setYear(new Date(), year)
      handleSelect(newDate)
    }
    setShowYearPicker(false)
  }

  const years = Array.from({ length: 12 }, (_, i) => yearRange + i)

  return (
    <>
      <style>{dayPickerStyles}</style>
      <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className="w-full px-4 py-2.5 rounded-lg border text-[13px] flex items-center justify-between transition hover:opacity-90"
          style={{ borderColor: 'var(--border)', background: 'var(--input)' }}
        >
          <span style={{ color: value ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
            {value ? format(new Date(value + 'T00:00:00'), 'dd/MM/yyyy', { locale: es }) : placeholder}
          </span>
          <Calendar size={16} style={{ color: 'var(--muted-foreground)' }} />
        </button>
      </Popover.Trigger>

      <Popover.Content
        className="z-50 rounded-lg border shadow-lg p-3"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        side="bottom"
        align="center"
        sideOffset={12}
        avoidCollisions={false}
      >
        {showYearPicker ? (
          <div className="w-56 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setYearRange(yearRange - 12)}
                className="p-0.5 hover:opacity-60 transition"
              >
                <ChevronLeft size={16} style={{ color: 'var(--foreground)' }} />
              </button>
              <span className="font-semibold text-[12px]" style={{ color: 'var(--foreground)' }}>
                {yearRange}-{yearRange + 11}
              </span>
              <button
                onClick={() => setYearRange(yearRange + 12)}
                className="p-0.5 hover:opacity-60 transition"
              >
                <ChevronRight size={16} style={{ color: 'var(--foreground)' }} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => handleYearSelect(year)}
                  className="py-1.5 px-2 rounded text-[11px] font-semibold transition"
                  style={{
                    background: year === currentYear ? 'var(--brand-700)' : 'var(--brand-50)',
                    color: year === currentYear ? '#fff' : 'var(--brand-700)',
                    border: `1px solid ${year === currentYear ? 'var(--brand-700)' : 'var(--brand-200)'}`,
                  }}
                >
                  {year}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowYearPicker(false)}
              className="w-full py-1.5 rounded text-[11px] font-semibold transition"
              style={{ background: 'var(--input)', color: 'var(--foreground)' }}
            >
              Aceptar
            </button>
          </div>
        ) : (
          <div className="space-y-0">
            <button
              onClick={() => setShowYearPicker(true)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[12px] font-semibold transition"
              style={{ background: 'var(--input)', color: 'var(--foreground)' }}
            >
              <span>{currentYear}</span>
              <ChevronDown size={14} />
            </button>

            <div className="scale-85 origin-center flex justify-center -mt-6">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={handleSelect}
                locale={es}
                disabled={(date) => date > new Date()}
                showOutsideDays={true}
              />
            </div>
          </div>
        )}
      </Popover.Content>
    </Popover.Root>
    </>
  )
}
