import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  CheckSquare,
  Ban,
  ClipboardList,
  CloudDownload,
  DollarSign,
  FilePlus,
  FilePlus2,
  FileText,
  FolderLock,
  Gem,
  HelpCircle,
  Home,
  Hourglass,
  Inbox,
  KanbanSquare,
  KeyRound,
  Layers,
  Lightbulb,
  PiggyBank,
  Package,
  Workflow,
  Receipt,
  RefreshCw,
  RotateCcw,
  ScanLine,
  Settings,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Stethoscope,
  Send,
  Target,
  TrendingUp,
  LayoutGrid,
  UserCog,
  UserPlus,
  Upload,
  Users,
  Zap,
  Megaphone,
} from 'lucide-react'
import type { NavDef, NavSection, RoleKey, Screen } from './types'

export const DISPLAY = { fontFamily: 'var(--font-display)' } as const
export const MONO = { fontFamily: 'var(--font-mono)' } as const

export const TITLES: Record<Screen, [string, string]> = {
  home: ['Hola 👋', 'Aquí tienes lo importante de hoy'],
  declaraciones: ['Mis declaraciones', 'Tus impuestos mes con mes, sin complicarte'],
  'vista-fiscal': ['Tu vida fiscal', 'Todas tus herramientas en un solo lugar'],
  facturas: ['Mis facturas', 'Las facturas que emites a tus clientes'],
  george: ['Foto → Facturas', 'Convierte la foto de tus recibos en facturas CFDI'],
  documentos: ['Mi bóveda', 'Tus documentos y facturas del SAT, en un solo lugar'],
  diagnostico: ['Diagnóstico fiscal', 'Cómo estás y qué puedes mejorar'],
  estatussat: ['Estatus ante SAT', 'Monitoreo continuo de listas y cumplimiento'],
  'estatus-sat': ['Conecta tu SAT', 'Vincula tu RFC para activar tu información fiscal'],
  'centro-notificaciones': ['Centro de Notificaciones', 'Tus avisos fiscales, pre-reportes contables y alertas del sistema'],
  aprende: ['Aprende', 'Lecciones cortas para entender tus impuestos'],
  'tip-detail': ['Lección', 'Aprende algo útil en pocos minutos'],
  tramites: ['Trámites adicionales', 'Servicios extra que puedes contratar cuando los necesites'],
  plan: ['Mi plan', 'Tu suscripción y opciones de pago'],
  ayuda: ['Ayuda y tutoriales', 'Aprende a tu ritmo, paso a paso'],
  manual: ['Manual de usuario', 'Guía completa de cómo usar Contabilízate'],
  cuenta: ['Mi cuenta', 'Tus datos y preferencias'],
  referidos: ['Referidos', 'Comparte tu código y gana créditos por cada cliente que compre'],
  permisos: ['Modificador de permisos', 'Edita los permisos asignados a tu rol'],
  // Roles operativos
  usuarios: ['Usuarios', 'Todas las cuentas registradas en la plataforma'],
  clientes: ['Clientes', 'Contribuyentes con ventas pagadas'],
  contribuyentes: ['Contribuyentes', 'Padrón completo de contribuyentes'],
  actividad: ['Actividad', 'Movimientos y eventos recientes'],
  comisiones: ['Comisiones', 'Tus comisiones y liquidaciones'],
  'mis-tareas': ['Mis tareas', 'Pendientes asignados a ti'],
  bandeja: ['Bandeja', 'Solicitudes y mensajes entrantes'],
  notificaciones: ['Marketing & Difusión', 'Envío masivo de notificaciones Push, In-App y Correo'],
  upsell: ['Upsell', 'Oportunidades para ampliar servicios'],
  'clientes-asignados': ['Clientes asignados', 'Tu cartera de atención'],
  'pipelines-por-etapa': ['Pipelines por etapa', 'Estado de tus oportunidades'],
  'mis-clientes': ['Mis clientes', 'Clientes bajo tu contabilidad'],
  regularizaciones: ['Regularizaciones', 'Casos en regularización fiscal'],
  'declaraciones-anuales': ['Declaraciones anuales', 'Declaraciones del ejercicio'],
  catalogos: ['Catálogos', 'Catálogos maestros del sistema'],
  configuracion: ['Configuración', 'Selecciona la sección a la que quieres entrar. El acceso depende de tu rol y permisos.'],
  'equipo-operaciones': ['Equipo de operaciones', 'Carga operativa y avance por contador. Da de alta nuevos miembros desde aquí.'],
  renovaciones: ['Renovaciones', 'Planes por vencer y quién ya canceló su renovación'],
  asignaciones: ['Asignaciones de venta', 'Gestiona clientes sin vendedor y solicita reasignaciones para aprobación de Administración'],
  cancelaciones: ['Cancelaciones', 'Baja lógica de declaraciones y clientes'],
  equipo: ['Equipo', 'Tu plantilla comercial. Da de alta nuevos miembros desde aquí.'],
  partners: ['Partners', 'Alta de partners y alianzas B2B2C, con sus códigos automáticos'],
  'empresas-activaciones': ['Activaciones de empresa', 'Personas de empresas listas para activar: venta a futuro pagada por la empresa'],
  'empresas-vista': ['Empresas', 'Resumen, personas y facturación de cada empresa, como los ve su administrador'],
  'codigos-descuento': ['Códigos de descuento', 'Códigos por dueño: ejecutivos, finder fees y partners'],
  productos: ['Catálogo de productos', 'Planes, trámites adicionales y servicios de proveedores: precios, regímenes y Stripe'],
  aprovisionamiento: ['Aprovisionamiento', 'Cola de altas y bajas de servicios en Timbrame, Venvers y Doc2Sign: tareas manuales, reintentos y bitácora'],
  'reportes-ejecutivos': ['Reportes ejecutivos', 'KPIs y resultados del área'],
  operaciones: ['Centro de operaciones', 'Gestión y supervisión de declaraciones fiscales'],
  'declaraciones-rechazadas': ['Declaraciones rechazadas', 'Declaraciones que el cliente rechazó y esperan corrección'],
  'declaraciones-por-presentar': ['Declaraciones por presentar', 'Listas para el robot o pausadas por alguna validación'],
  'declaraciones-futuras': ['Declaraciones futuras', 'Declaraciones compradas de periodos posteriores al mes actual'],
  'ventas-por-activar': ['Ventas por activar', 'Ventas pagadas sin declaraciones activadas y ligas de pago emitidas'],
  'tramites-adicionales': ['Trámites adicionales', 'Seguimiento de trámites vendidos a tus clientes'],
  ventas: ['Ventas', 'Resumen de ventas registradas por cuenta'],
  roles: ['Roles y permisos', 'Administra roles, sus permisos y los roles de cada usuario'],
  partnership: ['Integraciones', 'Administra CORS, llaves SSO y bitácora de logins'],
  'empresa-resumen': ['Resumen', 'Cómo va el seguimiento fiscal de tu empresa'],
  'empresa-personas': ['Personas vinculadas', 'Gestiona invitaciones, diagnóstico y documentación'],
  'empresa-invitaciones': ['Invitaciones', 'Invita personas y da seguimiento a su avance de registro'],
  'empresa-carga-masiva': ['Carga masiva', 'Invita personas en lote mediante un archivo Excel o CSV'],
  'empresa-diagnostico': ['Diagnóstico fiscal', 'Tablero consolidado del ecosistema. El semáforo es orientativo y no sustituye una evaluación fiscal especializada'],
  'empresa-facturacion': ['Facturación', 'Estados de cuenta mensuales y pagos de tu empresa'],
  'empresa-usuarios': ['Usuarios de mi empresa', 'Quién entra al portal de tu empresa y con qué rol'],
  'reglas-deducibilidad': [
    'Deducibilidad forzada',
    'Overrides de deducibilidad por clave producto/servicio: quién los puso, para quién y por qué',
  ],
  marketing: ['Marketing & Difusión', 'Envío masivo de notificaciones Push'],
  'monitor-descargas': [
    'Monitor de descargas',
    'Descargas SAT en curso y las que cerraron en las últimas 24 horas, por estatus',
  ],
  'actividades-pendientes': [
    'Actividades pendientes',
    'Contribuyentes con regímenes de baja sin actividades o actividades sin régimen',
  ],
}

