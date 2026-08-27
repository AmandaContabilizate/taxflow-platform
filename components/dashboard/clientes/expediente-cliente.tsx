'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Package,
  Phone,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import {
  getExpedienteCliente,
  getSatCredentials,
} from '@/features/taxpayers/actions/expedienteCliente.action'
import { getTaxCertificate } from '@/features/taxpayers/actions/getTaxCertificate.action'
import { getComplianceOpinion } from '@/features/taxpayers/actions/getComplianceOpinion.action'
import {
  getComplianceOpinionMetadata,
  getTaxCertificateMetadata,
  type DocumentMetadata,
} from '@/features/taxpayers/actions/getDocumentMetadata.action'
import type { ExpedienteCliente, ExpedientePeriodo } from '@/features/taxpayers/types'
import { DISPLAY, MONO } from '../constants'
import { Badge, Card, ErrorState, NoAccessState, Tabs, isForbiddenError } from '../ui'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function periodoLabel(p: ExpedientePeriodo): string {
  if (p.periodValueId >= 101 && p.periodValueId <= 112)
    return `${MESES[p.periodValueId - 101]} ${p.fiscalYear}`
  if (p.periodValueId === 501) return `Anual ${p.fiscalYear}`
  if (p.periodValueId >= 201 && p.periodValueId <= 206)
    return `Bimestre ${p.periodValueId - 200} · ${p.fiscalYear}`
  return `Periodo ${p.periodValueId} · ${p.fiscalYear}`
}

const fmtMoney = (n: number) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

function CopyBtn({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      title={`Copiar ${label}`}
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        })
      }}
      className="inline-flex items-center gap-1 text-[11.5px] font-bold px-2 py-1 rounded-lg transition hover:opacity-80"
      style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
    >
      {copied ? <Check size={12} style={{ color: 'var(--brand-700)' }} /> : <Copy size={12} />}
      Copiar
    </button>
  )
}

interface Props {
  taxpayerId: number
  permissions: string[]
  onBack: () => void
}

const TAB_RESUMEN = 'Resumen'
const TAB_CREDENCIALES = 'Credenciales'
const TAB_PRODUCTOS = 'Productos'
const TAB_DOCUMENTOS = 'Documentos'

/**
 * Expediente del cliente (pantalla Clientes → clic en el nombre). Función de
 * gerencia comercial: tabs Resumen / Credenciales / Productos. La tab de
 * Credenciales solo se pinta con el claim Contador.GetSatPassword y pide la
 * contraseña BAJO DEMANDA al backend.
 */
