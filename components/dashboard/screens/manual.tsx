'use client'

import {
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Home,
  HelpCircle,
  Search,
  X,
  ChevronRight,
  Lightbulb,
  AlertCircle,
} from 'lucide-react'
import { useState, useMemo } from 'react'
import { DISPLAY } from '../constants'
import { Card } from '../ui'
import type { GoFn } from '../types'

interface ManualSection {
  id: string
  title: string
  icon: React.ReactNode
  description: string
  category: 'inicio' | 'declaraciones' | 'facturas' | 'documentos' | 'suscripcion' | 'ayuda'
  readTime: number
  content: string
  tips?: string[]
}

const categories = {
  inicio: { label: 'Inicio', color: 'brand' },
  declaraciones: { label: 'Declaraciones', color: 'brand' },
  facturas: { label: 'Facturación', color: 'brand' },
  documentos: { label: 'Documentos', color: 'brand' },
  suscripcion: { label: 'Suscripción', color: 'brand' },
  ayuda: { label: 'Ayuda', color: 'brand' },
}

const sections: ManualSection[] = [
  {
    id: 'inicio',
    title: 'Dashboard - Tu resumen del día',
    icon: <Home size={20} />,
    category: 'inicio',
    readTime: 3,
    description: 'Visión general de tu situación fiscal y actividad reciente',
    content: `El dashboard es tu punto de entrada a Contabilízate. Aquí encontrarás:

• Resumen de tus ingresos, gastos y facturas del mes
• Estado de tus declaraciones pendientes
• Alertas importantes sobre tu situación fiscal
• Accesos rápidos a las funciones más usadas

Personalizando el dashboard:
- Puedes hacer clic en cualquier tarjeta para profundizar en los detalles
- Los números están actualizados en tiempo real desde el SAT`,
    tips: ['Revisa tu dashboard cada mañana para estar al día', 'Los números actualizan automáticamente cada 24 horas'],
  },
  {
    id: 'diagnostico',
    title: 'Diagnóstico fiscal',
    category: 'inicio',
    readTime: 4,
    description: 'Datos traídos directamente del SAT',
    icon: <CheckCircle2 size={20} />,
    content: `¿Qué es el Diagnóstico Fiscal?

Es un análisis que extrae información directamente del SAT sobre:

✓ DECLARACIONES PRESENTADAS:
- Cuáles declaraciones ya has presentado ante el SAT
- Meses completados y validados por las autoridades
- Declaraciones aceptadas o en revisión

✗ DECLARACIONES PENDIENTES:
- Qué meses aún no has presentado
- Cuáles están vencidas y urgentes
- Plazos para regularizar

SCORE FISCAL (0-100):
Tu calificación según el estado de tus declaraciones:
• 75-100: Excelente - Todo presentado y en orden
• 50-74: Buena - Pocos meses pendientes
• 25-49: Regular - Varios meses sin presentar
• 0-24: Crítica - Muchos atrasos por regularizar

Información adicional:
- Ingresos y gastos que has reportado
- Facturas emitidas registradas
- Situación general ante el SAT

¿Diagnóstico procesando?
Espera 24 horas después de conectar tu RFC para que traiga los datos del SAT.`,
    tips: ['El diagnóstico se actualiza cada 24 horas con datos del SAT', 'Usa "Mi plan" para regularizar meses pendientes'],
  },
  {
    id: 'declaraciones',
    title: 'Mis declaraciones',
    category: 'declaraciones',
    readTime: 5,
    description: 'Gestiona tus declaraciones mensuales y anuales',
    icon: <FileText size={20} />,
    content: `Aquí podrás:

Declaraciones mensuales (ISR, IVA):
- Ver todas tus declaraciones, tanto presentadas como pendientes
- Estado de cada mes (presentada, rechazada, en revisión)
- Fechas de vencimiento para no perder plazo

Acciones posibles:
- Descargar copias de declaraciones presentadas
- Ver detalles de rechazo si aplica
- Acceder a la regularización de meses atrasados
- Consultar histórico de cambios

Consejo: Revisa regularmente para asegurar que todas tus declaraciones
están actualizadas y sin errores.`,
    tips: ['Marca las fechas de vencimiento en tu calendario', 'Presenta regularmente para evitar multas y recargos'],
  },
  {
    id: 'facturas',
    title: 'Mi facturación',
    category: 'facturas',
    readTime: 5,
    description: 'Emite, revisa y administra tus CFDI',
    icon: <FileText size={20} />,
    content: `La sección de facturación te permite:

Emitir facturas (CFDI):
- Crear nuevos comprobantes en línea
- Guardar clientes frecuentes para emitir más rápido
- Gestionar timbrado automático

Revisar facturas:
- Ver todas tus facturas emitidas y recibidas
- Descargar en PDF o XML
- Filtrar por período, cliente o estado
- Ver trazabilidad de cambios

Gestión de ingresos:
- Las facturas emitidas se reportan automáticamente
- Verifica que todas aparezcan en tu declaración
- Reporta gastos deductibles que recibes de terceros`,
    tips: ['Emite facturas el mismo día de la venta', 'Guarda los datos de tus clientes frecuentes'],
  },
  {
    id: 'boveda',
    title: 'Mi bóveda digital',
    category: 'documentos',
    readTime: 3,
    description: 'Almacén seguro de tus documentos fiscales',
    icon: <FileText size={20} />,
    content: `Tu bóveda digital centraliza todos tus documentos:

Documentos disponibles:
- Comprobantes fiscales emitidos
- Comprobantes fiscales recibidos
- Constancia de situación fiscal (del SAT)
- Opinión de cumplimiento
- Otros documentos relevantes

Funcionalidades:
- Búsqueda rápida por fecha, tipo o RFC
- Descargas en múltiples formatos
- Organización automática por período
- Validez de comprobantes en tiempo real

Seguridad:
- Acceso seguro con tu cuenta
- Encriptación de documentos
- Cumple normativas de almacenamiento digital`,
    tips: ['Descarga tu constancia anual al finalizar el año'],
  },
  {
    id: 'plan',
    title: 'Mi plan y suscripción',
    category: 'suscripcion',
    readTime: 4,
    description: 'Gestiona tu suscripción y método de pago',
    icon: <FileText size={20} />,
    content: `Aquí encontrarás:

Información de tu suscripción:
- Plan actual (Gratuito, Básico, Profesional, etc.)
- Fecha de renovación
- Características disponibles
- Límites de uso

Métodos de pago:
- Tarjeta de crédito registrada
- Historial de pagos
- Facturas de suscripción
- Cambiar método de pago

Cambios de plan:
- Actualizar a un plan superior en cualquier momento
- Promociones y códigos de descuento disponibles
- Cambios reflejados inmediatamente
- Ajuste de facturación prorrateada

Códigos promocionales:
- Ingresa un código si cuentas con descuento`,
    tips: ['Verifica tu fecha de renovación para evitar interrupciones'],
  },
  {
    id: 'ayuda',
    title: 'Ayuda y tutoriales',
    category: 'ayuda',
    readTime: 3,
    description: 'Videos cortos y guías para aprender',
    icon: <HelpCircle size={20} />,
    content: `Aprende a usar Contabilízate con nuestros recursos:

Videos tutoriales (3-5 minutos):
- Conceptos básicos de cada sección
- Paso a paso de operaciones comunes
- Resolución de problemas frecuentes
- Mejores prácticas fiscales

Guías escritas:
- Documentación detallada de cada función
- Preguntas frecuentes (FAQ)
- Glosario de términos fiscales
- Links a recursos del SAT

Soporte:
- Si tienes dudas específicas, usa la sección de ayuda dentro de cada módulo
- Contacta a nuestro equipo si necesitas asistencia`,
    tips: ['Los videos tienen subtítulos en español'],
  },
  {
    id: 'requisitos',
    title: 'Nota importante sobre tu cuenta',
    category: 'inicio',
    readTime: 2,
    description: 'Información crucial por régimen fiscal',
    icon: <AlertCircle size={20} />,
    content: `PRIMERO: Conecta tu RFC y CIEC

Ve a "Conectar con el SAT" si aún no lo has hecho. Con esta conexión podrás:
• Descargar Constancia de Situación Fiscal
• Ver tu Diagnóstico (declaraciones pendientes y presentadas)
• Comprar planes y contratar servicios adicionales

⚠️ IMPORTANTE POR RÉGIMEN:

Si tu régimen es 625 o 626 (Actividad Agrícola/Ganadería):
• La Opinión de Cumplimiento NO muestra tus datos en la plataforma
• Para ver adeudos, consulta directamente en el SAT
• El diagnóstico puede estar procesando - espera 24 horas

Si tu régimen es 612, 606 o Sueldos y Salarios:
• Verás tu Opinión de Cumplimiento normalmente en tu bóveda
• El diagnóstico trae información completa del SAT`,
    tips: ['Diagnóstico procesando = espera 24 horas', 'Regímenes 625/626 = consulta SAT directamente'],
  },
]