const GUEST_NAV: NavDef[] = [
  { id: 'home', label: 'Inicio', Icon: Home, hint: 'Tu resumen del día' },
  { id: 'vista-fiscal', label: 'Vista fiscal', Icon: LayoutGrid, hint: 'Tu vida fiscal' },
  { id: 'diagnostico', label: 'Diagnóstico', Icon: Stethoscope, hint: 'Tu situación fiscal' },
  { id: 'declaraciones', label: 'Declaraciones', Icon: FileText, hint: 'Tus impuestos del mes' },
  { id: 'facturas', label: 'Facturación', Icon: FilePlus, hint: 'Emite y revisa facturas' },
  { id: 'george', label: 'Recibos → Facturas', Icon: Receipt, hint: 'Convierte recibos en facturas' },
  { id: 'documentos', label: 'Bóveda', Icon: FolderLock, hint: 'Tu bóveda digital de CFDI y constancias' },
  { id: 'centro-notificaciones', label: 'Notificaciones', Icon: Bell, hint: 'Tus avisos y notificaciones' },
  { id: 'tramites', label: 'Trámites', Icon: FilePlus2, hint: 'Servicios extra' },
  { id: 'plan', label: 'Mi plan', Icon: Gem, hint: 'Tu suscripción' },
  { id: 'ayuda', label: 'Ayuda', Icon: HelpCircle, hint: 'Tutoriales y dudas' },
  { id: 'manual', label: 'Manual', Icon: BookOpen, hint: 'Guía de usuario' },
]

export const GUEST_NAV_GROUPED: NavSection[] = [
  {
    items: [
      { id: 'home', label: 'Inicio', Icon: Home, hint: 'Tu resumen del día' },
    ]
  },
  {
    section: 'FISCAL',
    items: [
      { id: 'vista-fiscal', label: 'Vista fiscal', Icon: LayoutGrid, hint: 'Tu vida fiscal' },
      { id: 'diagnostico', label: 'Diagnóstico', Icon: Stethoscope, hint: 'Tu situación fiscal' },
      { id: 'estatussat', label: 'Estatus SAT', Icon: Activity, hint: 'Monitoreo SAT' },
      { id: 'declaraciones', label: 'Declaraciones', Icon: FileText, hint: 'Tus impuestos del mes' },
      { id: 'facturas', label: 'Facturación', Icon: FilePlus, hint: 'Emite y revisa facturas' },
      { id: 'george', label: 'Foto → Facturas', Icon: ScanLine, hint: 'Convierte fotos de recibos en facturas', badge: 'Pronto' },
      { id: 'documentos', label: 'Bóveda', Icon: FolderLock, hint: 'Tu bóveda digital de CFDI y constancias' },
    ]
  },
  {
    section: 'CUENTA',
    items: [
      { id: 'centro-notificaciones', label: 'Notificaciones', Icon: Bell, hint: 'Tus avisos y notificaciones' },
      { id: 'tramites', label: 'Trámites', Icon: FilePlus2, hint: 'Servicios extra' },
      { id: 'plan', label: 'Mi plan', Icon: Gem, hint: 'Tu suscripción' },
    ]
  },
  {
    section: 'AYUDA',
    items: [
      { id: 'ayuda', label: 'Ayuda', Icon: HelpCircle, hint: 'Tutoriales y dudas' },
      { id: 'manual', label: 'Manual', Icon: BookOpen, hint: 'Guía de usuario' },
    ]
  },
]

