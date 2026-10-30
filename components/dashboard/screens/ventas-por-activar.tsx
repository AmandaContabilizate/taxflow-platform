'use client'

import { ArrowRight, Loader2, Search, Zap } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { activarVentasPendientes } from '@/features/account/actions/activarVentas.action'
import { getVentasPorActivar } from '@/features/operations/actions/getVentasPorActivar.action'
import { AjustarPlanModal } from '../ventas/ajustar-plan-modal'
import type { VentaPorActivar, VentaPorActivarMotivo, VentasPorActivarPage } from '@/features/operations/types'
import { ExpedienteCliente, type ExpedienteTab } from '../clientes/expediente-cliente'
import { Pagination } from '../clientes/parts'
import { MONO } from '../constants'
import { Badge, type BadgeKind, Card, ErrorState, HelpBox, Tabs } from '../ui'
import { LigasPagoTab } from './ligas-pago-tab'

const TAKE = 50

const EMPTY: VentasPorActivarPage = { items: [], total: 0, skip: 0, take: TAKE, porMotivo: {} }

const TABS = ['Ventas por activar', 'Ligas de pago']

/**
 * Por motivo: etiqueta, color, instrucción para el vendedor (siempre visible) y la acción que abre
 * el expediente en la pestaña donde se resuelve. El orden es el de urgencia para el vendedor.
 */
type Accion = 'expediente' | 'activar' | 'ajustar'

const MOTIVOS: Record<VentaPorActivarMotivo, { label: string; kind: BadgeKind; accion: string; boton: string; tab: ExpedienteTab; tipo: Accion }> = {
  ListaParaActivar: { label: 'Lista para activar', kind: 'brand', accion: 'Ya tiene constancia y régimen compatible. El sistema la activa solo cada 15 min; puedes activarla ahora.', boton: 'Activar ahora', tab: 'diagnostico', tipo: 'activar' },
  SinConstancia: { label: 'Sin constancia', kind: 'amber', accion: 'CIEC válida, pero el robot no bajó la constancia. Ejecuta el diagnóstico o sube la del cliente.', boton: 'Ejecutar diagnóstico', tab: 'diagnostico', tipo: 'expediente' },
  ConstanciaSinRegimen: { label: 'Constancia sin régimen', kind: 'amber', accion: 'Hay constancia registrada pero no se pudieron leer sus regímenes. Sube la del portal del SAT (emitida hoy o ayer) en Diagnóstico: al guardarse se activa sola.', boton: 'Subir constancia', tab: 'diagnostico', tipo: 'expediente' },
  CiecSinVerificar: { label: 'CIEC sin verificar', kind: 'amber', accion: 'El SAT no respondió. Pide al cliente su constancia y súbela.', boton: 'Subir constancia', tab: 'diagnostico', tipo: 'expediente' },
  SinCiec: { label: 'Sin CIEC', kind: 'coral', accion: 'El cliente no capturó su CIEC. Pídesela y captúrala, o sube su constancia.', boton: 'Capturar CIEC', tab: 'credenciales', tipo: 'expediente' },
  CiecInvalida: { label: 'CIEC inválida', kind: 'coral', accion: 'La contraseña está mal. El cliente debe corregirla; mientras, sube su constancia.', boton: 'Subir constancia', tab: 'diagnostico', tipo: 'expediente' },
  RegimenNoCoincide: { label: 'Régimen no coincide', kind: 'coral', accion: 'La constancia trae un régimen que el plan cobrado no cubre. Elige el plan correcto y se activa al momento.', boton: 'Ajustar plan', tab: 'productos', tipo: 'ajustar' },
}
const MOTIVO_DEFAULT = { label: '', kind: 'default' as BadgeKind, accion: '', boton: 'Expediente', tab: 'resumen' as ExpedienteTab, tipo: 'expediente' as Accion }

