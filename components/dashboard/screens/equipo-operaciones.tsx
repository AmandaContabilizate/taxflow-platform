'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Send,
  ShieldAlert,
  UserPlus,
  Users,
} from 'lucide-react'
import { getEquipoOperaciones } from '@/features/operations/actions/getEquipoOperaciones.action'
import type { EquipoOperaciones } from '@/features/operations/types'
import { getRolesList } from '@/features/roles/actions/getRolesList.action'
import { inviteTeamMember } from '@/features/team/actions/inviteTeamMember.action'
import { DISPLAY } from '../constants'
import { Modal } from '../modal'
import { Badge, Card, ErrorState, NoAccessState, isForbiddenError } from '../ui'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const INVITE_PERMISSION = 'GerenciaComercial.InviteTeamMember'

/**
 * Equipo de operaciones (gerencia de contabilidad): KPIs del área + carga y
 * avance por contador del periodo, e invitación de nuevos contadores (rol fijo,
 * sin código de vendedor). Todo con datos reales de declaraciones y carteras.
 */
export function EquipoOperacionesScreen({ permissions = [] }: { permissions?: string[] }) {
  const canInvite = permissions.includes(INVITE_PERMISSION)
  const hoy = new Date()
  const [year, setYear] = useState(hoy.getFullYear())
  const [month, setMonth] = useState(hoy.getMonth() + 1)

  const [data, setData] = useState<EquipoOperaciones | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await getEquipoOperaciones(year, month)
    if (res.success) setData(res.value)
    else setError(res.error.message)
    setLoading(false)
  }, [year, month])

  useEffect(() => {
    load()
  }, [load])

  const maxCartera = useMemo(
    () => Math.max(1, ...(data?.miembros.map((m) => m.cartera) ?? [1])),
    [data],
  )

  if (error && isForbiddenError(error)) return <NoAccessState />

  return (
    <div className="flex flex-col gap-5 max-w-full">
      {/* Controles: periodo + invitar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3 py-2 rounded-lg text-[13.5px] outline-none cursor-pointer"
            style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
          >
            {MESES.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 rounded-lg text-[13.5px] outline-none cursor-pointer"
            style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
          >
            {[hoy.getFullYear(), hoy.getFullYear() - 1, hoy.getFullYear() - 2].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        {canInvite && (
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-[13.5px] transition hover:opacity-95 cursor-pointer"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            <UserPlus size={16} /> Invitar miembro
          </button>
        )}
      </div>

      {loading ? (
        <Card>
          <div className="py-12 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando equipo…
          </div>
        </Card>
      ) : error ? (
        <ErrorState message={error} />
      ) : data ? (
        <>
          {/* KPIs del área */}
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <Kpi
              icon={<Users size={16} />}
              label="Contadores"
              value={String(data.contadoresConCartera)}
              hint={`de ${data.poolContadores} en el pool · ${data.carteraTotal} clientes en cartera`}
            />
            <Kpi
              icon={<ClipboardList size={16} />}
              label="Por presentar"
              value={String(data.porPresentarTotal)}
              hint={data.vencidasTotal > 0 ? `${data.vencidasTotal} vencidas` : 'ninguna vencida'}
              tone={data.vencidasTotal > 0 ? 'warn' : undefined}
            />
            <Kpi
              icon={<CheckCircle2 size={16} />}
              label="Avance del área"
              value={`${data.avanceArea}%`}
              hint={`${data.presentadasTotal} presentadas en ${MESES[month - 1]}`}
              tone="ok"
            />
            <Kpi
              icon={<ShieldAlert size={16} />}
              label="CIEC inválidas"
              value={String(data.ciecInvalidasTotal)}
              hint="bloquean la presentación"
              tone={data.ciecInvalidasTotal > 0 ? 'warn' : undefined}
            />
          </div>

          {/* Colaboradores */}
          <Card>
            <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="text-[15px] font-extrabold" style={DISPLAY}>Colaboradores</div>
              <div className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
                Detalle operativo por contador — periodo {MESES[month - 1]} {year}.
              </div>
            </div>
            {data.miembros.length === 0 ? (
              <div className="py-10 text-center text-[13px]" style={{ color: 'var(--ink-500)' }}>
                No hay contadores en el pool. Invita al primero con el botón de arriba.
              </div>
            ) : (
              <div className="overflow-x-auto px-2 py-2">
                <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Colaborador', 'Clientes', 'Por presentar', 'Vencidas', 'Presentadas', 'CIEC inv.', 'Avance', 'Carga'].map((h) => (
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
                    {data.miembros.map((m) => {
                      const carga = Math.round((m.cartera / maxCartera) * 100)
                      return (
                        <tr key={m.userId} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-extrabold flex-shrink-0"
                                style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
                              >
                                {m.nombre.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')}
                              </div>
                              <div className="min-w-0">
                                <div className="text-[13.5px] font-bold truncate" style={{ color: 'var(--ink-900)' }}>
                                  {m.nombre}
                                </div>
                                <div className="text-[11.5px] truncate" style={{ color: 'var(--ink-500)' }}>
                                  {m.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-[14px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
                            {m.cartera}
                          </td>
                          <td className="py-3 px-3 text-[14px] font-bold" style={{ color: 'var(--ink-700)' }}>
                            {m.porPresentar}
                          </td>
                          <td className="py-3 px-3">
                            {m.vencidas > 0 ? (
                              <Badge kind="amber">{m.vencidas}</Badge>
                            ) : (
                              <span className="text-[13px]" style={{ color: 'var(--ink-400)' }}>0</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-[14px] font-bold" style={{ color: 'var(--brand-700)' }}>
                            {m.presentadas}
                          </td>
                          <td className="py-3 px-3">
                            {m.ciecInvalidas > 0 ? (
                              <Badge kind="amber">{m.ciecInvalidas}</Badge>
                            ) : (
                              <span className="text-[13px]" style={{ color: 'var(--ink-400)' }}>0</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <BarraProgreso
                              porcentaje={Number(m.avancePorcentaje)}
                              color="var(--brand-500)"
                              etiquetaColor="var(--brand-700)"
                            />
                          </td>
                          <td className="py-3 px-3">
                            <BarraProgreso
                              porcentaje={m.cartera === 0 ? 0 : carga}
                              color="var(--ink-900)"
                              etiquetaColor={carga > 80 ? '#B97A12' : 'var(--ink-700)'}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      ) : null}

      {canInvite && (
        <InvitarContadorModal
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          onInvited={() => {
            setInviteOpen(false)
            void load()
          }}
        />
      )}
    </div>
  )
}

function Kpi({
  icon, label, value, hint, tone,
}: { icon: React.ReactNode; label: string; value: string; hint: string; tone?: 'ok' | 'warn' }) {
  return (
    <Card>
      <div className="px-4 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10.5px] font-extrabold uppercase tracking-[0.08em]" style={{ color: 'var(--ink-500)' }}>
            {label}
          </span>
          <span style={{ color: tone === 'ok' ? 'var(--brand-700)' : tone === 'warn' ? '#B97A12' : 'var(--ink-400)' }}>
            {icon}
          </span>
        </div>
        <div className="text-[26px] font-extrabold tracking-tight mt-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
          {value}
        </div>
        <div className="text-[11.5px] font-semibold" style={{ color: tone === 'warn' ? '#B97A12' : 'var(--ink-500)' }}>
          {hint}
        </div>
      </div>
    </Card>
  )
}

function BarraProgreso({
  porcentaje, color, etiquetaColor,
}: { porcentaje: number; color: string; etiquetaColor: string }) {
  const pct = Math.max(0, Math.min(100, porcentaje))
  return (
    <div className="flex items-center gap-2 min-w-[110px]">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--ink-50)' }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: color, transition: 'width 300ms ease' }}
        />
      </div>
      <span className="text-[11.5px] font-extrabold w-9 text-right" style={{ color: etiquetaColor }}>
        {pct}%
      </span>
    </div>
  )
}

/**
 * Invitar contador: rol FIJO (Contador), sin código de vendedor ni segmento —
 * el backend valida que gerencia contable solo pueda invitar este rol.
 */
function InvitarContadorModal({
  open, onClose, onInvited,
}: { open: boolean; onClose: () => void; onInvited: () => void }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [roleId, setRoleId] = useState('')
  const [roleError, setRoleError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (!open) return
    void (async () => {
      const res = await getRolesList()
      if (res.success) {
        const contador = res.value.find((r) =>
          ['accounter', 'contador'].includes(r.name.trim().toLowerCase()),
        )
        if (contador) setRoleId(contador.id)
        else setRoleError('No se encontró el rol Contador en el catálogo.')
      } else {
        setRoleError(`No pudimos cargar los roles: ${res.error.message}`)
      }
    })()
  }, [open])

  const canSubmit =
    fullName.trim().length > 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && roleId !== ''

  const close = () => {
    setFullName('')
    setEmail('')
    setError(null)
    setSent(false)
    onClose()
  }

  const submit = async () => {
    if (!canSubmit || loading) return
    setLoading(true)
    setError(null)
    const res = await inviteTeamMember({
      fullName: fullName.trim(),
      email: email.trim(),
      roleId,
      memberType: 3, // Contador: sin código de vendedor ni perfil comercial
    })
    setLoading(false)
    if (!res.success) {
      setError(res.error.message)
      return
    }
    setSent(true)
    onInvited()
  }

  if (!open) return null

  if (sent) {
    return (
      <Modal isOpen onClose={close} title="Invitación enviada">
        <div className="flex flex-col gap-4">
          <p className="text-[13.5px]" style={{ color: 'var(--ink-700)' }}>
            <b>{fullName}</b> recibió un correo con sus credenciales de acceso al backoffice con
            el rol <b>Contador</b>. Su cartera se llenará al asignarle clientes.
          </p>
          <button
            type="button"
            onClick={close}
            className="w-full py-3 rounded-full font-bold text-[14px] transition hover:opacity-95 cursor-pointer"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            Listo
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen onClose={close} title="Nuevo miembro del equipo">
      <div className="flex flex-col gap-4">
        <p className="text-[13px]" style={{ color: 'var(--ink-500)' }}>
          Le enviaremos sus credenciales por correo. Al entrar, su perfil quedará creado con los
          permisos del rol Contador.
        </p>

        {(error || roleError) && (
          <div className="p-3 rounded-lg text-[13px] flex items-center gap-2" style={{ background: 'var(--coral-soft)', color: '#9E3A15' }}>
            <AlertCircle size={15} className="flex-shrink-0" /> {error ?? roleError}
          </div>
        )}

        <div>
          <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--ink-700)' }}>
            Nombre completo
          </label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ej. Diana Reyes"
            className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none focus:ring-2"
            style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--ink-700)' }}>
            Correo corporativo
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nombre@contabilizate.mx"
            className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none focus:ring-2"
            style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--ink-700)' }}>
            Rol
          </label>
          <div
            className="w-full px-3 py-2.5 rounded-lg text-[14px]"
            style={{ background: 'var(--ink-50)', border: '1px solid var(--border)', color: 'var(--ink-700)' }}
          >
            Contador
          </div>
          <p className="text-[11.5px] mt-1" style={{ color: 'var(--ink-400)' }}>
            Tu rol solo permite invitar contadores.
          </p>
        </div>

        <div className="flex gap-3 justify-end pt-1">
          <button
            type="button"
            onClick={close}
            disabled={loading}
            className="px-5 py-2.5 rounded-full font-bold text-[13.5px] transition cursor-pointer"
            style={{ background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border-strong, var(--border))' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!canSubmit || loading}
            className="px-5 py-2.5 rounded-full font-bold text-[13.5px] inline-flex items-center gap-2 transition hover:opacity-95 disabled:opacity-50 cursor-pointer"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            Enviar invitación
          </button>
        </div>
      </div>
    </Modal>
  )
}
