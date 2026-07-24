'use client'

import { useMemo, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { DISPLAY } from '../constants'
import { Card, Tabs } from '../ui'

type TabKey = 'html' | 'curl' | 'csharp'

const ERROR_CODES: { code: string; status: number; meaning: string }[] = [
  { code: 'TOKEN_REQUIRED', status: 400, meaning: 'Falta el parámetro `token` en la URL.' },
  { code: 'INVALID_TOKEN_FORMAT', status: 400, meaning: 'El valor no es un JWT válido.' },
  { code: 'EMAIL_REQUIRED', status: 400, meaning: 'El JWT validó pero no trae el claim `Email` — obligatorio para sign-out.' },
  { code: 'EXTERNAL_ID_REQUIRED', status: 400, meaning: 'El JWT no trae `ExternalId`.' },
  { code: 'PROVIDER_NOT_FOUND', status: 401, meaning: 'Falta el claim `Provider` en el JWT.' },
  { code: 'PROVIDER_INVALID', status: 401, meaning: 'El partnership no existe o está inactivo.' },
  { code: 'NO_ACTIVE_KEY', status: 401, meaning: 'El partnership no tiene una llave pública activa y no revocada.' },
  { code: 'INVALID_SIGNATURE', status: 401, meaning: 'La firma del JWT no coincide con la llave pública registrada.' },
  { code: 'TOKEN_EXPIRED', status: 401, meaning: 'El `exp` del JWT ya pasó (5 minutos de tolerancia de reloj).' },
  { code: 'VALIDATION_ERROR', status: 500, meaning: 'Error inesperado al validar.' },
]

function CodeBlock({ code, onCopy, copied }: { code: string; onCopy: () => void; copied: boolean }) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onCopy}
        title="Copiar código"
        className="absolute top-2 right-2 w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-white transition"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto whitespace-pre leading-relaxed max-h-[500px]">
        {code}
      </pre>
    </div>
  )
}

interface KeysSignOutExamplesProps {
  providerName: string | null
  identityBaseUrl: string
}

