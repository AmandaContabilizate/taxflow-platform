import {
  Activity,
  BarChart3,
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
  UserPlus,
  Users,
  Zap,
} from 'lucide-react'
import type { NavDef, RoleKey, Screen } from './types'

export const DISPLAY = { fontFamily: 'var(--font-display)' } as const
export const MONO = { fontFamily: 'var(--font-mono)' } as const

export const TITLES: Record<Screen, [string, string]> = {
  home: ['Hola 👋', 'Aquí tienes lo importante de hoy'],
  declaraciones: ['Mis declaraciones', 'Tus impuestos mes con mes, sin complicarte'],
  facturas: ['Mis facturas', 'Las facturas que emites a tus clientes'],
  documentos: ['Mi bóveda', 'Tus documentos y facturas del SAT, en un solo lugar'],
  diagnostico: ['Diagnóstico fiscal', 'Cómo estás y qué puedes mejorar'],
  // aprende: ['Aprende', 'Lecciones cortas para entender tus impuestos'],
  'tip-detail': ['Lección', 'Aprende algo útil en pocos minutos'],
  tramites: ['Trámites adicionales', 'Servicios extra que puedes contratar cuando los necesites'],
  plan: ['Mi plan', 'Tu suscripción y opciones de pago'],
  ayuda: ['Ayuda y tutoriales', 'Aprende a tu ritmo, paso a paso'],
  cuenta: ['Mi cuenta', 'Tus datos y preferencias'],
  'estatus-sat': ['Conectar con el SAT', 'Necesitamos esto una sola vez'],
  permisos: ['Modificador de permisos', 'Edita los permisos asignados a tu rol'],
  // Roles operativos
  usuarios: ['Usuarios', 'Administra usuarios del sistema'],
  clientes: ['Clientes', 'Contribuyentes con ventas pagadas'],
  contribuyentes: ['Contribuyentes', 'Padrón completo de contribuyentes'],
  actividad: ['Actividad', 'Movimientos y eventos recientes'],
  comisiones: ['Comisiones', 'Tus comisiones y liquidaciones'],
  'mis-tareas': ['Mis tareas', 'Pendientes asignados a ti'],
  bandeja: ['Bandeja', 'Solicitudes y mensajes entrantes'],
  upsell: ['Upsell', 'Oportunidades para ampliar servicios'],
  'clientes-asignados': ['Clientes asignados', 'Tu cartera de atención'],
  'pipelines-por-etapa': ['Pipelines por etapa', 'Estado de tus oportunidades'],
  'mis-clientes': ['Mis clientes', 'Clientes bajo tu contabilidad'],
  regularizaciones: ['Regularizaciones', 'Casos en regularización fiscal'],
  'declaraciones-anuales': ['Declaraciones anuales', 'Declaraciones del ejercicio'],
  catalogos: ['Catálogos', 'Catálogos maestros del sistema'],
  renovaciones: ['Renovaciones', 'Suscripciones por renovar'],
  asignaciones: ['Asignaciones', 'Reparto de cartera al equipo'],
  equipo: ['Equipo', 'Tu equipo de trabajo'],
  'reportes-ejecutivos': ['Reportes ejecutivos', 'KPIs y resultados del área'],
  operaciones: ['Centro de Operaciones', 'Gestión y supervisión de declaraciones fiscales'],
  'tramites-adicionales': ['Trámites adicionales', 'Seguimiento de trámites vendidos a tus clientes'],
  ventas: ['Ventas', 'Resumen de ventas registradas por cuenta'],
  roles: ['Roles y permisos', 'Administra roles, sus permisos y los roles de cada usuario'],
}