// Compatibilidad: algunos componentes externos siguen importando NAV.
export const NAV: NavDef[] = GUEST_NAV

export const PERMISOS_NAV: NavDef = {
  id: 'permisos',
  label: 'Permisos',
  Icon: ShieldCheck,
  hint: 'Modificador de permisos',
}

const DASHBOARD_ITEM: NavDef = { id: 'home', label: 'Dashboard', Icon: Home, hint: 'Tu resumen' }
const USUARIOS_ITEM: NavDef = { id: 'usuarios', label: 'Usuarios', Icon: Users, hint: 'Cuentas registradas' }
const CLIENTES_ITEM: NavDef = { id: 'clientes', label: 'Clientes', Icon: Briefcase, hint: 'Cartera de clientes' }
const ACTIVIDAD_ITEM: NavDef = { id: 'actividad', label: 'Actividad', Icon: Activity, hint: 'Eventos recientes' }
const COMISIONES_ITEM: NavDef = { id: 'comisiones', label: 'Comisiones', Icon: DollarSign, hint: 'Tus comisiones' }
const MIS_TAREAS_ITEM: NavDef = { id: 'mis-tareas', label: 'Mis tareas', Icon: CheckSquare, hint: 'Pendientes' }
const BANDEJA_ITEM: NavDef = { id: 'bandeja', label: 'Bandeja', Icon: Inbox, hint: 'Mensajes entrantes' }
const NOTIFICACIONES_ITEM: NavDef = {
  id: 'notificaciones',
  label: 'Marketing & Difusión',
  Icon: Megaphone,
  hint: 'Envío masivo de notificaciones Push, In-App y Correo',
}
const UPSELL_ITEM: NavDef = { id: 'upsell', label: 'Upsell', Icon: TrendingUp, hint: 'Oportunidades' }
const CLIENTES_ASIGNADOS_ITEM: NavDef = {
  id: 'clientes-asignados',
  label: 'Clientes asignados',
  Icon: UserPlus,
  hint: 'Tu cartera',
}
const PIPELINES_ITEM: NavDef = {
  id: 'pipelines-por-etapa',
  label: 'Pipelines por etapa',
  Icon: KanbanSquare,
  hint: 'Estado de oportunidades',
}
const PIPELINE_ITEM: NavDef = {
  id: 'pipelines-por-etapa',
  label: 'Pipeline por etapa',
  Icon: KanbanSquare,
  hint: 'Estado de oportunidades',
}
const MIS_CLIENTES_ITEM: NavDef = { id: 'mis-clientes', label: 'Mis clientes', Icon: Briefcase, hint: 'Tus clientes' }
const CONTRIBUYENTES_ITEM: NavDef = {
  id: 'contribuyentes',
  label: 'Contribuyentes',
  Icon: Users,
  hint: 'Padrón completo',
}
const REGULARIZACIONES_ITEM: NavDef = {
  id: 'regularizaciones',
  label: 'Regularizaciones',
  Icon: RotateCcw,
  hint: 'Casos en regularización',
}
const DECLARACIONES_ANUALES_ITEM: NavDef = {
  id: 'declaraciones-anuales',
  label: 'Declaraciones anuales',
  Icon: FileText,
  hint: 'Del ejercicio',
}
const TRAMITES_ADICIONALES_ITEM: NavDef = {
  id: 'tramites-adicionales',
  label: 'Trámites adicionales',
  Icon: Receipt,
  hint: 'Trámites vendidos',
}
const CATALOGOS_ITEM: NavDef = { id: 'catalogos', label: 'Catálogos', Icon: Layers, hint: 'Maestros del sistema' }
const CONFIGURACION_ITEM: NavDef = {
  id: 'configuracion',
  label: 'Configuración',
  Icon: Settings,
  hint: 'Preferencias y gobierno',
}
const EQUIPO_OPERACIONES_ITEM: NavDef = {
  id: 'equipo-operaciones',
  label: 'Equipo de operaciones',
  Icon: Users,
  hint: 'Carga y avance por contador',
}
const RENOVACIONES_ITEM: NavDef = {
  id: 'renovaciones',
  label: 'Renovaciones',
  Icon: RefreshCw,
  hint: 'Planes por vencer',
}
const ASIGNACIONES_ITEM: NavDef = {
  id: 'asignaciones',
  label: 'Asignaciones',
  Icon: ClipboardList,
  hint: 'Reparto de cartera',
}
const CANCELACIONES_ITEM: NavDef = {
  id: 'cancelaciones',
  label: 'Cancelaciones',
  Icon: Ban,
  hint: 'Baja lógica de declaraciones y clientes',
}
const EQUIPO_ITEM: NavDef = { id: 'equipo', label: 'Equipo', Icon: Users, hint: 'Tu equipo' }
const PARTNERS_ITEM: NavDef = {
  id: 'partners',
  label: 'Partners',
  Icon: Briefcase,
  hint: 'Partners y alianzas B2B2C',
}
const EMPRESAS_ACTIVACIONES_ITEM: NavDef = {
  id: 'empresas-activaciones',
  label: 'Activaciones de empresa',
  Icon: Zap,
  hint: 'Personas listas para activar',
}
const EMPRESAS_VISTA_ITEM: NavDef = {
  id: 'empresas-vista',
  label: 'Empresas',
  Icon: Building2,
  hint: 'Seguimiento por empresa (solo lectura)',
}
const PRODUCTOS_ITEM: NavDef = {
  id: 'productos',
  label: 'Catálogo de productos',
  Icon: Package,
  hint: 'Planes, trámites y servicios que se venden',
}
const APROVISIONAMIENTO_ITEM: NavDef = {
  id: 'aprovisionamiento',
  label: 'Aprovisionamiento',
  Icon: Workflow,
  hint: 'Altas y bajas en proveedores de servicios',
}
const CODIGOS_DESCUENTO_ITEM: NavDef = {
  id: 'codigos-descuento',
  label: 'Códigos de descuento',
  Icon: Receipt,
  hint: 'Códigos por dueño y campaña',
}
const REPORTES_ITEM: NavDef = {
  id: 'reportes-ejecutivos',
  label: 'Reportes ejecutivos',
  Icon: BarChart3,
  hint: 'KPIs y resultados',
}
const OPERACIONES_ITEM: NavDef = {
  id: 'operaciones',
  label: 'Centro de operaciones',
  Icon: Briefcase,
  hint: 'Gestión de declaraciones',
}
const VENTAS_POR_ACTIVAR_ITEM: NavDef = {
  id: 'ventas-por-activar',
  label: 'Ventas por activar',
  Icon: Hourglass,
  hint: 'Pagadas sin declaraciones',
}
const DECLARACIONES_RECHAZADAS_ITEM: NavDef = {
  id: 'declaraciones-rechazadas',
  label: 'Declaraciones rechazadas',
  Icon: Ban,
  hint: 'Rechazadas por el cliente',
}
const DECLARACIONES_POR_PRESENTAR_ITEM: NavDef = {
  id: 'declaraciones-por-presentar',
  label: 'Declaraciones por presentar',
  Icon: Send,
  hint: 'Pausadas y listas para presentar',
}
const DECLARACIONES_FUTURAS_ITEM: NavDef = {
  id: 'declaraciones-futuras',
  label: 'Declaraciones futuras',
  Icon: Calendar,
  hint: 'Periodos posteriores al mes actual',
}
const VENTAS_ITEM: NavDef = {
  id: 'ventas',
  label: 'Ventas',
  Icon: ShoppingCart,
  hint: 'Resumen de ventas',
}
const ROLES_ITEM: NavDef = {
  id: 'roles',
  label: 'Roles y permisos',
  Icon: ShieldCheck,
  hint: 'Administra roles y permisos',
}
const PARTNERSHIP_ITEM: NavDef = {
  id: 'partnership',
  label: 'Integraciones',
  Icon: KeyRound,
  hint: 'CORS, llaves SSO y logins',
}
// Portal "Mi empresa" (spec-perfil-empresa §5): lo que ve una alianza sobre sus propias personas.
// Nombres alineados al prototipo HTML (decisión 2026-10-28): Resumen · Personas · Facturación · Usuarios · Integraciones.
const EMPRESA_RESUMEN_ITEM: NavDef = {
  id: 'empresa-resumen',
  label: 'Resumen',
  Icon: Building2,
  hint: 'Cómo va tu empresa',
}
const EMPRESA_PERSONAS_ITEM: NavDef = {
  id: 'empresa-personas',
  label: 'Personas vinculadas',
  Icon: Users,
  hint: 'Personas en seguimiento fiscal',
}
const EMPRESA_INVITACIONES_ITEM: NavDef = {
  id: 'empresa-invitaciones',
  label: 'Invitaciones',
  Icon: Send,
  hint: 'Invita y da seguimiento',
}
const EMPRESA_CARGA_MASIVA_ITEM: NavDef = {
  id: 'empresa-carga-masiva',
  label: 'Carga masiva',
  Icon: Upload,
  hint: 'Personas en lote desde Excel o CSV',
}
const EMPRESA_DIAGNOSTICO_ITEM: NavDef = {
  id: 'empresa-diagnostico',
  label: 'Diagnóstico fiscal',
  Icon: Activity,
  hint: 'Semáforo y hallazgos del ecosistema',
}
const EMPRESA_FACTURACION_ITEM: NavDef = {
  id: 'empresa-facturacion',
  label: 'Facturación',
  Icon: Receipt,
  hint: 'Estados de cuenta y pagos',
}
const EMPRESA_USUARIOS_ITEM: NavDef = {
  id: 'empresa-usuarios',
  label: 'Usuarios de mi empresa',
  Icon: UserCog,
  hint: 'Quién entra y con qué rol',
}
const REGLAS_DEDUCIBILIDAD_ITEM: NavDef = {
  id: 'reglas-deducibilidad',
  label: 'Deducibilidad forzada',
  Icon: ShieldAlert,
  hint: 'Overrides por clave producto/servicio',
}
const ACTIVIDADES_PENDIENTES_ITEM: NavDef = {
  id: 'actividades-pendientes',
  label: 'Actividades pendientes',
  Icon: ClipboardList,
  hint: 'Actividades sin régimen asignado',
}
const MONITOR_DESCARGAS_ITEM: NavDef = {
  id: 'monitor-descargas',
  label: 'Monitor de descargas',
  Icon: CloudDownload,
  hint: 'Descargas SAT por estatus',
}
const MARKETING_ITEM: NavDef = NOTIFICACIONES_ITEM

