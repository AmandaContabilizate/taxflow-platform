import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  Calendar,
  CheckSquare,
  ClipboardList,
  DollarSign,
  FilePlus,
  FilePlus2,
  FileText,
  FolderLock,
  Gem,
  HelpCircle,
  Home,
  Inbox,
  KanbanSquare,
  KeyRound,
  Layers,
  Lightbulb,
  PiggyBank,
  Receipt,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Stethoscope,
  Target,
  TrendingUp,
  LayoutGrid,
  UserPlus,
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
  george: ['Recibos → Facturas', 'Convierte tus recibos digitales en facturas CFDI'],
  documentos: ['Mi bóveda', 'Tus documentos y facturas del SAT, en un solo lugar'],
  diagnostico: ['Diagnóstico fiscal', 'Cómo estás y qué puedes mejorar'],
  estatussat: ['Estatus ante SAT', 'Monitoreo continuo de listas y cumplimiento'],
  'estatus-sat': ['Conecta tu SAT', 'Vincula tu RFC para activar tu información fiscal'],
  aprende: ['Aprende', 'Lecciones cortas para entender tus impuestos'],
  'tip-detail': ['Lección', 'Aprende algo útil en pocos minutos'],
  tramites: ['Trámites adicionales', 'Servicios extra que puedes contratar cuando los necesites'],
  plan: ['Mi plan', 'Tu suscripción y opciones de pago'],
  ayuda: ['Ayuda y tutoriales', 'Aprende a tu ritmo, paso a paso'],
  manual: ['Manual de usuario', 'Guía completa de cómo usar Contabilízate'],
  cuenta: ['Mi cuenta', 'Tus datos y preferencias'],
  permisos: ['Modificador de permisos', 'Edita los permisos asignados a tu rol'],
  // Roles operativos
  usuarios: ['Usuarios', 'Todas las cuentas registradas en la plataforma'],
  clientes: ['Clientes', 'Contribuyentes con ventas pagadas'],
  contribuyentes: ['Contribuyentes', 'Padrón completo de contribuyentes'],
  actividad: ['Actividad', 'Movimientos y eventos recientes'],
  comisiones: ['Comisiones', 'Tus comisiones y liquidaciones'],
  'mis-tareas': ['Mis tareas', 'Pendientes asignados a ti'],
  bandeja: ['Bandeja', 'Solicitudes y mensajes entrantes'],
  notificaciones: ['Notificaciones', 'Envía avisos push a los usuarios de la app'],
  upsell: ['Upsell', 'Oportunidades para ampliar servicios'],
  'clientes-asignados': ['Clientes asignados', 'Tu cartera de atención'],
  'pipelines-por-etapa': ['Pipelines por etapa', 'Estado de tus oportunidades'],
  'mis-clientes': ['Mis clientes', 'Clientes bajo tu contabilidad'],
  regularizaciones: ['Regularizaciones', 'Casos en regularización fiscal'],
  'declaraciones-anuales': ['Declaraciones anuales', 'Declaraciones del ejercicio'],
  catalogos: ['Catálogos', 'Catálogos maestros del sistema'],
  renovaciones: ['Renovaciones', 'Planes por vencer y quién ya canceló su renovación'],
  asignaciones: ['Asignaciones de venta', 'Gestiona clientes sin vendedor y solicita reasignaciones para aprobación de Administración'],
  equipo: ['Equipo', 'Tu plantilla comercial. Da de alta nuevos miembros desde aquí.'],
  partners: ['Partners', 'Alta de partners y alianzas B2B2C, con sus códigos automáticos'],
  'codigos-descuento': ['Códigos de descuento', 'Códigos por dueño: ejecutivos, finder fees y partners'],
  'reportes-ejecutivos': ['Reportes ejecutivos', 'KPIs y resultados del área'],
  operaciones: ['Centro de Operaciones', 'Gestión y supervisión de declaraciones fiscales'],
  'tramites-adicionales': ['Trámites adicionales', 'Seguimiento de trámites vendidos a tus clientes'],
  ventas: ['Ventas', 'Resumen de ventas registradas por cuenta'],
  roles: ['Roles y permisos', 'Administra roles, sus permisos y los roles de cada usuario'],
  partnership: ['Partnership', 'Administra CORS, llaves SSO y bitácora de logins'],
  marketing: ['Marketing & Difusión', 'Envío masivo de notificaciones Push'],
}

