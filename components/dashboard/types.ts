import type { ComponentType } from 'react'

export type Screen =
  | 'home'
  | 'vista-fiscal'
  | 'declaraciones'
  | 'facturas'
  | 'george'
  | 'documentos'
  | 'diagnostico'
  | 'tip-detail'
  | 'tramites'
  | 'plan'
  | 'ayuda'
  | 'manual'
  | 'cuenta'
  | 'estatussat'
  // Pantalla para conectar el SAT (SatConnectScreen); distinta de 'estatussat' (monitoreo)
  | 'estatus-sat'
  | 'aprende'
  | 'permisos'
  // Difusión masiva de notificaciones push (módulo marketing)
  | 'marketing'
  // Roles operativos
  | 'usuarios'
  | 'clientes'
  | 'contribuyentes'
  | 'actividad'
  | 'comisiones'
  | 'mis-tareas'
  | 'bandeja'
  | 'notificaciones'
  | 'centro-notificaciones'
  | 'upsell'
  | 'clientes-asignados'
  | 'pipelines-por-etapa'
  | 'mis-clientes'
  | 'regularizaciones'
  | 'declaraciones-anuales'
  | 'catalogos'
  | 'configuracion'
  | 'equipo-operaciones'
  | 'renovaciones'
  | 'asignaciones'
  | 'equipo'
  // Catálogos comerciales del módulo de comisiones
  | 'partners'
  | 'codigos-descuento'
  | 'reportes-ejecutivos'
  | 'operaciones'
  | 'declaraciones-rechazadas'
  | 'declaraciones-futuras'
  | 'tramites-adicionales'
  | 'ventas'
  | 'roles'
  | 'partnership'

export type RoleKey =
  | 'guest'
  | 'external-provider'
  | 'developer'
  | 'administrator'
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
  /** Pill destacado junto al label (ej. "Nuevo" para features recién lanzadas). */
  badge?: string
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