export function KeysSignOutExamples({ providerName, identityBaseUrl }: KeysSignOutExamplesProps) {
  const [tab, setTab] = useState(0)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const name = providerName || 'NombreDelProvider'

  const examples = useMemo(
    () => ({
      html: {
        label: 'HTML (iframe oculto)',
        description: 'Cargar el endpoint en un iframe oculto desde el portal del proveedor.',
        code: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Cerrar sesión Contabox</title>
</head>
<body>
  <!--
    Iframe OCULTO: solo se necesita disparar el GET, no mostrar nada.
    Reemplace {TOKEN_JWT} con un JWT fresco firmado con la misma
    llave privada usada para el sign-in. Genérelo SIEMPRE en su
    backend (nunca exponga la llave privada en el frontend).
  -->
  <iframe
    src="${identityBaseUrl}/public/signout?token={TOKEN_JWT}"
    style="display:none"
    sandbox="allow-same-origin allow-scripts"
  ></iframe>

  <script>
    async function logoutContabox() {
      // 1) Pida un token fresco a su propio backend
      const response = await fetch('/api/mi-backend/generar-token-contabox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          externalId: '12345-user-id',
          email: 'usuario@ejemplo.com'
        })
      });
      const { token } = await response.json();

      // 2) Disparar el signout cargando el iframe
      const iframe = document.querySelector('iframe');
      iframe.src = \`${identityBaseUrl}/public/signout?token=\${token}\`;
    }
  </script>
</body>
</html>`,
      },
      curl: {
        label: 'curl · server-to-server',
        description:
          'Si su backend ya tiene el JWT generado, puede llamar al endpoint directamente sin pasar por el navegador.',
        code: `# El JWT debe estar firmado con su llave privada RSA activa.
# Mismo formato que el sign-in: claims Provider + Email + ExternalId + exp.
curl -sS -i "${identityBaseUrl}/public/signout?token=$TOKEN_JWT"

# Respuesta exitosa:
# HTTP/1.1 200 OK
# Content-Type: application/json
# { "success": true }`,
      },
      csharp: {
        label: 'C#',
        description: 'Llamada desde su backend usando HttpClient. Reutilice el helper de generación de JWT del sign-in.',
        code: `using System.Net.Http;

// 1) Genere un JWT fresco (mismo método que en el sign-in,
//    con los claims Provider + Email + ExternalId + exp).
var jwt = GenerateContaboxJwt(
    provider: "NombreDelProvider",
    email: "usuario@ejemplo.com",
    externalId: "12345-user-id"
);

// 2) Disparar el signout
using var client = new HttpClient();
var url = $"${identityBaseUrl}/public/signout?token={Uri.EscapeDataString(jwt)}";
var response = await client.GetAsync(url);

if (response.IsSuccessStatusCode)
{
    Console.WriteLine("Sesión revocada en Contabox.");
}
else
{
    var body = await response.Content.ReadAsStringAsync();
    Console.WriteLine($"Error {(int)response.StatusCode}: {body}");
}`,
      },
    }),
    [identityBaseUrl],
  )

  const tabKeys = Object.keys(examples) as TabKey[]
  const current = useMemo(() => {
    const raw = examples[tabKeys[tab]]
    return { ...raw, code: raw.code.replaceAll('NombreDelProvider', name) }
  }, [examples, tabKeys, tab, name])

  async function handleCopy(text: string, index: number) {
    await navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <Card className="mt-2">
      <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="text-[11px] font-extrabold uppercase tracking-wide" style={{ color: '#9E3A15' }}>
          2. Sign-out · cerrar sesión
        </div>
        <div className="text-[15px] font-extrabold mt-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
          Revocar la sesión del usuario
        </div>
        <div className="text-[13px] mt-1" style={{ color: 'var(--ink-500)' }}>
          Use el mismo flujo de generación de JWT que en el sign-in (llave privada RSA, claims
          `Provider` + `Email` + `ExternalId` + `exp`), pero apunte al endpoint de sign-out. Esto
          borra el access token del usuario en Contabox; su próxima petición HTTP recibirá 401 y
          será redirigido al inicio de sesión automáticamente.
        </div>
      </div>

      <div className="p-4 border-b" style={{ borderColor: 'var(--border)', background: 'var(--coral-soft)' }}>
        <div className="text-[13px] font-extrabold mb-2" style={{ color: 'var(--ink-900)' }}>
          Endpoint
        </div>
        <pre className="bg-card border p-3 rounded text-xs overflow-x-auto" style={{ borderColor: 'var(--border)', color: 'var(--ink-700)' }}>
{`GET ${identityBaseUrl}/public/signout?token={TOKEN_JWT}&system={int?}`}
        </pre>
        <div className="text-[11.5px] mt-2" style={{ color: 'var(--ink-500)' }}>
          `system` es opcional (default <code>1</code>); reservado para multi-origen.
        </div>
      </div>

      <div className="p-4 border-b" style={{ borderColor: 'var(--border)', background: 'var(--hero-info)' }}>
        <div className="text-[13px] font-extrabold mb-2" style={{ color: 'var(--ink-900)' }}>
          Claims requeridos en el JWT
        </div>
        <pre className="bg-card border p-3 rounded text-xs overflow-x-auto" style={{ borderColor: 'var(--border)', color: 'var(--ink-700)' }}>
{`{
  "Provider": "${name}",      // REQUERIDO: mismo nombre del partnership que en sign-in
  "Email": "usuario@ejemplo.com",       // REQUERIDO: identifica al usuario a revocar
  "ExternalId": "12345-user-id",        // REQUERIDO: ID en su sistema
  "exp": 1735689600,                    // REQUERIDO: Unix timestamp futuro
  "iat": 1735603200                     // OPCIONAL
}`}
        </pre>
        <div className="text-[11.5px] mt-2" style={{ color: 'var(--ink-500)' }}>
          Genere un JWT <strong>fresco</strong>: no reutilice el del sign-in si ya expiró. Algoritmo
          de firma: <code>RS256</code> (RSA-SHA256) con la misma llave privada que aparece en la
          tarjeta de arriba.
        </div>
      </div>

      <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <Tabs items={tabKeys.map((k) => examples[k].label)} active={tab} onChange={setTab} />
      </div>

      <div className="p-4 flex flex-col gap-3">
        <div className="text-[13px]" style={{ color: 'var(--ink-500)' }}>{current.description}</div>
        <CodeBlock code={current.code} copied={copiedIndex === 1} onCopy={() => handleCopy(current.code, 1)} />
      </div>

      <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="text-[14px] font-extrabold mb-2" style={{ color: 'var(--ink-900)' }}>
          Códigos de error
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr style={{ background: 'var(--ink-50)' }}>
                <th className="text-left p-2 border" style={{ borderColor: 'var(--border)', color: 'var(--ink-700)' }}>errorCode</th>
                <th className="text-left p-2 border" style={{ borderColor: 'var(--border)', color: 'var(--ink-700)' }}>HTTP</th>
                <th className="text-left p-2 border" style={{ borderColor: 'var(--border)', color: 'var(--ink-700)' }}>Significado</th>
              </tr>
            </thead>
            <tbody>
              {ERROR_CODES.map((row) => (
                <tr key={row.code}>
                  <td className="p-2 border font-mono" style={{ borderColor: 'var(--border)', color: 'var(--ink-900)' }}>{row.code}</td>
                  <td className="p-2 border" style={{ borderColor: 'var(--border)', color: 'var(--ink-700)' }}>{row.status}</td>
                  <td className="p-2 border" style={{ borderColor: 'var(--border)', color: 'var(--ink-700)' }}>{row.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-[11.5px] mt-2" style={{ color: 'var(--ink-500)' }}>
          En éxito: <code>200 OK</code> con cuerpo <code>{`{ "success": true }`}</code>.
        </div>
      </div>

      <div className="p-4 border-t" style={{ borderColor: 'var(--border)', background: 'var(--amber-soft)' }}>
        <div className="text-[13px] font-extrabold mb-2" style={{ color: 'var(--ink-900)' }}>
          Notas importantes
        </div>
        <ul className="list-disc list-inside text-xs space-y-1" style={{ color: 'var(--ink-700)' }}>
          <li>
            Revoca <strong>todas</strong> las sesiones JWT del usuario, no solo la del dispositivo o
            iframe que disparó la llamada.
          </li>
          <li>
            Cualquier transporte HTTP GET funciona: iframe oculto, <code>fetch</code> desde su
            backend, <code>curl</code>, etc. El iframe no es obligatorio.
          </li>
          <li>
            El navegador del usuario sigue con su cookie/JWT hasta su próximo request al backend de
            Contabox — ahí recibe 401 y el <code>AuthGuard</code> redirige a login. La revocación
            server-side es inmediata; la UI del usuario se actualiza en su próxima interacción.
          </li>
          <li>
            <strong>No use</strong> <code>iframe src=&quot;.../sign-out&quot;</code> apuntando a la
            web de Contabox: la cookie del usuario es <code>SameSite=Lax</code> y no viaja en
            iframes cross-origin, por lo que ese camino solo limpia cookies en el navegador y deja
            el JWT vivo del lado servidor.
          </li>
        </ul>
      </div>
    </Card>
  )
}