const GUEST_NAV: NavDef[] = [
  { id: 'home', label: 'Inicio', Icon: Home, hint: 'Tu resumen del día' },
  { id: 'vista-fiscal', label: 'Vista fiscal', Icon: LayoutGrid, hint: 'Tu vida fiscal' },
  { id: 'diagnostico', label: 'Diagnóstico', Icon: Stethoscope, hint: 'Tu situación fiscal' },
  { id: 'declaraciones', label: 'Declaraciones', Icon: FileText, hint: 'Tus impuestos del mes' },
  { id: 'facturas', label: 'Facturación', Icon: FilePlus, hint: 'Emite y revisa facturas' },
  { id: 'documentos', label: 'Bóveda', Icon: FolderLock, hint: 'Tu bóveda digital de CFDI y constancias' },
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
      { id: 'george', label: 'Recibos → Facturas', Icon: Receipt, hint: 'Convierte recibos en facturas' },
      { id: 'documentos', label: 'Bóveda', Icon: FolderLock, hint: 'Tu bóveda digital de CFDI y constancias' },
    ]
  },
  {
    section: 'CUENTA',
    items: [
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
  label: 'Notificaciones',
  Icon: Bell,
  hint: 'Envía avisos a los usuarios',
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
const EQUIPO_ITEM: NavDef = { id: 'equipo', label: 'Equipo', Icon: Users, hint: 'Tu equipo' }
const PARTNERS_ITEM: NavDef = {
  id: 'partners',
  label: 'Partners',
  Icon: Briefcase,
  hint: 'Partners y alianzas B2B2C',
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
  label: 'Centro de Operaciones',
  Icon: Briefcase,
  hint: 'Gestión de declaraciones',
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
  label: 'Partnership',
  Icon: KeyRound,
  hint: 'CORS, llaves SSO y logins',
}
const MARKETING_ITEM: NavDef = {
  id: 'marketing',
  label: 'Marketing / Difusión',
  Icon: Megaphone,
  hint: 'Notificaciones masivas',
}

export const ROLE_NAV: Record<RoleKey, NavDef[]> = {
  guest: GUEST_NAV,
  // Partner externo con SSO: solo administra su propia integración.
  'external-provider': [DASHBOARD_ITEM, PARTNERSHIP_ITEM],
  // Perfil administrativo / superusuario: administración de roles y padrones.
  // Developer conserva todo lo de Administrator (superusuario técnico).
  developer: [
    DASHBOARD_ITEM,
    MARKETING_ITEM,
    USUARIOS_ITEM,
    CONTRIBUYENTES_ITEM,
    CLIENTES_ITEM,
    ASIGNACIONES_ITEM,
    ROLES_ITEM,
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
    MARKETING_ITEM,
    USUARIOS_ITEM,
    OPERACIONES_ITEM,
    RENOVACIONES_ITEM,
    COMISIONES_ITEM,
    BANDEJA_ITEM,
    NOTIFICACIONES_ITEM,
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

/**
 * DISEÑO ÚNICO del sidebar interno: un solo mapa maestro de secciones para
 * TODOS los roles. Qué módulos ve cada rol lo decide su lista de ROLE_NAV
 * (los permisos); esta estructura solo define el orden y la agrupación.
 * Las secciones sin ítems permitidos para el rol no se muestran.
 */
export const MASTER_NAV_SECTIONS: NavSection[] = [
  { section: 'PANEL', items: [DASHBOARD_ITEM] },
  {
    section: 'VENTAS',
    items: [
      VENTAS_ITEM,
      USUARIOS_ITEM,
      CLIENTES_ITEM,
      CONTRIBUYENTES_ITEM,
      ASIGNACIONES_ITEM,
      COMISIONES_ITEM,
      RENOVACIONES_ITEM,
      UPSELL_ITEM,
      PIPELINES_ITEM,
    ],
  },
  {
    section: 'ATENCIÓN',
    items: [BANDEJA_ITEM, NOTIFICACIONES_ITEM, CLIENTES_ASIGNADOS_ITEM],
  },
  {
    section: 'OPERACIÓN',
    items: [
      OPERACIONES_ITEM,
      MIS_CLIENTES_ITEM,
      REGULARIZACIONES_ITEM,
      TRAMITES_ADICIONALES_ITEM,
      DECLARACIONES_ANUALES_ITEM,
    ],
  },
  {
    section: 'GESTIÓN',
    items: [
      EQUIPO_ITEM,
      PARTNERS_ITEM,
      CODIGOS_DESCUENTO_ITEM,
      MARKETING_ITEM,
      REPORTES_ITEM,
      ACTIVIDAD_ITEM,
      MIS_TAREAS_ITEM,
    ],
  },
  {
    section: 'SISTEMA',
    items: [ROLES_ITEM, CATALOGOS_ITEM, PARTNERSHIP_ITEM],
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
  comisiones: [
    'Comercial.ReadOwnCommissions',
    'GerenciaComercial.ReadTeamCommissions',
    'Admin.RunCommissionClose',
  ],
  renovaciones: ['Comercial.ReadRenovaciones'],
  operaciones: ['Contador.ReadDeclaraciones'],
  // Cartera propia (contador) o todas las carteras (gerencia con AssignAccountant)
  'mis-clientes': ['Contador.ReadMisClientes', 'AssignAccountant'],
  regularizaciones: ['Contador.ReadDeclaraciones'],
  'tramites-adicionales': ['Contador.ReadTramites'],
  'declaraciones-anuales': ['Contador.ReadDeclaraciones'],
  equipo: ['GerenciaComercial.InviteTeamMember', 'GerenciaComercial.ManageTeamProfiles'],
  partners: ['GerenciaComercial.ManagePartners'],
  'codigos-descuento': ['GerenciaComercial.ManageDiscountCodes'],
  marketing: ['Marketing.SendBroadcast'],
  notificaciones: ['Atencion.SendNotifications'],
  // Administrar roles, no solo verlos (ViewRole lo tienen roles operativos
  // para llenar dropdowns, p. ej. el modal de invitar al equipo).
  roles: ['AssignRole', 'CreateRole', 'EditRole', 'DeleteRole', 'RemoveRole'],
  // Catálogos aún no tiene permisos propios (los de actividades por régimen se
  // movieron a Mis clientes, donde vive la función): oculto hasta que los tenga.
}

/**
 * Secciones del sidebar: guest y el proveedor externo (portal SSO) usan su nav
 * fijo; los roles internos derivan el menú de los PERMISOS del token contra
 * MODULE_CLAIMS (Dashboard siempre visible). Las secciones vacías se ocultan.
 */
export function roleNavSections(roleKey: RoleKey, permissions: string[] = []): NavSection[] {
  if (roleKey === 'guest') return GUEST_NAV_GROUPED
  if (roleKey === 'external-provider') {
    const allowed = new Set(ROLE_NAV['external-provider'].map((i) => i.id))
    return MASTER_NAV_SECTIONS
      .map((s) => ({ ...s, items: s.items.filter((i) => allowed.has(i.id)) }))
      .filter((s) => s.items.length > 0)
  }
  const perms = new Set(permissions)
  const visible = (id: string) => MODULE_CLAIMS[id]?.some((c) => perms.has(c)) ?? false
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
    default:
      return 'guest'
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
