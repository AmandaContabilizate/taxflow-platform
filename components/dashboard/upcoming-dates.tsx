'use client'

import { useMemo } from 'react'
import { DISPLAY } from './constants'
import { Card, Divider } from './ui'

const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MONTHS_FULL = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

interface UpcomingDate {
  day: string
  mo: string
  title: string
  sub: string
  daysLeft: number
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function daysBetween(from: Date, to: Date): number {
  const MS = 24 * 60 * 60 * 1000
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / MS)
}

function describeDaysLeft(days: number): string {
  if (days < 0) return 'ya venció'
  if (days === 0) return 'hoy'
  if (days === 1) return 'mañana'
  return `en ${days} días`
}

/**
 * Calcula las próximas fechas fiscales relevantes para la persona física:
 *  - Declaración mensual: vence el día 17 del mes siguiente al periodo declarado.
 *  - Declaración anual personas físicas: 30 de abril del año siguiente al ejercicio.
 *  - DIOT mensual: último día del mes siguiente al periodo.
 */
function computeUpcomingDates(today: Date): UpcomingDate[] {
  const result: UpcomingDate[] = []
  const year = today.getFullYear()
  const month = today.getMonth() // 0-based

  // 1) Próxima declaración MENSUAL: busca el día 17 más cercano que no haya pasado.
  //    Si hoy es <= 17 del mes actual, la próxima vence el 17 de este mes
  //    y declara el periodo del mes anterior. Si ya pasó, vence el 17 del mes siguiente
  //    y declara el mes actual.
  let monthlyDueYear = year
  let monthlyDueMonth = month
  if (today.getDate() > 17) {
    monthlyDueMonth = month + 1
    if (monthlyDueMonth > 11) {
      monthlyDueMonth = 0
      monthlyDueYear += 1
    }
  }
  const monthlyDueDate = new Date(monthlyDueYear, monthlyDueMonth, 17)
  const declaredPeriodIndex = monthlyDueMonth === 0 ? 11 : monthlyDueMonth - 1
  const declaredPeriodYear = monthlyDueMonth === 0 ? monthlyDueYear - 1 : monthlyDueYear
  const monthlyDaysLeft = daysBetween(today, monthlyDueDate)
  result.push({
    day: '17',
    mo: MONTHS_SHORT[monthlyDueMonth],
    title: `Declaración mensual de ${MONTHS_FULL[declaredPeriodIndex]}${declaredPeriodYear !== monthlyDueYear ? ` ${declaredPeriodYear}` : ''}`,
    sub: `${capitalize(describeDaysLeft(monthlyDaysLeft))} · tu contador la prepara`,
    daysLeft: monthlyDaysLeft,
  })

  // 2) Declaración ANUAL personas físicas: 30 de abril.
  //    Si ya pasó este año, salta al 30 de abril del año siguiente
  //    (en ese caso, ya declara el ejercicio del año en curso).
  const aprilEndThisYear = new Date(year, 3, 30) // mes 3 = abril
  const anualDueDate = aprilEndThisYear >= startOfDay(today) ? aprilEndThisYear : new Date(year + 1, 3, 30)
  const anualExercise = anualDueDate.getFullYear() - 1
  const anualDaysLeft = daysBetween(today, anualDueDate)
  result.push({
    day: '30',
    mo: MONTHS_SHORT[3],
    title: `Declaración anual ${anualExercise}`,
    sub: `${capitalize(describeDaysLeft(anualDaysLeft))} · ya estamos trabajando en ella`,
    daysLeft: anualDaysLeft,
  })

  // 3) Siguiente mensual (la que sigue a la próxima), para dar visibilidad de mediano plazo.
  let nextMonthlyDueMonth = monthlyDueMonth + 1
  let nextMonthlyDueYear = monthlyDueYear
  if (nextMonthlyDueMonth > 11) {
    nextMonthlyDueMonth = 0
    nextMonthlyDueYear += 1
  }
  const nextMonthlyDueDate = new Date(nextMonthlyDueYear, nextMonthlyDueMonth, 17)
  const nextDeclaredPeriodIndex = nextMonthlyDueMonth === 0 ? 11 : nextMonthlyDueMonth - 1
  const nextDeclaredPeriodYear = nextMonthlyDueMonth === 0 ? nextMonthlyDueYear - 1 : nextMonthlyDueYear
  const nextMonthlyDaysLeft = daysBetween(today, nextMonthlyDueDate)
  result.push({
    day: '17',
    mo: MONTHS_SHORT[nextMonthlyDueMonth],
    title: `Declaración mensual de ${MONTHS_FULL[nextDeclaredPeriodIndex]}${nextDeclaredPeriodYear !== nextMonthlyDueYear ? ` ${nextDeclaredPeriodYear}` : ''}`,
    sub: `${capitalize(describeDaysLeft(nextMonthlyDaysLeft))} · todavía hay tiempo`,
    daysLeft: nextMonthlyDaysLeft,
  })

  return result.sort((a, b) => a.daysLeft - b.daysLeft)
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function UpcomingDates() {
  const dates = useMemo(() => computeUpcomingDates(new Date()), [])

  return (
    <div>
      <div className="text-[18px] font-bold mb-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
        Próximas fechas
      </div>
      <div className="text-[13.5px] mb-4" style={{ color: 'var(--ink-500)' }}>
        Estas son las fechas importantes para que no se te pase nada.
      </div>
      <Card>
        <div className="p-2">
          {dates.map((d, i) => {
            const urgent = d.daysLeft <= 7
            const muted = d.daysLeft > 30
            return (
              <div key={`${d.mo}-${d.day}-${i}`}>
                {i > 0 && <Divider />}
                <DateRow
                  day={d.day}
                  mo={d.mo}
                  title={d.title}
                  sub={d.sub}
                  urgent={urgent}
                  muted={muted}
                />
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

interface DateRowProps {
  day: string
  mo: string
  title: string
  sub: string
  urgent?: boolean
  muted?: boolean
}

function DateRow({ day, mo, title, sub, urgent, muted }: DateRowProps) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5">
      <div
        className="w-14 text-center flex-shrink-0 rounded-xl py-2"
        style={{ background: urgent ? 'var(--coral-soft)' : 'var(--ink-50)' }}
      >
        <div
          className="text-[24px] font-extrabold leading-none"
          style={{
            ...DISPLAY,
            color: urgent ? '#9E3A15' : muted ? 'var(--ink-400)' : 'var(--ink-900)',
          }}
        >
          {day}
        </div>
        <div
          className="text-[10px] tracking-widest uppercase font-extrabold mt-1"
          style={{ color: urgent ? '#9E3A15' : 'var(--ink-400)' }}
        >
          {mo}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-bold text-[14.5px] ${muted ? 'opacity-70' : ''}`}>{title}</div>
        <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
          {sub}
        </div>
      </div>
    </div>
  )
}
