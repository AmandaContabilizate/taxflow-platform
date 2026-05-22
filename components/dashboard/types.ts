import type { ComponentType } from 'react'

export type Screen =
  | 'home'
  | 'declaraciones'
  | 'facturas'
  | 'documentos'
  | 'diagnostico'
  | 'aprende'
  | 'tip-detail'
  | 'tramites'
  | 'plan'
  | 'ayuda'
  | 'cuenta'
  | 'estatus-sat'
  | 'permisos'
  // Roles operativos
  | 'usuarios'
  | 'clientes'
  | 'actividad'
  | 'comisiones'
  | 'mis-tareas'
  | 'bandeja'
  | 'upsell'
  | 'clientes-asignados'
  | 'pipelines-por-etapa'
  | 'mis-clientes'
  | 'regularizaciones'
  | 'declaraciones-anuales'
  | 'catalogos'
  | 'renovaciones'
  | 'asignaciones'
  | 'equipo'
  | 'reportes-ejecutivos'

export type RoleKey =
  | 'guest'
  | 'ventas'
  | 'atencion-clientes'
  | 'accounter'
  | 'renovaciones'
  | 'gerencia-comercial'
  | 'gerente-sac'
  | 'gerente-operaciones'

export interface NavDef {
  id: Screen
  label: string
  Icon: ComponentType<{ size?: number }>
  hint: string
}

export interface DashboardProps {
  fullName: string
  email: string
  rfc: string | null
  role: string | null
  permissions: string[]
}

export type GoFn = (s: Screen) => void