export const ROLE_NAV: Record<RoleKey, NavDef[]> = {
  guest: GUEST_NAV,
  // Partner externo con SSO (AdminPartnership): su integración siempre; el resto del portal
  // "Mi empresa" se suma por claims Empresa.* (ver roleNavSections).
  'external-provider': [DASHBOARD_ITEM, PARTNERSHIP_ITEM],
  // Roles Empresa.*: nada fijo; todo sale de sus claims.
  empresa: [DASHBOARD_ITEM],
  // Perfil administrativo / superusuario: administración de roles y padrones.
  // Developer conserva todo lo de Administrator (superusuario técnico).
  developer: [
    DASHBOARD_ITEM,
    NOTIFICACIONES_ITEM,
    USUARIOS_ITEM,
    CONTRIBUYENTES_ITEM,
    CLIENTES_ITEM,
    ASIGNACIONES_ITEM,
    ROLES_ITEM,
    MONITOR_DESCARGAS_ITEM,
  ],
  // Administración del negocio: ve TODOS los módulos del sistema.
  // Se llena debajo de MASTER_NAV_SECTIONS para derivarse del mapa maestro
  // (un módulo nuevo en el mapa queda visible para admin automáticamente).
  administrator: [],
  seller: [
    DASHBOARD_ITEM,
    USUARIOS_ITEM,
    CLIENTES_ITEM,
    OPERACIONES_ITEM,
    VENTAS_ITEM,
    ACTIVIDAD_ITEM,
    COMISIONES_ITEM,
    MIS_TAREAS_ITEM,
  ],
  'atencion-clientes': [
    DASHBOARD_ITEM,
    NOTIFICACIONES_ITEM,
    USUARIOS_ITEM,
    OPERACIONES_ITEM,
    RENOVACIONES_ITEM,
    COMISIONES_ITEM,
    BANDEJA_ITEM,
    UPSELL_ITEM,
    CLIENTES_ASIGNADOS_ITEM,
    PIPELINES_ITEM,
    MIS_TAREAS_ITEM,
  ],
  accounter: [
    DASHBOARD_ITEM,
    USUARIOS_ITEM,
    MIS_CLIENTES_ITEM,
    CLIENTES_ITEM,
    CONTRIBUYENTES_ITEM,
    OPERACIONES_ITEM,
    DECLARACIONES_RECHAZADAS_ITEM,
    DECLARACIONES_POR_PRESENTAR_ITEM,
    REGULARIZACIONES_ITEM,
    TRAMITES_ADICIONALES_ITEM,
    DECLARACIONES_ANUALES_ITEM,
    MIS_TAREAS_ITEM,
    CATALOGOS_ITEM,
  ],
  renovaciones: [
    DASHBOARD_ITEM,
    USUARIOS_ITEM,
    OPERACIONES_ITEM,
    COMISIONES_ITEM,
    RENOVACIONES_ITEM,
    MIS_TAREAS_ITEM,
  ],
  'gerencia-comercial': [
    DASHBOARD_ITEM,
    OPERACIONES_ITEM,
    USUARIOS_ITEM,
    CLIENTES_ITEM,
    ACTIVIDAD_ITEM,
    ASIGNACIONES_ITEM,
    COMISIONES_ITEM,
    MIS_TAREAS_ITEM,
    EQUIPO_ITEM,
    PARTNERS_ITEM,
    CODIGOS_DESCUENTO_ITEM,
    REPORTES_ITEM,
  ],
  'gerente-sac': [
    DASHBOARD_ITEM,
    USUARIOS_ITEM,
    OPERACIONES_ITEM,
    RENOVACIONES_ITEM,
    COMISIONES_ITEM,
    BANDEJA_ITEM,
    NOTIFICACIONES_ITEM,
    UPSELL_ITEM,
    CLIENTES_ASIGNADOS_ITEM,
    PIPELINE_ITEM,
    MIS_TAREAS_ITEM,
    EQUIPO_ITEM,
    REPORTES_ITEM,
  ],
  'gerente-operaciones': [
    DASHBOARD_ITEM,
    USUARIOS_ITEM,
    MIS_CLIENTES_ITEM,
    OPERACIONES_ITEM,
    REGULARIZACIONES_ITEM,
    TRAMITES_ADICIONALES_ITEM,
    DECLARACIONES_ANUALES_ITEM,
    MIS_TAREAS_ITEM,
    EQUIPO_ITEM,
    REPORTES_ITEM,
    CATALOGOS_ITEM,
  ],
}