const GUEST_NAV: NavDef[] = [
  { id: 'home', label: 'Inicio', Icon: Home, hint: 'Tu resumen del día' },
  { id: 'declaraciones', label: 'Declaraciones', Icon: FileText, hint: 'Tus impuestos del mes' },
  { id: 'facturas', label: 'Facturas', Icon: FilePlus, hint: 'Emite y revisa facturas' },
  { id: 'documentos', label: 'Bóveda', Icon: FolderLock, hint: 'Tu bóveda digital de CFDI y constancias' },
  { id: 'diagnostico', label: 'Diagnóstico', Icon: Stethoscope, hint: 'Tu situación fiscal' },
  { id: 'tramites', label: 'Trámites', Icon: FilePlus2, hint: 'Servicios extra' },
  { id: 'plan', label: 'Mi plan', Icon: Gem, hint: 'Tu suscripción' },
  { id: 'ayuda', label: 'Ayuda', Icon: HelpCircle, hint: 'Tutoriales y dudas' },
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
const USUARIOS_ITEM: NavDef = { id: 'usuarios', label: 'Usuarios', Icon: Users, hint: 'Administra usuarios' }
const CLIENTES_ITEM: NavDef = { id: 'clientes', label: 'Clientes', Icon: Briefcase, hint: 'Cartera de clientes' }
const ACTIVIDAD_ITEM: NavDef = { id: 'actividad', label: 'Actividad', Icon: Activity, hint: 'Eventos recientes' }
const COMISIONES_ITEM: NavDef = { id: 'comisiones', label: 'Comisiones', Icon: DollarSign, hint: 'Tus comisiones' }
const MIS_TAREAS_ITEM: NavDef = { id: 'mis-tareas', label: 'Mis tareas', Icon: CheckSquare, hint: 'Pendientes' }
const BANDEJA_ITEM: NavDef = { id: 'bandeja', label: 'Bandeja', Icon: Inbox, hint: 'Mensajes entrantes' }
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
  hint: 'Suscripciones por renovar',
}
const ASIGNACIONES_ITEM: NavDef = {
  id: 'asignaciones',
  label: 'Asignaciones',
  Icon: ClipboardList,
  hint: 'Reparto de cartera',
}
const EQUIPO_ITEM: NavDef = { id: 'equipo', label: 'Equipo', Icon: Users, hint: 'Tu equipo' }
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

export const ROLE_NAV: Record<RoleKey, NavDef[]> = {
  guest: GUEST_NAV,
  // Perfil administrativo / superusuario: administración de roles y padrones.
  developer: [
    DASHBOARD_ITEM,
    USUARIOS_ITEM,
    CONTRIBUYENTES_ITEM,
    CLIENTES_ITEM,
    ROLES_ITEM,
  ],
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
    OPERACIONES_ITEM,
    COMISIONES_ITEM,
    BANDEJA_ITEM,
    UPSELL_ITEM,
    CLIENTES_ASIGNADOS_ITEM,
    PIPELINES_ITEM,
    MIS_TAREAS_ITEM,
  ],
  accounter: [
    DASHBOARD_ITEM,
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
  renovaciones: [DASHBOARD_ITEM, OPERACIONES_ITEM, COMISIONES_ITEM, RENOVACIONES_ITEM, MIS_TAREAS_ITEM],
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
    REPORTES_ITEM,
  ],
  'gerente-sac': [
    DASHBOARD_ITEM,
    OPERACIONES_ITEM,
    COMISIONES_ITEM,
    BANDEJA_ITEM,
    UPSELL_ITEM,
    CLIENTES_ASIGNADOS_ITEM,
    PIPELINE_ITEM,
    MIS_TAREAS_ITEM,
    EQUIPO_ITEM,
    REPORTES_ITEM,
  ],
  'gerente-operaciones': [
    DASHBOARD_ITEM,
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
    case 'seller':
    case 'ventas':
      return 'seller'
    case 'atencion a clientes':
    case 'atencion clientes':
    case 'sac':
      return 'atencion-clientes'
    case 'accounter':
      return 'accounter'
    case 'renovaciones':
      return 'renovaciones'
    case 'gerencia comercial':
      return 'gerencia-comercial'
    case 'gerente sac':
    case 'gerente de sac':
      return 'gerente-sac'
    case 'gerente operaciones':
    case 'gerente de operaciones':
      return 'gerente-operaciones'
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
