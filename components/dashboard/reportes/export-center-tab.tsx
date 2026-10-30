'use client'

import { AlertCircle, FileText } from 'lucide-react'
import { useHasPermission } from '../permissions'
import { Card } from '../ui'
import { DeclaracionesExportCard } from './declaraciones-export-card'
import { RenovacionesExportCard } from './renovaciones-export-card'

interface ExportCenterTabProps {
  initialYear: number
  initialMonth: number
}

/**
 * Hub centralizador de descargas y exportaciones de reportes,
 * segmentado por claims y permisos de cada área/departamento.
 */
export function ExportCenterTab({ initialYear, initialMonth }: ExportCenterTabProps) {
  // Permisos para el área contable / operaciones
  const canDeclaraciones =
    useHasPermission('Contador.ReadDeclaraciones') ||
    useHasPermission('Dashboard.GerenciaContable') ||
    useHasPermission('GerenciaContable.ReadEquipoOperaciones') ||
    useHasPermission('Backoffice.ViewDashboard')

  // Permisos para el área de SAC / Comercial / Renovaciones
  const canRenovaciones =
    useHasPermission('Comercial.ReadRenovaciones') ||
    useHasPermission('Dashboard.GerenciaComercial') ||
    useHasPermission('Backoffice.ViewDashboard')

  const hasAnyReport = canDeclaraciones || canRenovaciones

  return (
    <div className="flex flex-col gap-6">
      {canDeclaraciones && (
        <DeclaracionesExportCard initialYear={initialYear} initialMonth={initialMonth} />
      )}

      {canRenovaciones && (
        <RenovacionesExportCard />
      )}

      {!hasAnyReport && (
        <Card className="p-8 text-center flex flex-col items-center justify-center gap-3" style={{ background: 'var(--card)' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--muted)', color: 'var(--ink-500)' }}>
            <FileText size={24} />
          </div>
          <div>
            <h4 className="text-[15px] font-bold" style={{ color: 'var(--ink-900)' }}>
              No tienes reportes asignados a tu rol
            </h4>
            <p className="text-[13px] mt-1 text-balance" style={{ color: 'var(--ink-500)' }}>
              Tu perfil actual no cuenta con permisos para exportar declaraciones o renovaciones de clientes. Contacta a un administrador para solicitar acceso.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