const CENTRO_NOTIFICACIONES_ITEM: NavDef = {
  id: 'centro-notificaciones',
  label: 'Notificaciones',
  Icon: Bell,
  hint: 'Tus avisos y notificaciones',
}

/**
 * DISEÑO ÚNICO del sidebar interno: un solo mapa maestro de secciones para
 * TODOS los roles. Qué módulos ve cada rol lo decide su lista de ROLE_NAV
 * (los permisos); esta estructura solo define el orden y la agrupación.
 * Las secciones sin ítems permitidos para el rol no se muestran.
 */
export const MASTER_NAV_SECTIONS: NavSection[] = [
  { section: 'PANEL', items: [DASHBOARD_ITEM, CENTRO_NOTIFICACIONES_ITEM] },
  // Portal de la empresa (solo aparece con claims Empresa.*; los internos no los tienen).
  {
    section: 'MI EMPRESA',
    items: [EMPRESA_RESUMEN_ITEM, EMPRESA_PERSONAS_ITEM, EMPRESA_INVITACIONES_ITEM, EMPRESA_CARGA_MASIVA_ITEM, EMPRESA_DIAGNOSTICO_ITEM, EMPRESA_FACTURACION_ITEM, EMPRESA_USUARIOS_ITEM, PARTNERSHIP_ITEM],
  },
  {
    section: 'VENTAS',
    items: [
      VENTAS_ITEM,
      USUARIOS_ITEM,
      CLIENTES_ITEM,
      CONTRIBUYENTES_ITEM,
      VENTAS_POR_ACTIVAR_ITEM,
      ASIGNACIONES_ITEM,
      CANCELACIONES_ITEM,
      COMISIONES_ITEM,
      RENOVACIONES_ITEM,
      UPSELL_ITEM,
      PIPELINES_ITEM,
    ],
  },
  {
    section: 'ATENCIÓN',
    items: [BANDEJA_ITEM, CLIENTES_ASIGNADOS_ITEM],
  },
  {
    section: 'OPERACIÓN',
    items: [
      OPERACIONES_ITEM,
      DECLARACIONES_RECHAZADAS_ITEM,
      DECLARACIONES_POR_PRESENTAR_ITEM,
      DECLARACIONES_FUTURAS_ITEM,
      MIS_CLIENTES_ITEM,
      REGULARIZACIONES_ITEM,
      TRAMITES_ADICIONALES_ITEM,
      DECLARACIONES_ANUALES_ITEM,
      REGLAS_DEDUCIBILIDAD_ITEM,
      ACTIVIDADES_PENDIENTES_ITEM,
    ],
  },
  {
    section: 'GESTIÓN',
    items: [
      EQUIPO_ITEM,
      EQUIPO_OPERACIONES_ITEM,
      PARTNERS_ITEM,
      EMPRESAS_VISTA_ITEM,
      EMPRESAS_ACTIVACIONES_ITEM,
      CODIGOS_DESCUENTO_ITEM,
      PRODUCTOS_ITEM,
      APROVISIONAMIENTO_ITEM,
      NOTIFICACIONES_ITEM,
      REPORTES_ITEM,
      ACTIVIDAD_ITEM,
      MIS_TAREAS_ITEM,
    ],
  },
  {
    section: 'SISTEMA',
    // Partnership (CORS/llaves/logins) vive en MI EMPRESA; aquí ya no, o saldría dos veces.
    items: [ROLES_ITEM, CATALOGOS_ITEM, CONFIGURACION_ITEM, MONITOR_DESCARGAS_ITEM],
  },
]

