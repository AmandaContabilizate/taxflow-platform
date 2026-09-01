'use client'

import { AlertCircle, AlertTriangle, History, Loader2, Pencil, Plus, ShieldCheck, Tag } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  getDiscountCodeAuthorizations,
  getDiscountCodeLookups,
  getDiscountCodes,
} from '@/features/discountCodes/actions/getDiscountCodes.action'
import { saveDiscountCode } from '@/features/discountCodes/actions/saveDiscountCode.action'
import type {
  DiscountCodeAdmin,
  DiscountCodeAuthorization,
  DiscountCodeLookups,
} from '@/features/discountCodes/types'
import { CodigoModal } from '../codigos-descuento/codigo-modal'
import { MONO } from '../constants'
import { Badge, Card } from '../ui'

type OwnerFilter = 'all' | 'user' | 'partner' | 'none'

/** Código fuera del tope de negocio (20% / 3 declaraciones). */
const fueraDeTope = (c: DiscountCodeAdmin) =>
  c.discountTypeId === 2 ? (c.declarationsCount ?? 0) > 3 : c.discountPercent > 20

export function CodigosDescuentoScreen({ permissions = [] }: { permissions?: string[] }) {
  const canAuthorize = permissions.includes('Admin.AuthorizeHighDiscount')
  const [codes, setCodes] = useState<DiscountCodeAdmin[]>([])
  const [lookups, setLookups] = useState<DiscountCodeLookups | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DiscountCodeAdmin | null>(null)
  const [authorizingId, setAuthorizingId] = useState<number | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  // Resumen del último reparto de un código base ("repartido a N asesores…").
  const [repartoMsg, setRepartoMsg] = useState<string | null>(null)
  const [showLog, setShowLog] = useState(false)
  const [log, setLog] = useState<DiscountCodeAuthorization[] | null>(null)
  const [logLoading, setLogLoading] = useState(false)
  const [logError, setLogError] = useState<string | null>(null)

  const toggleLog = async () => {
    const next = !showLog
    setShowLog(next)
    if (next && log === null) {
      setLogLoading(true)
      setLogError(null)
      const res = await getDiscountCodeAuthorizations()
      if (res.success) setLog(res.value)
      else setLogError(res.error.message)
      setLogLoading(false)
    }
  }

  // Códigos fuera de tope guardados inactivos = solicitudes esperando autorización.
  const pendientesAutorizar = codes.filter((c) => !c.isActive && fueraDeTope(c))

  /** La activación ES la autorización (queda auditada en UpdatedBy del código). */
  const autorizar = async (c: DiscountCodeAdmin) => {
    setAuthorizingId(c.id)
    setAuthError(null)
    const res = await saveDiscountCode({
      id: c.id,
      code: c.code,
      description: c.description ?? undefined,
      sellerUserId: c.ownerType === 'user' ? (c.sellerUserId ?? undefined) : undefined,
      partnershipId: c.ownerType === 'partner' ? (c.partnershipId ?? undefined) : undefined,
      discountTypeId: c.discountTypeId,
      discountPercent: c.discountTypeId === 1 ? c.discountPercent : undefined,
      declarationsCount: c.discountTypeId === 2 ? (c.declarationsCount ?? undefined) : undefined,
      maxUses: c.maxUses ?? 0,
      subscriptionPlanIds: c.subscriptionPlanIds,
      whitelistedRfcs: c.whitelistedRfcs,
      isActive: true,
      // Autorizar no debe borrar la marca de código base ni su segmento de reparto.
      isBaseTemplate: c.isBaseTemplate,
      baseTemplateSegmentId: c.baseTemplateSegmentId,
    })
    setAuthorizingId(null)
    if (res.success) {
      setLog(null) // la bitácora acaba de crecer: se recarga al reabrirla
      void load()
    } else {
      setAuthError(`${c.code}: ${res.error.message}`)
    }
  }

  const load = async () => {
    setLoading(true)
    setError(null)
    const [codesRes, lookupsRes] = await Promise.all([getDiscountCodes(), getDiscountCodeLookups()])
    if (codesRes.success) {
      setCodes(codesRes.value)
    } else {
      setError(codesRes.error.message)
    }
    if (lookupsRes.success) setLookups(lookupsRes.value)
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = codes.filter((c) => {
    if (ownerFilter !== 'all' && c.ownerType !== ownerFilter) return false
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      return (
        c.code.toLowerCase().includes(q) ||
        (c.ownerName ?? '').toLowerCase().includes(q) ||
        (c.description ?? '').toLowerCase().includes(q)
      )
    }
    return true
  })

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }
  const openEdit = (c: DiscountCodeAdmin) => {
    setEditing(c)
    setModalOpen(true)
  }

  return (
    <div className="flex flex-col gap-5 max-w-full">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código o dueño…"
            className="px-3 py-2 rounded-lg text-[13.5px] outline-none focus:ring-2 min-w-[220px]"
            style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
          />
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value as OwnerFilter)}
            className="px-3 py-2 rounded-lg text-[13.5px] outline-none focus:ring-2 cursor-pointer"
            style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
          >
            <option value="all">Todos los dueños</option>
            <option value="user">Ejecutivos / Finder Fee</option>
            <option value="partner">Partners</option>
            <option value="none">Sin dueño</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void toggleLog()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-[13.5px] transition hover:opacity-90 cursor-pointer"
            style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
          >
            <History size={15} /> {showLog ? 'Ocultar bitácora' : 'Bitácora'}
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-[13.5px] transition hover:opacity-95 cursor-pointer"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            <Plus size={16} /> Nuevo código
          </button>
        </div>
      </div>

      {/* Bitácora de autorizaciones: auditoría inmutable de códigos fuera de tope */}
      {showLog && (
        <Card>
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="text-[14.5px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
              Bitácora de autorizaciones
            </div>
            <div className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
              Quién activó o desactivó códigos fuera de tope (más de 20% o más de 3 declaraciones).
              Estas filas no se modifican nunca — son el rastro de auditoría.
            </div>
          </div>
          {logLoading ? (
            <div className="py-8 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
              <Loader2 size={16} className="animate-spin" /> Cargando bitácora…
            </div>
          ) : logError ? (
            <div className="py-6 px-5 text-[13px]" style={{ color: 'var(--violet-ink)' }}>{logError}</div>
          ) : !log || log.length === 0 ? (
            <div className="py-8 px-5 text-center text-[13px]" style={{ color: 'var(--ink-500)' }}>
              Aún no hay autorizaciones registradas — la bitácora empieza a llenarse cuando se
              active o desactive un código fuera de tope.
            </div>
          ) : (
            <div className="overflow-x-auto px-2 py-2">
              <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Fecha', 'Código', 'Acción', 'Descuento', 'Usos máx.', 'RFCs', 'Autorizó'].map((h) => (
                      <th
                        key={h}
                        className="py-2.5 px-3 text-[11px] font-extrabold uppercase tracking-wider"
                        style={{ color: 'var(--ink-500)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {log.map((a) => (
                    <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="py-2.5 px-3 text-[12.5px]" style={{ color: 'var(--ink-700)' }}>
                        {new Date(a.authorizedAt).toLocaleString('es-MX', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 px-3">
                        <code style={{ ...MONO, fontSize: '12px', color: 'var(--ink-900)', fontWeight: 700 }}>
                          {a.code}
                        </code>
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge kind={a.action === 'activated' ? 'brand' : 'default'}>
                          {a.action === 'activated' ? 'Autorizado (activado)' : 'Desactivado'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-[13px]" style={{ color: 'var(--ink-900)' }}>
                        {a.discountTypeId === 2 ? (
                          <b>{a.declarationsCount} futuras</b>
                        ) : (
                          <b>{a.discountPercent}%</b>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[12.5px]" style={{ ...MONO, color: 'var(--ink-700)' }}>
                        {a.maxUses ?? '—'}
                      </td>
                      <td className="py-2.5 px-3 text-[12.5px]" style={{ color: 'var(--ink-700)' }}>
                        {a.whitelistedRfcsCount > 0 ? `${a.whitelistedRfcsCount} exclusivos` : 'Abierto'}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-[12.5px] font-semibold" style={{ color: 'var(--ink-900)' }}>
                          {a.authorizedByName ?? '—'}
                        </div>
                        {a.authorizedByEmail && (
                          <div className="text-[11px]" style={{ color: 'var(--ink-500)' }}>
                            {a.authorizedByEmail}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Cola de autorización (como Asignaciones): códigos fuera de tope esperando activación */}
      {!loading && canAuthorize && pendientesAutorizar.length > 0 && (
        <div
          className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-[13px] font-semibold"
          style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)', border: '1px solid var(--border)' }}
        >
          <ShieldCheck size={16} className="flex-shrink-0" />
          {pendientesAutorizar.length === 1
            ? '1 código fuera de tope espera tu autorización'
            : `${pendientesAutorizar.length} códigos fuera de tope esperan tu autorización`}{' '}
          — revísalos y actívalos con "Autorizar".
        </div>
      )}
      {authError && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-2xl text-[13px] font-semibold"
          style={{ background: 'var(--coral-soft)', color: 'var(--violet-ink)', border: '1px solid var(--border)' }}
        >
          <AlertCircle size={15} className="flex-shrink-0" /> No se pudo autorizar — {authError}
        </div>
      )}
      {repartoMsg && (
        <div
          className="flex items-center justify-between gap-2 px-4 py-3 rounded-2xl text-[13px] font-semibold"
          style={{ background: 'var(--hero-brand-soft)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
        >
          <span>{repartoMsg}</span>
          <button
            type="button"
            onClick={() => setRepartoMsg(null)}
            className="text-[12px] font-bold cursor-pointer"
            style={{ color: 'var(--ink-500)' }}
          >
            Cerrar
          </button>
        </div>
      )}

      {loading ? (
        <Card>
          <div className="py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando códigos…
          </div>
        </Card>
      ) : error ? (
        <Card>
          <div className="py-10 text-center flex flex-col items-center gap-3">
            <AlertCircle size={22} style={{ color: 'var(--violet-ink)' }} />
            <div className="text-[13.5px]" style={{ color: 'var(--ink-700)' }}>{error}</div>
            <button
              type="button"
              onClick={() => void load()}
              className="px-4 py-2 rounded-full text-[13px] font-bold transition cursor-pointer"
              style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
            >
              Reintentar
            </button>
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="py-12 text-center flex flex-col items-center gap-3">
            <Tag size={26} style={{ color: 'var(--ink-400)' }} />
            <div className="text-[15px] font-bold" style={{ color: 'var(--ink-900)' }}>
              {codes.length === 0 ? 'Aún no hay códigos — crea el primero' : 'Sin resultados con esos filtros'}
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto px-2 py-2">
            <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Código', 'Dueño', 'Descuento', 'Planes', 'Usos', 'RFCs', 'Creado', 'Estatus', ''].map((h) => (
                    <th
                      key={h}
                      className="py-2.5 px-3 text-[11px] font-extrabold uppercase tracking-wider"
                      style={{ color: 'var(--ink-500)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1.5">
                        <code style={{ ...MONO, fontSize: '12.5px', color: 'var(--ink-900)', fontWeight: 700 }}>
                          {c.code}
                        </code>
                        {/* Espejo en Stripe: solo aplica a códigos de porcentaje. "none" son
                            los previos a la funcionalidad — se sincronizan al volver a guardar. */}
                        {c.discountTypeId === 1 && c.stripeStatus === 'synced' && (
                          <span
                            title="Sincronizado con Stripe: este código también existe en el dashboard de Stripe"
                            className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full"
                            style={{ background: 'var(--brand-100)', color: 'var(--brand-900)' }}
                          >
                            Stripe ✓
                          </span>
                        )}
                        {c.discountTypeId === 1 && c.stripeStatus === 'error' && (
                          <span
                            title={`No se pudo sincronizar con Stripe: ${c.stripeSyncError ?? 'error desconocido'}. El código funciona igual; vuelve a guardarlo para reintentar.`}
                            className="inline-flex items-center gap-0.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full cursor-help"
                            style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)' }}
                          >
                            <AlertTriangle size={10} /> Stripe pendiente
                          </span>
                        )}
                      </span>
                      {c.description && (
                        <div className="text-[11.5px]" style={{ color: 'var(--ink-500)' }}>{c.description}</div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {c.isBaseTemplate ? (
                        <Badge kind="brand">Base para asesores</Badge>
                      ) : c.ownerType === 'none' ? (
                        <span className="text-[12.5px]" style={{ color: 'var(--ink-400)' }}>Sin dueño</span>
                      ) : (
                        <>
                          <Badge kind={c.ownerType === 'partner' ? 'sky' : c.ownerProfileType === 'Finder Fee' ? 'amber' : 'brand'}>
                            {c.ownerType === 'partner' ? 'Partner' : c.ownerProfileType ?? 'Ejecutivo'}
                          </Badge>
                          <div className="text-[12px] mt-1" style={{ color: 'var(--ink-700)' }}>{c.ownerName}</div>
                        </>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[13px]" style={{ color: 'var(--ink-900)' }}>
                      {c.discountTypeId === 2 ? (
                        <>
                          <b>{c.declarationsCount}</b> declaraciones
                          <div className="text-[11px]" style={{ color: 'var(--ink-500)' }}>futuras de regalo</div>
                        </>
                      ) : (
                        <b>{c.discountPercent}%</b>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[13px]" style={{ color: 'var(--ink-700)' }}>
                      {/* Sin planes ligados = el código aplica a TODO el catálogo */}
                      {c.subscriptionPlanIds.length === 0 ? 'Todos' : c.subscriptionPlanIds.length}
                    </td>
                    <td className="py-3 px-3 text-[13px]" style={{ ...MONO, color: 'var(--ink-700)' }}>
                      {c.usedCount}/{c.maxUses ?? '—'}
                    </td>
                    <td className="py-3 px-3 text-[13px]" style={{ color: 'var(--ink-700)' }}>
                      {c.whitelistedRfcsCount > 0 ? `${c.whitelistedRfcsCount} exclusivos` : 'Abierto'}
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-[12.5px]" style={{ color: 'var(--ink-700)' }}>
                        {new Date(c.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      {c.createdByName && (
                        <div className="text-[11.5px] mt-0.5 truncate max-w-[160px]" title={c.createdByName} style={{ color: 'var(--ink-500)' }}>
                          por {c.createdByName}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {!c.isActive && fueraDeTope(c) ? (
                        <Badge kind="amber">Por autorizar</Badge>
                      ) : (
                        <Badge kind={c.isActive ? 'brand' : 'default'}>{c.isActive ? 'Activo' : 'Inactivo'}</Badge>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        {canAuthorize && !c.isActive && fueraDeTope(c) && (
                          <button
                            type="button"
                            onClick={() => void autorizar(c)}
                            disabled={authorizingId === c.id}
                            title="Autorizar y activar este código fuera de tope"
                            className="inline-flex items-center gap-1 text-[11.5px] font-bold px-2 py-1.5 rounded-lg transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
                            style={{ background: 'var(--ink-900)', color: '#fff' }}
                          >
                            {authorizingId === c.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <ShieldCheck size={12} />
                            )}
                            Autorizar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          title="Editar código"
                          aria-label={`Editar código ${c.code}`}
                          className="p-1.5 rounded-lg transition hover:bg-[var(--ink-50)] cursor-pointer"
                          style={{ border: '1px solid var(--border)' }}
                        >
                          <Pencil size={14} style={{ color: 'var(--ink-500)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <CodigoModal
        open={modalOpen}
        code={editing}
        lookups={lookups}
        canAuthorize={canAuthorize}
        onClose={() => setModalOpen(false)}
        onSaved={(reparto) => {
          setRepartoMsg(
            reparto
              ? reparto.creadas === 0 && reparto.yaTenian === 0
                ? 'Código base guardado — aún no hay asesores a quienes repartirlo.'
                : `Código base repartido: ${reparto.creadas} ${reparto.creadas === 1 ? 'copia nueva' : 'copias nuevas'}; ${reparto.yaTenian} ${reparto.yaTenian === 1 ? 'asesor ya tenía la suya' : 'asesores ya tenían la suya'}.`
              : null,
          )
          void load()
        }}
      />
    </div>
  )
}
