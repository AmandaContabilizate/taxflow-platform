import type { ComponentType } from 'react'

export type Screen =
  | 'home'
  | 'vista-fiscal'
  | 'declaraciones'
  | 'facturas'
  | 'documentos'
  | 'diagnostico'
  | 'tip-detail'
  | 'tramites'
  | 'plan'
  | 'ayuda'
  | 'manual'
  | 'cuenta'
  | 'estatus-sat'
  | 'permisos'
  // Roles operativos
  | 'usuarios'
  | 'clientes'
  | 'contribuyentes'
  | 'actividad'
  | 'comisiones'
  | 'mis-tareas'
  | 'bandeja'
  | 'notificaciones'
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
  | 'operaciones'
  | 'tramites-adicionales'
  | 'ventas'
  | 'roles'
  | 'partnership'

export type RoleKey =
  | 'guest'
  | 'external-provider'
  | 'developer'
  | 'seller'
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

export interface NavSection {
  section?: string
  items: NavDef[]
}

export interface DashboardProps {
  fullName: string
  email: string
  rfc: string | null
  role: string | null
  permissions: string[]
  userId?: string | null
  phoneNumber?: string | null
}

export type GoFn = (s: Screen) => void