const MOTIVO_ORDER: VentaPorActivarMotivo[] = ['ListaParaActivar', 'ConstanciaSinRegimen', 'SinConstancia', 'CiecSinVerificar', 'SinCiec', 'CiecInvalida', 'RegimenNoCoincide']

const money = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

const chipStyle = (active: boolean) =>
  active
    ? { background: 'var(--ink-900)', color: '#fff' }
    : { background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--ink-700)' }

/**
 * Pantalla "Ventas por activar" (spec-ventas-por-activar, paso 2) con dos pestañas:
 * - Ventas por activar: pagadas cuyo cumplimiento quedó incompleto, con el motivo derivado.
 * - Ligas de pago: todas las ligas emitidas desde el backoffice con su estado.
 * Las acciones viven en el expediente (capturar CIEC, subir constancia, armar venta).
 */
export function VentasPorActivarScreen({ permissions = [] }: { permissions?: string[] }) {
  const [tab, setTab] = useState(0)
  const [expediente, setExpediente] = useState<{ id: number; tab?: ExpedienteTab } | null>(null)
  // Fuerza recarga de la pestaña activa al volver del expediente.
  const [refreshKey, setRefreshKey] = useState(0)
  const canEmitir = permissions.includes('Comercial.EmitirLigaPago')
  const openExpediente = (id: number, tab?: ExpedienteTab) => setExpediente({ id, tab })

  if (expediente !== null) {
    return (
      <ExpedienteCliente
        taxpayerId={expediente.id}
        permissions={permissions}
        initialTab={expediente.tab}
        onBack={() => {
          setExpediente(null)
          setRefreshKey((k) => k + 1)
        }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-5 max-w-full h-[calc(100dvh-8.5rem)]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <Tabs items={TABS} active={tab} onChange={setTab} />
      </div>

      {tab === 0 ? (
        <VentasTab key={`v-${refreshKey}`} onOpenExpediente={openExpediente} />
      ) : (
        <LigasPagoTab key={`l-${refreshKey}`} canEmitir={canEmitir} onOpenExpediente={openExpediente} />
      )}
    </div>
  )
}

function VentasTab({ onOpenExpediente }: { onOpenExpediente: (taxpayerId: number, tab?: ExpedienteTab) => void }) {
  const [page, setPage] = useState<VentasPorActivarPage>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [motivo, setMotivo] = useState<VentaPorActivarMotivo | ''>('')
  const [skip, setSkip] = useState(0)
  const [ajustar, setAjustar] = useState<VentaPorActivar | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await getVentasPorActivar({ skip, take: TAKE, search: query || undefined, queFalta: motivo || undefined })
    if (res.success) setPage(res.value)
    else {
      setError(res.error.message)
      setPage(EMPTY)
    }
    setLoading(false)
  }, [skip, query, motivo])

  useEffect(() => {
    void load()
  }, [load])

  // Búsqueda con pausa corta para no pegarle al servidor por tecla.
  useEffect(() => {
    const id = setTimeout(() => {
      setSkip(0)
      setQuery(search.trim())
    }, 350)
    return () => clearTimeout(id)
  }, [search])

  const totalPages = Math.max(1, Math.ceil(page.total / TAKE))
  const totalTodos = Object.values(page.porMotivo).reduce((a, b) => a + b, 0)

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <HelpBox>
        Ventas pagadas cuyo plan todavía no tiene declaraciones creadas. La columna <b>Qué falta</b> dice
        el bloqueo exacto; las acciones se hacen desde el expediente del cliente.
      </HelpBox>

      {/* Resumen por motivo: filtra al hacer clic */}
      <div className="flex gap-2 flex-wrap">
        <button type="button" onClick={() => { setMotivo(''); setSkip(0) }} className="px-3 py-1.5 rounded-full text-[12.5px] font-bold" style={chipStyle(motivo === '')}>
          Todas · {totalTodos}
        </button>
        {MOTIVO_ORDER.filter((m) => (page.porMotivo[m] ?? 0) > 0).map((m) => (
          <button key={m} type="button" onClick={() => { setMotivo(m === motivo ? '' : m); setSkip(0) }} className="px-3 py-1.5 rounded-full text-[12.5px] font-bold" style={chipStyle(motivo === m)}>
            {MOTIVOS[m].label} · {page.porMotivo[m]}
          </button>
        ))}
      </div>

      <Card className="flex-1 min-h-0 flex flex-col">
        <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
            {loading ? 'Cargando…' : `${page.total} ${page.total === 1 ? 'venta por activar' : 'ventas por activar'}`}
          </div>
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-500)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por RFC, nombre, correo o vendedor…"
              className="w-full rounded-xl pl-9 pr-3 py-2 text-[13px] outline-none"
              style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
          </div>
        </div>

        {error ? (
          <div className="flex-1 flex flex-col justify-center"><ErrorState message={error} /></div>
        ) : loading ? (
          <div className="flex-1 px-5 py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando ventas…
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Cliente', 'RFC', 'Plan', 'Monto', 'Pagada', 'Días', 'Armó la venta', 'Qué falta', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-extrabold whitespace-nowrap" style={{ color: 'var(--ink-700)', background: 'var(--card)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {page.items.map((v: VentaPorActivar) => (
                    <VentaRow key={v.saleId} venta={v} onOpenExpediente={onOpenExpediente} onChanged={load} onAjustar={() => setAjustar(v)} />
                  ))}
                </tbody>
              </table>
            </div>

            {page.items.length === 0 ? (
              <div className="text-center py-8 shrink-0">
                <div style={{ color: 'var(--ink-500)' }}>No hay ventas pagadas pendientes de activar.</div>
              </div>
            ) : (
              <Pagination
                page={Math.floor(skip / TAKE) + 1}
                totalPages={totalPages}
                total={page.total}
                skip={skip}
                take={TAKE}
                itemCount={page.items.length}
                onPrev={() => setSkip(Math.max(0, skip - TAKE))}
                onNext={() => setSkip(skip + TAKE < page.total ? skip + TAKE : skip)}
              />
            )}
          </>
        )}
      </Card>

      <div className="text-[11.5px]" style={{ color: 'var(--ink-500)' }}>
        El botón verde resuelve cada caso: activa la venta, ajusta el plan o abre el expediente en la pestaña correcta. Las ventas
        listas también se activan solas cada 15 minutos cuando llega la constancia.
      </div>

      <AjustarPlanModal
        isOpen={ajustar !== null}
        onClose={() => setAjustar(null)}
        venta={ajustar}
        onDone={() => void load()}
      />
    </div>
  )
}