export function ExpedienteCliente({ taxpayerId, permissions, onBack }: Props) {
  const canCredentials = permissions.includes('Contador.GetSatPassword')
  const canDocs =
    permissions.includes('Contador.GetTaxCertificate') ||
    permissions.includes('Contador.GetComplianceOpinion')
  const tabs = useMemo(() => {
    const t = [TAB_RESUMEN]
    if (canCredentials) t.push(TAB_CREDENCIALES)
    t.push(TAB_PRODUCTOS)
    if (canDocs) t.push(TAB_DOCUMENTOS)
    return t
  }, [canCredentials, canDocs])
  const [tab, setTab] = useState(0)

  const [data, setData] = useState<ExpedienteCliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await getExpedienteCliente(taxpayerId)
    if (res.success) setData(res.value)
    else setError(res.error.message)
    setLoading(false)
  }, [taxpayerId])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <Card>
        <div className="px-6 py-14 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
          <Loader2 size={18} className="animate-spin" /> Cargando expediente…
        </div>
      </Card>
    )
  }
  if (error || !data) {
    return (
      <div className="flex flex-col gap-3">
        <BackButton onBack={onBack} />
        {error && isForbiddenError(error) ? <NoAccessState /> : <ErrorState message={error ?? 'Sin datos'} />}
      </div>
    )
  }

  const ciecOk = data.passwordState === 1
  const initials = data.legalName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

  const activeTab = tabs[tab] ?? TAB_RESUMEN

  return (
    <div className="flex flex-col gap-4">
      {/* Encabezado del expediente */}
      <Card>
        <div className="px-5 py-4 flex items-start gap-4 flex-wrap">
          <BackButton onBack={onBack} />
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-[15px] font-extrabold"
            style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[18px] font-extrabold tracking-tight" style={DISPLAY}>
                {data.legalName}
              </span>
              <Badge kind={ciecOk ? 'brand' : 'amber'}>
                {ciecOk ? 'CIEC válida' : data.passwordState === 2 ? 'CIEC inválida' : 'CIEC sin verificar'}
              </Badge>
            </div>
            <div className="flex items-center gap-3 flex-wrap mt-1.5 text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
              <span className="inline-flex items-center gap-1.5">
                <code style={{ ...MONO, fontSize: '11.5px', color: 'var(--ink-700)' }}>{data.rfc}</code>
                <CopyBtn value={data.rfc} label="RFC" />
              </span>
              {data.email && (
                <span className="inline-flex items-center gap-1"><Mail size={13} /> {data.email}</span>
              )}
              {data.phone && (
                <span className="inline-flex items-center gap-1"><Phone size={13} /> {data.phone}</span>
              )}
            </div>
            {/* Equipo asignado */}
            <div className="flex items-center gap-2 flex-wrap mt-2.5">
              <span className="text-[10.5px] font-extrabold uppercase tracking-wide" style={{ color: 'var(--ink-400)' }}>
                Equipo
              </span>
              <EquipoChip nombre={data.vendedorNombre} rol="Vendedor" />
              <EquipoChip nombre={data.contadorNombre} rol="Contador" />
            </div>
          </div>
        </div>
      </Card>

      <Tabs items={tabs} active={tab} onChange={setTab} />

      {activeTab === TAB_RESUMEN && <TabResumen data={data} ciecOk={ciecOk} />}
      {activeTab === TAB_CREDENCIALES && canCredentials && (
        <TabCredenciales rfc={data.rfc} ciecOk={ciecOk} data={data} />
      )}
      {activeTab === TAB_PRODUCTOS && <TabProductos data={data} />}
      {activeTab === TAB_DOCUMENTOS && canDocs && <TabDocumentos rfc={data.rfc} permissions={permissions} />}
    </div>
  )
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      aria-label="Volver a Clientes"
      className="w-9 h-9 rounded-xl flex items-center justify-center transition hover:opacity-80 active:scale-[0.97] flex-shrink-0"
      style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
    >
      <ArrowLeft size={16} />
    </button>
  )
}

function EquipoChip({ nombre, rol }: { nombre: string | null; rol: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2 py-1 rounded-full"
      style={{
        background: nombre ? 'var(--ink-50)' : 'var(--amber-soft)',
        color: nombre ? 'var(--ink-700)' : 'var(--violet-ink)',
        border: '1px solid var(--border)',
      }}
    >
      {nombre ?? 'Sin asignar'}
      <span style={{ color: 'var(--ink-400)' }}>· {rol}</span>
    </span>
  )
}

function TabResumen({ data, ciecOk }: { data: ExpedienteCliente; ciecOk: boolean }) {
  const presentadas = data.periodos.filter((p) => p.presentada).length
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
      <Card>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="text-[14.5px] font-extrabold" style={DISPLAY}>Datos del cliente</div>
          <div className="text-[12px]" style={{ color: 'var(--ink-500)' }}>Información fiscal y de contacto.</div>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Dato label="RFC"><code style={{ ...MONO, fontSize: '12.5px' }}>{data.rfc}</code></Dato>
          <Dato label="Régimen">
            {data.regimenes.length > 0
              ? data.regimenes.map((r) => `${r.name}${r.satCode ? ` (${r.satCode})` : ''}`).join(' · ')
              : '—'}
          </Dato>
          <Dato label="Correo">{data.email ?? '—'}</Dato>
          <Dato label="Teléfono">{data.phone ?? '—'}</Dato>
          <Dato label="Fecha de creación">{fmtDate(data.createdAt)}</Dato>
          <Dato label="Ventas pagadas">{String(data.ventasPagadas)}</Dato>
        </div>
      </Card>

      <Card>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="text-[14.5px] font-extrabold" style={DISPLAY}>Estado operativo</div>
          <div className="text-[12px]" style={{ color: 'var(--ink-500)' }}>Indicadores del expediente.</div>
        </div>
        <div className="p-3">
          <IndicadorRow
            icon={ciecOk ? <ShieldCheck size={15} style={{ color: 'var(--brand-700)' }} /> : <ShieldAlert size={15} style={{ color: 'var(--violet-ink)' }} />}
            label="Credenciales SAT"
            value={ciecOk ? 'Activas' : 'Revisar'}
            tone={ciecOk ? 'ok' : 'warn'}
          />
          <IndicadorRow
            icon={<Package size={15} style={{ color: 'var(--ink-500)' }} />}
            label="Productos comprados"
            value={String(data.productos.length)}
          />
          <IndicadorRow
            icon={<Check size={15} style={{ color: 'var(--ink-500)' }} />}
            label="Periodos presentados (últimos)"
            value={`${presentadas} de ${data.periodos.length}`}
          />
        </div>
      </Card>
    </div>
  )
}