export function ManualScreen({ go }: { go: GoFn }) {
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showImportantNote, setShowImportantNote] = useState(true)

  const filtered = useMemo(
    () =>
      sections.filter(
        s =>
          (s.title.toLowerCase().includes(search.toLowerCase()) ||
            s.description.toLowerCase().includes(search.toLowerCase())) &&
          (!selectedCategory || s.category === selectedCategory)
      ),
    [search, selectedCategory]
  )

  const uniqueCategories = Array.from(new Set(sections.map(s => s.category)))

  return (
    <div className="flex flex-col gap-6">
      {/* Important Note Modal */}
      {showImportantNote && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="relative w-full max-w-md rounded-3xl p-6 lg:p-8 overflow-hidden animate-in fade-in zoom-in-95 duration-300"
            style={{
              background: 'linear-gradient(135deg, #221158 0%, #2A1C64 100%)',
              border: '1px solid rgba(0,173,135, 0.2)',
            }}
          >
            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowImportantNote(false)
              }}
              className="absolute top-4 right-4 p-2 rounded-lg transition cursor-pointer z-20"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              }}
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>

            {/* Background glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl" />

            {/* Content */}
            <div className="relative z-10 text-center">
              {/* Icon with glow */}
              <div className="flex justify-center mb-5">
                <div
                  className="relative w-20 h-20 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #00AD87 0%, #00AD87 100%)',
                    boxShadow: '0 0 30px rgba(0,173,135, 0.4)',
                  }}
                >
                  <AlertCircle size={40} style={{ color: 'white' }} />
                </div>
              </div>

              {/* Title */}
              <div
                className="text-[12px] font-bold uppercase tracking-widest mb-3"
                style={{ color: '#00AD87' }}
              >
                Nota importante
              </div>
              <h2 className="text-[22px] lg:text-[24px] font-extrabold mb-3" style={{ color: 'white' }}>
                Conecta tu RFC ahora
              </h2>
              <p className="text-[14px] mb-6" style={{ color: '#D2CDE9' }}>
                Completa tu registro con tu CIEC válida para desbloquear todas las funciones
              </p>

              {/* Benefits Box */}
              <div
                className="rounded-2xl p-5 mb-6 text-left"
                style={{
                  background: 'white',
                }}
              >
                {/* Benefit 1 */}
                <div className="mb-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[12px] font-bold"
                      style={{ background: '#00AD87' }}
                    >
                      ✓
                    </div>
                    <div className="flex-1">
                      <div className="text-[14px] font-semibold" style={{ color: '#221158' }}>
                        Documentos fiscales
                      </div>
                      <div className="text-[13px] mt-1" style={{ color: '#453889' }}>
                        Acceder a tu Constancia de Situación Fiscal y Opinión de Cumplimiento
                      </div>
                    </div>
                  </div>
                </div>

                {/* Benefit 2 */}
                <div className="mb-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[12px] font-bold"
                      style={{ background: '#00AD87' }}
                    >
                      ✓
                    </div>
                    <div className="flex-1">
                      <div className="text-[14px] font-semibold" style={{ color: '#221158' }}>
                        Validar tu RFC
                      </div>
                      <div className="text-[13px] mt-1" style={{ color: '#453889' }}>
                        Saber si tu RFC está en listas negras o tiene problemas
                      </div>
                    </div>
                  </div>
                </div>

                {/* Benefit 3 */}
                <div className="mb-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[12px] font-bold"
                      style={{ background: '#00AD87' }}
                    >
                      ✓
                    </div>
                    <div className="flex-1">
                      <div className="text-[14px] font-semibold" style={{ color: '#221158' }}>
                        Comprar planes y servicios
                      </div>
                      <div className="text-[13px] mt-1" style={{ color: '#453889' }}>
                        Acceso inmediato a planes según tu RFC y régimen, más trámites adicionales. No esperes al diagnóstico
                      </div>
                    </div>
                  </div>
                </div>

                {/* Benefit 4 */}
                <div>
                  <div className="flex items-start gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[12px] font-bold"
                      style={{ background: '#00AD87' }}
                    >
                      ✓
                    </div>
                    <div className="flex-1">
                      <div className="text-[14px] font-semibold" style={{ color: '#221158' }}>
                        Diagnóstico fiscal personalizado
                      </div>
                      <div className="text-[13px] mt-1" style={{ color: '#453889' }}>
                        Verás qué declaraciones tienes pendientes, cuáles ya presentaste y tu score. Te enviaremos un correo notificando que ya terminó
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => go('estatus-sat')}
                  className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-[14px] transition hover:opacity-90"
                  style={{
                    background: 'linear-gradient(135deg, #00AD87 0%, #00AD87 100%)',
                    color: 'white',
                  }}
                >
                  Conectar mi RFC
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div
        className="rounded-3xl p-6 lg:p-8 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #221158 0%, #2A1C64 100%)',
          border: '2px solid #221158',
        }}
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={20} style={{ color: '#00AD87' }} />
            <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: '#00AD87' }}>
              Manual de usuario
            </span>
          </div>
          <h1 className="text-[24px] lg:text-[28px] font-extrabold mb-2" style={{ ...DISPLAY, color: 'white' }}>
            Aprende a usar Contabilízate
          </h1>
          <p className="text-[14px] max-w-2xl" style={{ color: '#D2CDE9' }}>
            Guía rápida y completa de todas las funciones. Encuentra respuestas, consejos y mejores prácticas para
            optimizar tu gestión fiscal.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search size={18} style={{ color: '#00AD87' }} />
        </div>
        <input
          type="text"
          placeholder="Buscar en el manual..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-2xl border outline-none transition focus:ring-2 focus:ring-green-500"
          style={{
            borderColor: search ? '#00AD87' : '#E7E4F4',
            background: 'var(--card)',
            color: 'var(--ink-900)',
          }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg transition hover:bg-opacity-80"
            style={{ background: '#EDE5FF', color: '#00AD87' }}
            aria-label="Limpiar búsqueda"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Category Filter + Important Note Button */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all ${!selectedCategory ? 'ring-2 ring-offset-1' : ''}`}
            style={{
              background: !selectedCategory ? '#221158' : '#F3F1FA',
              color: !selectedCategory ? 'white' : '#332670',
              boxShadow: !selectedCategory ? '0 0 0 2px var(--background), 0 0 0 4px #221158' : 'none',
            }}
          >
            Todos
          </button>
          {uniqueCategories.map((cat, idx) => {
            const isEven = idx % 2 === 0
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all ${selectedCategory === cat ? 'ring-2 ring-offset-1' : ''}`}
                style={{
                  background: selectedCategory === cat ? (isEven ? 'linear-gradient(135deg, #221158 0%, #2A1C64 100%)' : 'linear-gradient(135deg, #00AD87 0%, #00AD87 100%)') : '#F3F1FA',
                  color: selectedCategory === cat ? 'white' : '#332670',
                  boxShadow: selectedCategory === cat ? `0 0 0 2px var(--background), 0 0 0 4px ${isEven ? '#221158' : '#00AD87'}` : 'none',
                }}
              >
                {categories[cat as keyof typeof categories].label}
              </button>
            )
          })}
        </div>

        {/* Important Note Button */}
        <button
          onClick={() => setShowImportantNote(true)}
          className="px-4 py-2 rounded-full text-[13px] font-semibold transition-all animate-pulse"
          style={{
            background: 'linear-gradient(135deg, #00AD87 0%, #00AD87 100%)',
            color: 'white',
            boxShadow: '0 0 20px rgba(0,173,135, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 30px rgba(0,173,135, 0.5)'
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 20px rgba(0,173,135, 0.3)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>Nota importante</span>
          </div>
        </button>
      </div>

      {/* Sections Grid */}
      <div className="grid gap-3">
        {filtered.length > 0 ? (
          filtered.map(section => (
            <div key={section.id} className="group">
              <button
                onClick={() => setExpandedId(expandedId === section.id ? null : section.id)}
                className="w-full text-left transition-all"
                style={{
                  background: 'transparent',
                }}
              >
                <Card
                  className={expandedId === section.id ? 'ring-2' : ''}
                  style={{
                    borderColor: expandedId === section.id ? '#00AD87' : undefined,
                  }}
                >
                  <div className="p-4 lg:p-5">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background:
                            section.id === 'inicio' || section.id === 'facturas'
                              ? 'linear-gradient(135deg, #00AD87 0%, #00AD87 100%)'
                              : section.id === 'diagnostico' || section.id === 'boveda'
                              ? 'linear-gradient(135deg, #221158 0%, #2A1C64 100%)'
                              : section.id === 'plan'
                              ? 'linear-gradient(135deg, #7339FD 0%, #4B21B8 100%)'
                              : 'linear-gradient(135deg, #7339FD 0%, #7339FD 100%)',
                          color: 'white',
                        }}
                      >
                        {section.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <h3 className="text-[15px] font-bold line-clamp-2" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
                            {section.title}
                          </h3>
                          <ChevronRight
                            size={18}
                            className={`flex-shrink-0 transition-transform duration-300 ${expandedId === section.id ? 'rotate-90' : ''}`}
                            style={{ color: 'var(--ink-400)' }}
                          />
                        </div>
                        <p className="text-[13px] mb-3" style={{ color: 'var(--ink-500)' }}>
                          {section.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-[12px]">
                          <span
                            className="px-2 py-1 rounded-full font-medium text-white"
                            style={{
                              background: 'linear-gradient(135deg, #00AD87 0%, #00AD87 100%)',
                            }}
                          >
                            {categories[section.category].label}
                          </span>
                          <div className="flex items-center gap-1" style={{ color: 'var(--ink-400)' }}>
                            <Clock size={14} />
                            <span>{section.readTime} min de lectura</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedId === section.id && (
                      <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--border-200)' }}>
                        <div
                          className="text-[13.5px] leading-relaxed whitespace-pre-wrap mb-4"
                          style={{ color: 'var(--ink-700)' }}
                        >
                          {section.content}
                        </div>

                        {/* Tips */}
                        {section.tips && section.tips.length > 0 && (
                          <div
                            className="p-3 rounded-xl border-l-3"
                            style={{
                              background: section.id === 'inicio' || section.id === 'facturas' ? '#E6FCF6' : '#F6F5FB',
                              borderColor: '#00AD87',
                              borderLeftWidth: '3px',
                            }}
                          >
                            <div className="flex items-start gap-2">
                              <Lightbulb
                                size={16}
                                className="flex-shrink-0 mt-0.5"
                                style={{ color: '#00AD87' }}
                              />
                              <div className="flex-1 text-[12.5px]" style={{ color: '#2A1C64' }}>
                                {section.tips.map((tip, idx) => (
                                  <div key={idx} className="mb-1 last:mb-0">
                                    • {tip}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full mx-auto mb-4" style={{ background: 'var(--brand-100)' }}>
              <Search size={32} className="mx-auto mt-2" style={{ color: 'var(--brand-600)' }} />
            </div>
            <div className="text-[16px] font-semibold mb-2" style={{ color: 'var(--ink-900)' }}>
              No encontramos resultados
            </div>
            <div className="text-[14px]" style={{ color: 'var(--ink-500)' }}>
              Intenta con otras palabras clave o explora todas las secciones
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div
        className="p-5 lg:p-6 rounded-2xl border-l-4"
        style={{
          background: 'linear-gradient(135deg, #2A1C64 0%, #221158 100%)',
          borderColor: '#00AD87',
          borderLeftWidth: '4px',
        }}
      >
        <div className="flex gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: '#00AD87' }}
          >
            <Lightbulb size={20} style={{ color: 'white' }} />
          </div>
          <div>
            <div className="text-[14px] font-semibold mb-1" style={{ color: '#00AD87' }}>
              ¿Necesitas ayuda personalizada?
            </div>
            <div className="text-[13px]" style={{ color: '#D2CDE9' }}>
              Si tienes dudas que no se resuelven aquí, visita la sección "Ayuda" para videos tutoriales o contacta a
              nuestro equipo de soporte.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