/** Fila de venta por activar con su acción directa: activar ahora, ajustar plan o ir al expediente. */
function VentaRow({
  venta: v,
  onOpenExpediente,
  onChanged,
  onAjustar,
}: {
  venta: VentaPorActivar
  onOpenExpediente: (taxpayerId: number, tab?: ExpedienteTab) => void
  onChanged: () => void
  onAjustar: () => void
}) {
  const m = MOTIVOS[v.queFalta] ?? { ...MOTIVO_DEFAULT, label: v.queFalta }
  const [busy, setBusy] = useState(false)
  const [nota, setNota] = useState<{ ok: boolean; texto: string } | null>(null)

  async function activar() {
    setBusy(true)
    setNota(null)
    const res = await activarVentasPendientes(v.taxpayerId)
    setBusy(false)
    if (!res.success) {
      setNota({ ok: false, texto: res.error.message || 'No se pudo activar.' })
      return
    }
    const r = res.value
    if (r.activadas.some((a) => a.saleId === v.saleId)) {
      setNota({ ok: true, texto: 'Activada: declaraciones creadas y contador asignado.' })
      onChanged()
    } else if (r.regimenNoCoincide.includes(v.saleId)) {
      setNota({ ok: false, texto: 'El plan no cubre el régimen de la constancia. Usa Ajustar plan.' })
    } else if (r.sinConstancia.includes(v.saleId)) {
      setNota({ ok: false, texto: 'El cliente aún no tiene constancia registrada.' })
    } else if (r.errores.length > 0) {
      setNota({ ok: false, texto: r.errores[0] })
    } else {
      setNota({ ok: true, texto: 'Sin cambios: la venta ya estaba activada.' })
      onChanged()
    }
  }

  function accionPrincipal() {
    if (m.tipo === 'activar') return void activar()
    if (m.tipo === 'ajustar') return onAjustar()
    onOpenExpediente(v.taxpayerId, m.tab)
  }

  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      <td className="px-4 py-3">
        <div className="font-semibold" style={{ color: 'var(--ink-900)' }}>{v.legalName || v.rfc}</div>
        <div className="text-[11.5px]" style={{ color: 'var(--ink-500)' }}>{v.email ?? '—'}{v.phone ? ` · ${v.phone}` : ''}</div>
      </td>
      <td className="px-4 py-3"><code style={{ ...MONO, fontSize: '11px', color: 'var(--ink-700)' }}>{v.rfc}</code></td>
      <td className="px-4 py-3 text-[12.5px]" style={{ color: 'var(--ink-700)' }}>{v.planes.join(', ') || '—'}</td>
      <td className="px-4 py-3 tabular-nums font-semibold" style={{ color: v.amount === 0 ? 'var(--ink-500)' : 'var(--ink-900)' }}>
        {money(v.amount)}
        {v.amount === 0 && <div className="text-[11px] font-normal" style={{ color: 'var(--ink-500)' }}>cupón / cobro externo</div>}
      </td>
      <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>{fecha(v.saleDate)}</td>
      <td className="px-4 py-3 tabular-nums font-bold" style={{ color: v.diasDesdePago >= 15 ? 'var(--coral)' : 'var(--ink-700)' }}>{v.diasDesdePago}</td>
      <td className="px-4 py-3 text-[12.5px]" style={{ color: v.vendedor ? 'var(--ink-900)' : 'var(--ink-500)' }}>
        {v.vendedor ? (
          <span className="font-semibold truncate max-w-[200px] inline-block align-bottom" title={v.origen}>{v.vendedor}</span>
        ) : (
          'Cliente'
        )}
      </td>
      <td className="px-4 py-3 min-w-[260px]">
        <Badge kind={m.kind}>{m.label}</Badge>
        {m.accion && (
          <div className="text-[11.5px] leading-snug mt-1.5 max-w-[300px]" style={{ color: 'var(--ink-700)' }}>{m.accion}</div>
        )}
        {nota && (
          <div className="text-[11.5px] font-semibold mt-1.5 max-w-[300px]" style={{ color: nota.ok ? 'var(--brand-700)' : 'var(--violet-ink)' }}>{nota.texto}</div>
        )}
      </td>
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <div className="inline-flex items-center gap-1.5">
          <button
            type="button"
            disabled={busy}
            onClick={accionPrincipal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-bold whitespace-nowrap transition-[opacity,transform] duration-150 active:scale-[0.97] hover:opacity-95 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#00D3A1 0%,#00AD87 100%)', color: '#fff' }}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : m.tipo === 'activar' ? <Zap size={14} /> : null}
            {m.boton} {m.tipo === 'expediente' && <ArrowRight size={14} />}
          </button>
          <button
            type="button"
            onClick={() => onOpenExpediente(v.taxpayerId)}
            title="Abrir el expediente completo"
            className="inline-flex items-center px-3 py-2 rounded-xl text-[12.5px] font-bold whitespace-nowrap transition-[background-color,transform] duration-150 active:scale-[0.97]"
            style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
          >
            Expediente
          </button>
        </div>
      </td>
    </tr>
  )
}