// Administrador ve TODOS los módulos: se deriva del mapa maestro para que un
// módulo nuevo quede visible para admin sin tocar dos listas.
ROLE_NAV.administrator = MASTER_NAV_SECTIONS.flatMap((s) => s.items)

/**
 * Permisos que abren cada módulo del backoffice (los claims que su pantalla
 * consume). El menú se deriva de aquí: un módulo aparece solo si el token del
 * usuario trae al menos uno de sus permisos — misma arquitectura que los
 * endpoints. Un módulo SIN entrada aquí no aparece para nadie (aún no tiene
 * permisos configurables, p. ej. Partnership, Bandeja, Upsell); cuando reciba
 * su primer claim, se agrega aquí y se administra desde Roles y permisos.
 *
 * El claim se siembra en el backend en el departamento con ModuleKey = id del ítem
 * (o '<id>/<slug>' si se usa dentro de la pantalla). Pregunta en qué pantalla y
 * subdepartamento va antes de crearlo: ver AGENTS.md y
 * ContaboxPro.Backend/docs/permisos-y-departamentos.md.
 */
export const MODULE_CLAIMS: Record<string, string[]> = {
  // El item Dashboard del sidebar usa id 'home' (la pantalla del cliente y la
  // del backoffice comparten id de navegación, pero son pantallas distintas).
  // Se abre con cualquier permiso de dashboard: cada Dashboard.* decide cuál se pinta.
  home: [
    'Backoffice.ViewDashboard',
    'Dashboard.GerenciaComercial',
    'Dashboard.Ventas',
    'Dashboard.GerenciaContable',
    'Dashboard.Contador',
  ],
  ventas: ['Contador.ReadVentas'],
  // Ver todos, o solo los registrados con su código de vendedor (alcance en el endpoint)
  usuarios: ['Backoffice.ReadUsers', 'Comercial.ReadOwnUsers'],
  clientes: ['Comercial.ReadClientes'],
  contribuyentes: ['Contador.ReadPadron'],
  asignaciones: ['GerenciaComercial.ManageAssignments', 'Admin.ApproveAssignments'],
  // Cancelación comercial: los tres claims se siembran en el departamento Clientes SIN asignarse a
  // ningún rol (se otorgan a mano desde Roles y permisos). Hasta entonces el módulo no aparece.
  cancelaciones: [
    'GerenciaComercial.CancelDeclaraciones',
    'GerenciaComercial.CancelCliente',
    'GerenciaComercial.ReactivarCancelaciones',
  ],
  comisiones: [
    'Comercial.ReadOwnCommissions',
    'GerenciaComercial.ReadTeamCommissions',
    'Admin.RunCommissionClose',
  ],
  renovaciones: ['Comercial.ReadRenovaciones'],
  // ConsultaDeclaraciones (SAC/atención a cliente) abre el MISMO módulo en modo
  // solo consulta: pestañas Comprobantes y Cálculos, sin acciones ni CIEC. El
  // claim completo siempre gana — con ReadDeclaraciones la pantalla es idéntica a hoy.
  operaciones: ['Contador.ReadDeclaraciones', 'Contador.ConsultaDeclaraciones'],
  // Claim propio (departamento 'Declaraciones rechazadas'): se administra desde
  // Roles y permisos, independiente del Centro de operaciones. El endpoint de la
  // lista sigue bajo Contador.ReadDeclaraciones (mismo patrón que Decl. futuras).
  'declaraciones-rechazadas': ['Contador.ReadDeclaracionesRechazadas'],
  // Concentrado de PorPresentar: es del GO (mismo claim que autoriza la presentación). La lista viaja
  // por declarations-by-taxpayer, que sólo exige sesión.
  'declaraciones-por-presentar': ['Operaciones.ForcePostDeclaration'],
  'declaraciones-futuras': ['Contador.ReadDeclaracionesFuturas'],
  // Ventas por activar + Ligas de pago: mismo claim que emitir liga (vendedores, atención a
  // clientes, gerencia comercial y gerencia SAC). spec-ventas-por-activar / spec-liga-de-pago-vendedor.
  'ventas-por-activar': ['Comercial.EmitirLigaPago'],
  // Cartera propia (contador) o todas las carteras (gerencia con AssignAccountant)
  'mis-clientes': ['Contador.ReadMisClientes', 'AssignAccountant'],
  regularizaciones: ['Contador.ReadDeclaraciones'],
  'tramites-adicionales': ['Contador.ReadTramites'],
  'declaraciones-anuales': ['Contador.ReadDeclaraciones'],
  equipo: ['GerenciaComercial.InviteTeamMember', 'GerenciaComercial.ManageTeamProfiles'],
  // Partners + Perfil de empresa de cada alianza (spec-perfil-empresa): el botón de perfil exige el segundo.
  partners: ['GerenciaComercial.ManagePartners', 'Backoffice.ManageEmpresas'],
  'empresas-activaciones': ['GerenciaComercial.ActivarPersonasEmpresa'],
  'empresas-vista': ['GerenciaComercial.VistaEmpresa', 'Backoffice.SoporteEmpresas', 'GerenciaComercial.GestionarPersonasEmpresa'],
  // Portal "Mi empresa": claims Empresa.* (AdminPartnership y roles Empresa.*). Personas,
  // Facturación y Usuarios se liberan en sus pasos; mientras, muestran "próximamente".
  'empresa-resumen': ['Empresa.VerResumen'],
  'empresa-personas': ['Empresa.VerExpediente', 'Empresa.Invitar'],
  'empresa-invitaciones': ['Empresa.Invitar'],
  'empresa-carga-masiva': ['Empresa.Invitar'],
  'empresa-diagnostico': ['Empresa.VerExpediente'],
  'empresa-facturacion': ['Empresa.VerFacturacion'],
  'empresa-usuarios': ['Empresa.AdministrarUsuarios'],
  partnership: ['Empresa.Integraciones'],
  'codigos-descuento': ['GerenciaComercial.ManageDiscountCodes'],
  productos: ['Backoffice.ReadProductos', 'Backoffice.ManageProductos'],
  aprovisionamiento: ['Backoffice.AprovisionamientoServicios'],
  marketing: ['Marketing.SendBroadcast'],
  notificaciones: ['Atencion.SendNotifications'],
  // Administrar roles, no solo verlos (ViewRole lo tienen roles operativos
  // para llenar dropdowns, p. ej. el modal de invitar al equipo).
  roles: ['AssignRole', 'CreateRole', 'EditRole', 'DeleteRole', 'RemoveRole'],
  // Catálogos aún no tiene permisos propios (los de actividades por régimen se
  // movieron a Mis clientes, donde vive la función): oculto hasta que los tenga.
  // El endpoint solo exige rol Admin (sin claim propio, ver E10 back): igual que
  // Catálogos, el módulo queda oculto hasta que se seedee este claim para Admin.
  'reglas-deducibilidad': ['Admin.ReadDeductibilityOverrides'],
  // Bandeja global (sin alcance de cartera) del Gerente de Operaciones. Asignar desde ahí abre el modal
  // de Mis clientes, que además exige AccountingManager.GetRegimeActivities.
  'actividades-pendientes': ['Operaciones.ReadActividadesPendientes'],
  // Monitor de descargas SAT: claim sembrado SOLO al rol Developer (ni Administrator lo trae).
  'monitor-descargas': ['Developer.ReadDownloadMonitor'],
  // Carga y avance por contador; solo gerencia de contabilidad (y superusuarios).
  'equipo-operaciones': ['GerenciaContable.ReadEquipoOperaciones'],
  // Hub de configuración: el menú abre con cualquiera; cada card/tab exige el suyo.
  configuracion: [
    'Sistema.ReadConfiguracion',
    'Sistema.ManageNotificacionesInternas',
    'Sistema.ReadConfiguracionSistema',
  ],
  // Módulo de Reportes Ejecutivos: abre con claims de gerencia o reportería general
  'reportes-ejecutivos': [
    'Backoffice.ViewDashboard',
    'Dashboard.GerenciaComercial',
    'Dashboard.GerenciaContable',
    'GerenciaComercial.ReadTeamCommissions',
    'GerenciaContable.ReadEquipoOperaciones',
    'Contador.ReadDeclaraciones',
    'Comercial.ReadRenovaciones',
    'Reportes.ReadEjecutivos',
  ],
}