function Dato({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10.5px] font-extrabold uppercase tracking-wide mb-0.5" style={{ color: 'var(--ink-400)' }}>
        {label}
      </div>
      <div className="text-[13.5px] font-semibold" style={{ color: 'var(--ink-900)' }}>{children}</div>
    </div>
  )
}

function IndicadorRow({
  icon, label, value, tone,
}: { icon: React.ReactNode; label: string; value: string; tone?: 'ok' | 'warn' }) {
  return (
    <div className="flex items-center gap-2.5 px-2.5 py-2.5 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
      {icon}
      <span className="flex-1 text-[13px] font-semibold" style={{ color: 'var(--ink-700)' }}>{label}</span>
      <span
        className="text-[12.5px] font-extrabold"
        style={{ color: tone === 'ok' ? 'var(--brand-700)' : tone === 'warn' ? 'var(--violet-ink)' : 'var(--ink-900)' }}
      >
        {value}
      </span>
    </div>
  )
}

function TabCredenciales({ rfc, ciecOk, data }: { rfc: string; ciecOk: boolean; data: ExpedienteCliente }) {
  const [password, setPassword] = useState<string | null>(null)
  const [tieneEfirma, setTieneEfirma] = useState<boolean | null>(null)
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function reveal() {
    if (password !== null) {
      setVisible((v) => !v)
      return
    }
    setLoading(true)
    setError(null)
    const res = await getSatCredentials(rfc)
    setLoading(false)
    if (res.success) {
      setPassword(res.value.satPassword)
      setTieneEfirma(res.value.tieneEfirma)
      setVisible(true)
    } else {
      setError(res.error.message)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--brand-100)', color: 'var(--brand-700)' }}
            >
              <KeyRound size={18} />
            </div>
            <div>
              <div className="text-[14.5px] font-extrabold" style={DISPLAY}>Acceso al portal SAT</div>
              <div className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
                Usa la CIEC del cliente para entrar al portal del SAT. La contraseña se pide al
                sistema solo cuando la muestras.
              </div>
            </div>
          </div>
          <Badge kind={ciecOk ? 'brand' : 'amber'}>{ciecOk ? 'Activa' : 'Revisar'}</Badge>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {error && <ErrorState message={error} />}
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            <div className="rounded-xl px-4 py-3" style={{ border: '1px solid var(--border)' }}>
              <div className="text-[10.5px] font-extrabold uppercase tracking-wide mb-1" style={{ color: 'var(--ink-400)' }}>
                RFC del cliente
              </div>
              <div className="flex items-center justify-between gap-2">
                <code style={{ ...MONO, fontSize: '14px', color: 'var(--ink-900)' }}>{rfc}</code>
                <CopyBtn value={rfc} label="RFC" />
              </div>
            </div>
            <div className="rounded-xl px-4 py-3" style={{ border: '1px solid var(--border)' }}>
              <div className="text-[10.5px] font-extrabold uppercase tracking-wide mb-1" style={{ color: 'var(--ink-400)' }}>
                Contraseña CIEC
              </div>
              <div className="flex items-center justify-between gap-2">
                <code style={{ ...MONO, fontSize: '14px', color: 'var(--ink-900)' }}>
                  {visible && password !== null ? password : '••••••••••'}
                </code>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => void reveal()}
                    title={visible ? 'Ocultar' : 'Mostrar'}
                    className="inline-flex items-center gap-1 text-[11.5px] font-bold px-2 py-1 rounded-lg transition hover:opacity-80"
                    style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
                  >
                    {loading ? <Loader2 size={12} className="animate-spin" /> : visible ? <EyeOff size={12} /> : <Eye size={12} />}
                    {visible ? 'Ocultar' : 'Mostrar'}
                  </button>
                  {password !== null && <CopyBtn value={password} label="contraseña" />}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href="https://www.sat.gob.mx"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[13px] font-bold px-3.5 py-2 rounded-xl transition hover:opacity-90"
              style={{ background: 'var(--ink-900)', color: '#fff' }}
            >
              <ExternalLink size={14} /> Abrir portal SAT
            </a>
            {tieneEfirma !== null && (
              <Badge kind={tieneEfirma ? 'brand' : 'default'}>
                {tieneEfirma ? 'e.firma cargada' : 'Sin e.firma cargada'}
              </Badge>
            )}
          </div>

          <div
            className="flex items-center gap-2 text-[12px] px-3 py-2.5 rounded-xl"
            style={{ background: 'var(--ink-50)', color: 'var(--ink-500)', border: '1px solid var(--border)' }}
          >
            <Lock size={13} className="flex-shrink-0" />
            Por seguridad la contraseña no se carga con la página: se solicita al sistema solo al
            pulsar Mostrar, y este acceso está protegido por el permiso de credenciales.
          </div>
        </div>
      </Card>

      {/* Histórico real: validaciones de CIEC (Users.CiecVerifications) y
          vigencias de e.firma (Users.DigitalIdentities). Solo estados y fechas. */}
      <Card>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="text-[14.5px] font-extrabold" style={DISPLAY}>Todas las credenciales</div>
          <div className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
            Estado, vigencia e histórico de los accesos registrados.
          </div>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <CredencialCiec ciecOk={ciecOk} historial={data.ciecHistorial} />
          <CredencialEfirmas efirmas={data.efirmas} />
        </div>
      </Card>
    </div>
  )
}

