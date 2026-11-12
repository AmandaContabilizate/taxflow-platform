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
  // Programa de referidos del cliente (desde Mi cuenta)
  | 'referidos'
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
  // Cancelación lógica de declaraciones y clientes (gerencia comercial)
  | 'cancelaciones'
  | 'equipo'
  // Catálogos comerciales del módulo de comisiones
  | 'partners'
  // Cola del gerente: personas de empresa listas para activar (spec-perfil-empresa §5.4)
  | 'empresas-activaciones'
  // Vista interna de empresas (Gerencia Comercial / soporte), solo lectura
  | 'empresas-vista'
  | 'codigos-descuento'
  // Catálogo de productos: planes, trámites y servicios (Backoffice.ReadProductos / ManageProductos)
  | 'productos'
  // Cola de aprovisionamiento de servicios adicionales (Backoffice.AprovisionamientoServicios)
  | 'aprovisionamiento'
  | 'reportes-ejecutivos'
  | 'operaciones'
  | 'declaraciones-rechazadas'
  // Concentrado de PorPresentar (11) con semáforo de posteo y "Enviar" (GO)
  | 'declaraciones-por-presentar'
  | 'declaraciones-futuras'
  // Ventas pagadas sin activar (spec-ventas-por-activar)
  | 'ventas-por-activar'
  | 'tramites-adicionales'
  | 'ventas'
  | 'roles'
  | 'partnership'
  // Portal "Mi empresa" (spec-perfil-empresa): usuarios de la alianza, menú por claims Empresa.*
  | 'empresa-resumen'
  | 'empresa-personas'
  | 'empresa-invitaciones'
  | 'empresa-carga-masiva'
  | 'empresa-diagnostico'
  | 'empresa-facturacion'
  | 'empresa-usuarios'
  | 'reglas-deducibilidad'
  // Bandeja global de actividades sin régimen (Gerente de Operaciones)
  | 'actividades-pendientes'
  // Monitor de solicitudes de descarga SAT/Fispal (solo Developer)
  | 'monitor-descargas'

export type RoleKey =
  | 'guest'
  | 'external-provider'
  // Roles Empresa.* (ResponsableFiscal, RecursosHumanos, Operaciones, Auditor, ConsultaEjecutiva):
  // usuarios de una alianza; su menú sale solo de sus claims Empresa.*.
  | 'empresa'
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
  /** Nombre del partner que administra el acceso (iframe); null si puede cambiar su correo. */
  emailChangeBlockedBy?: string | null
  /** Tutorial de bienvenida al primer ingreso del Guest (TUTORIAL_AUTOSTART_ENABLED). */
  tutorialAutostart?: boolean
}

export type GoFn = (s: Screen) => void