/**
 * Secciones del sidebar: guest y el proveedor externo (portal SSO) usan su nav
 * fijo; los roles internos derivan el menú de los PERMISOS del token contra
 * MODULE_CLAIMS (Dashboard siempre visible). Las secciones vacías se ocultan.
 */
export function roleNavSections(roleKey: RoleKey, permissions: string[] = []): NavSection[] {
  if (roleKey === 'guest') return GUEST_NAV_GROUPED
  const perms = new Set(permissions)
  const byClaims = (id: string) => MODULE_CLAIMS[id]?.some((c) => perms.has(c)) ?? false
  if (roleKey === 'external-provider') {
    // AdminPartnership: su nav fijo (Dashboard + Partnership, aunque el token aún no traiga claims)
    // más el portal "Mi empresa" que le den sus claims Empresa.*.
    const fixed = new Set(ROLE_NAV['external-provider'].map((i) => i.id))
    return MASTER_NAV_SECTIONS
      .map((s) => ({ ...s, items: s.items.filter((i) => fixed.has(i.id) || byClaims(i.id)) }))
      .filter((s) => s.items.length > 0)
  }
  const visible = (id: string) => id === 'home' || id === 'centro-notificaciones' || byClaims(id)
  return MASTER_NAV_SECTIONS
    .map((s) => ({ ...s, items: s.items.filter((i) => visible(i.id)) }))
    .filter((s) => s.items.length > 0)
}