function relTime(iso: string): string {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (dias <= 0) return 'hoy'
  if (dias === 1) return 'ayer'
  if (dias < 60) return `hace ${dias} días`
  const meses = Math.floor(dias / 30)
  return `hace ${meses} ${meses === 1 ? 'mes' : 'meses'}`
}

function CredencialCiec({ ciecOk, historial }: { ciecOk: boolean; historial: ExpedienteCliente['ciecHistorial'] }) {
  const [open, setOpen] = useState(false)
  const ultima = historial[0]
  return (
    <div className="rounded-xl" style={{ border: '1px solid var(--border)' }}>
      <div className="px-4 py-3 flex items-center gap-3 flex-wrap">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: ciecOk ? 'var(--brand-100)' : 'var(--amber-soft)',
            color: ciecOk ? 'var(--brand-700)' : 'var(--violet-ink)',
          }}
        >
          <KeyRound size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-extrabold" style={{ color: 'var(--ink-900)' }}>CIEC SAT</div>
          <div className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
            {ultima ? `Última validación ${relTime(ultima.fecha)} · ${ultima.fuente}` : 'Sin validaciones registradas'}
          </div>
        </div>
        <Badge kind={ciecOk ? 'brand' : 'amber'}>{ciecOk ? 'Activa' : 'Revisar'}</Badge>
        {historial.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="text-[12px] font-bold px-2.5 py-1.5 rounded-lg transition hover:opacity-80"
            style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
          >
            {open ? 'Ocultar histórico' : `Histórico (${historial.length})`}
          </button>
        )}
      </div>
      {open && (
        <div className="px-4 pb-3 flex flex-col">
          {historial.map((h, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 py-2 border-t text-[12.5px]"
              style={{ borderColor: 'var(--border)' }}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: h.valida ? 'var(--brand-500)' : h.estatus === 'Inválida' ? 'var(--coral)' : 'var(--amber)' }}
              />
              <span className="font-bold" style={{ color: 'var(--ink-900)' }}>{h.estatus}</span>
              <span style={{ color: 'var(--ink-500)' }}>{fmtDate(h.fecha)} · {relTime(h.fecha)}</span>
              <span className="ml-auto text-[11.5px]" style={{ color: 'var(--ink-400)' }}>{h.fuente}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** Convierte un PDF en base64 a un blob URL efímero (se revoca solo a los 60s). */
function base64ToPdfUrl(base64: string): string {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
  return url
}

function TabDocumentos({ rfc, permissions }: { rfc: string; permissions: string[] }) {
  const canCsf = permissions.includes('Contador.GetTaxCertificate')
  const canOpinion = permissions.includes('Contador.GetComplianceOpinion')
  return (
    <Card>
      <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="text-[14.5px] font-extrabold" style={DISPLAY}>Documentos</div>
        <div className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
          Documentos fiscales del cliente descargados del SAT. Si el documento tiene más de 30
          días, la redescarga corre por cuenta del cliente (usa su CIEC).
        </div>
      </div>
      <div className="p-4 flex flex-col gap-3">
        {canCsf && (
          <DocumentoRow
            titulo="Constancia de situación fiscal"
            rfc={rfc}
            fetchDoc={getTaxCertificate}
            fetchMeta={getTaxCertificateMetadata}
          />
        )}
        {canOpinion && (
          <DocumentoRow
            titulo="Opinión de cumplimiento"
            rfc={rfc}
            fetchDoc={getComplianceOpinion}
            fetchMeta={getComplianceOpinionMetadata}
          />
        )}
      </div>
    </Card>
  )
}

type DocResult = { success: true; value: { base64: string } } | { success: false; error: { message: string } }
type MetaResult = { success: true; value: DocumentMetadata } | { success: false; error: { message: string } }

function DocumentoRow({
  titulo, rfc, fetchDoc, fetchMeta,
}: {
  titulo: string
  rfc: string
  fetchDoc: (rfc: string) => Promise<DocResult>
  fetchMeta: (rfc: string) => Promise<MetaResult>
}) {
  const [meta, setMeta] = useState<DocumentMetadata | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetchMeta(rfc).then((res) => {
      if (!cancelled && res.success) setMeta(res.value)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfc])

  async function ver() {
    setLoading(true)
    setError(null)
    // La pestaña se abre AHORA, dentro del gesto del click. Si se espera al
    // await (la descarga del SAT puede tardar minutos) el navegador bloquea el
    // window.open por "popup no solicitado por el usuario".
    const tab = window.open('', '_blank')
    if (tab) tab.document.write('Generando documento, no cierres esta pestaña…')
    const res = await fetchDoc(rfc)
    setLoading(false)
    if (res.success) {
      const url = base64ToPdfUrl(res.value.base64)
      if (tab && !tab.closed) tab.location.href = url
      else window.open(url, '_blank')
    } else {
      if (tab && !tab.closed) tab.close()
      setError(res.error.message)
    }
  }

  return (
    <div className="rounded-xl px-4 py-3" style={{ border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3 flex-wrap">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--ink-50)', color: 'var(--ink-700)' }}
        >
          <FileText size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-extrabold" style={{ color: 'var(--ink-900)' }}>{titulo}</div>
          <div className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
            {meta?.generatedAt
              ? `Generado ${fmtDate(String(meta.generatedAt))}${meta?.expiresAt ? ` · vigente hasta ${fmtDate(String(meta.expiresAt))}` : ''}`
              : meta?.status
                ? String(meta.status)
                : 'PDF del SAT'}
          </div>
        </div>
        <button
          type="button"
          onClick={() => void ver()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-bold px-3 py-1.5 rounded-lg transition hover:opacity-80 disabled:opacity-50"
          style={{ background: 'var(--ink-900)', color: '#fff' }}
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <ExternalLink size={13} />}
          Ver documento
        </button>
      </div>
      {error && (
        <div className="mt-2 text-[12px] px-3 py-2 rounded-lg" style={{ background: 'var(--coral-soft)', color: 'var(--violet-ink)' }}>
          {error} — si el documento tiene más de 30 días, la redescarga requiere la sesión del
          cliente (usa su CIEC).
        </div>
      )}
    </div>
  )
}

function CredencialEfirmas({ efirmas }: { efirmas: ExpedienteCliente['efirmas'] }) {
  if (efirmas.length === 0) {
    return (
      <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ border: '1px dashed var(--border-strong)', opacity: 0.8 }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--ink-50)', color: 'var(--ink-500)' }}>
          <KeyRound size={16} />
        </div>
        <div>
          <div className="text-[13.5px] font-extrabold" style={{ color: 'var(--ink-700)' }}>e.firma</div>
          <div className="text-[12px]" style={{ color: 'var(--ink-500)' }}>Sin e.firma registrada.</div>
        </div>
      </div>
    )
  }
  const now = Date.now()
  return (
    <>
      {efirmas.map((e, i) => {
        const vence = new Date(e.noAfter).getTime()
        const vencida = vence < now
        const porVencer = !vencida && vence < now + 30 * 86_400_000
        const kind = vencida ? 'amber' : porVencer ? 'amber' : 'brand'
        const label = vencida ? 'Vencida' : porVencer ? 'Por vencer' : 'Vigente'
        return (
          <div key={i} className="rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap" style={{ border: '1px solid var(--border)' }}>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: kind === 'brand' ? 'var(--brand-100)' : 'var(--amber-soft)',
                color: kind === 'brand' ? 'var(--brand-700)' : 'var(--violet-ink)',
              }}
            >
              <KeyRound size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
                e.firma {efirmas.length > 1 ? `#${i + 1}` : ''}
              </div>
              <div className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
                Certificado vigente del {fmtDate(e.notBefore)} al {fmtDate(e.noAfter)}
                {!e.isActive && ' · inactiva en el sistema'}
              </div>
            </div>
            <Badge kind={kind}>{label}</Badge>
          </div>
        )
      })}
    </>
  )
}

function TabProductos({ data }: { data: ExpedienteCliente }) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="text-[14.5px] font-extrabold" style={DISPLAY}>Productos comprados</div>
          <div className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
            Partidas de ventas pagadas, la más reciente primero.
          </div>
        </div>
        {data.productos.length === 0 ? (
          <div className="px-5 py-8 text-center text-[13px]" style={{ color: 'var(--ink-500)' }}>
            Sin productos comprados.
          </div>
        ) : (
          <div className="p-3 grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {data.productos.map((p, i) => (
              <div key={i} className="rounded-xl px-4 py-3.5" style={{ border: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[13.5px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
                    {p.plan || 'Plan'}
                  </div>
                  <span className="text-[13.5px] font-extrabold" style={{ color: 'var(--brand-700)' }}>
                    {fmtMoney(p.monto)}
                  </span>
                </div>
                <div className="text-[11.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                  Comprado el {fmtDate(p.fecha)}
                </div>
                <div className="flex gap-3 mt-2 text-[12px]" style={{ color: 'var(--ink-700)' }}>
                  <span>Futuras: <b>{p.futuras}</b></span>
                  <span>Regularizaciones: <b>{p.regularizaciones}</b></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="text-[14.5px] font-extrabold" style={DISPLAY}>Periodos del servicio</div>
          <div className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
            Declaraciones del contribuyente (las {data.periodos.length} más recientes): verdes ya
            presentadas, ámbar por presentar.
          </div>
        </div>
        {data.periodos.length === 0 ? (
          <div className="px-5 py-8 text-center text-[13px]" style={{ color: 'var(--ink-500)' }}>
            Aún no hay declaraciones registradas.
          </div>
        ) : (
          <div className="p-3 grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}>
            {data.periodos.map((p, i) => (
              <div
                key={i}
                className="rounded-xl px-3.5 py-3"
                style={{
                  background: p.presentada ? 'var(--brand-100)' : 'var(--amber-soft)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="text-[13px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
                  {periodoLabel(p)}
                </div>
                <div
                  className="text-[10.5px] font-extrabold uppercase tracking-wide mt-0.5"
                  style={{ color: p.presentada ? 'var(--brand-900)' : 'var(--violet-ink)' }}
                  title={p.estatus}
                >
                  {p.presentada ? 'Presentada' : 'Por presentar'}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