export function normalizeRole(raw: string | null | undefined): RoleKey {
  if (!raw) return 'guest'
  const slug = raw
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')

  switch (slug) {
    case 'guest':
      return 'guest'
    case 'developer':
    case 'dev':
      return 'developer'
    case 'administrator':
    case 'administrador':
    case 'administration':
    case 'admin':
      return 'administrator'
    case 'seller':
    case 'ventas':
      return 'seller'
    case 'atencion a clientes':
    case 'atencion clientes':
    case 'service customer':
    case 'service customers':
    case 'sac':
      return 'atencion-clientes'
    case 'accounter':
    case 'contador':
    // Gerente de contabilidad: persona de backoffice; el menú sale de sus
    // permisos (claims), así que comparte roleKey con el contador.
    case 'accountingmanager':
    case 'accounting manager':
    case 'gerente de contabilidad':
    case 'gerente contabilidad':
      return 'accounter'
    case 'finderfee':
    case 'finder fee':
      return 'seller'
    case 'renovaciones':
      return 'renovaciones'
    case 'commercialmanager':
    case 'commercial manager':
    case 'gerencia comercial':
      return 'gerencia-comercial'
    case 'sacmanager':
    case 'sac manager':
    case 'gerente sac':
    case 'gerente de sac':
      return 'gerente-sac'
    case 'gerente operaciones':
    case 'gerente de operaciones':
      return 'gerente-operaciones'
    case 'adminpartnership':
    case 'admin partnership':
      return 'external-provider'
    // Roles Empresa.* (spec-perfil-empresa): usuarios de una alianza, menú solo por claims Empresa.*
    case 'empresa.responsablefiscal':
    case 'empresa.recursoshumanos':
    case 'empresa.operaciones':
    case 'empresa.auditor':
    case 'empresa.consultaejecutiva':
      return 'empresa'
    // Autorizador de códigos de descuento: persona de backoffice; el menú se
    // filtra por sus claims (como el administrador), no un nav propio.
    case 'discountcodeauthorizer':
    case 'discount code authorizer':
    case 'autorizador codigos de descuento':
    case 'autorizador de codigos de descuento':
      return 'administrator'
    default:
      // Rol DESCONOCIDO = backoffice con menú filtrado por sus permisos, NUNCA
      // cliente: los clientes reales siempre traen el rol Guest (mapeado arriba).
      // Así un rol nuevo creado en Roles y permisos funciona sin tocar este mapa
      // — ve exactamente las pantallas que sus claims le permitan.
      return 'administrator'
  }
}

export const ALL_PERMISSIONS = [
  'GetMontlyIncome',
  'AssignRole',
  'RemoveRole',
  'EditRole',
  'ViewRole',
  'DeleteRole',
  'CreateTaxpayer',
  'CreateTaxpayerByQr',
  'UpdateCIEC',
  'LoadDigitalIdentity',
  'CompleteUserProfile',
  'MontlyBills',
] as const

export type AprendeKind = 'brand' | 'sky' | 'amber' | 'violet' | 'coral'

export interface AprendeTip {
  id: string
  cat: string
  kind: AprendeKind
  icon: typeof Zap
  t: string
  d: string
}

export const APRENDE_TIPS: AprendeTip[] = [
  { id: 'gasolina', cat: 'Fiscal', kind: 'brand', icon: Zap, t: 'Deduce gasolina y mantenimiento', d: 'Si usas tu auto para trabajar, estos gastos cuentan.' },
  { id: 'separa', cat: 'Financiero', kind: 'sky', icon: PiggyBank, t: 'Separa el 14% para impuestos', d: 'Una cuenta aparte para no batallar al pagar.' },
  { id: 'plataformas', cat: 'Plataformas', kind: 'amber', icon: Receipt, t: 'Plataformas retienen ISR e IVA', d: 'Uber, Rappi, Didi… aún así debes declarar.' },
  { id: 'cetes', cat: 'Inversión', kind: 'violet', icon: TrendingUp, t: 'Los CETES rinden 7.58% al año', d: 'Una forma segura de hacer crecer tu dinero.' },
  { id: 'antes17', cat: 'Fiscal', kind: 'coral', icon: Calendar, t: 'Presenta antes del día 17', d: 'Después hay recargos y multas. Vale la pena.' },
  { id: 'tarjeta', cat: 'Deducciones', kind: 'amber', icon: Lightbulb, t: 'Paga con tarjeta gastos de más de $2,000', d: 'En efectivo el SAT no los acepta como deducibles.' },
  { id: 'regla', cat: 'Financiero', kind: 'sky', icon: Target, t: 'La regla 50/30/20', d: 'Cómo dividir tu ingreso: necesidades, gustos, ahorro.' },
  { id: 'afore', cat: 'Ahorro', kind: 'violet', icon: PiggyBank, t: 'Aporta a tu Afore y paga menos ISR', d: 'Hasta el 10% de lo que ganas al año.' },
]

export const APRENDE_FILTERS = ['Todos', 'Fiscal', 'Financiero', 'Plataformas', 'Deducciones', 'Ahorro', 'Inversión']
