'use client'

import { useMemo, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { DISPLAY } from '../constants'
import { Card, Tabs } from '../ui'

const CODE_EXAMPLES = {
  'C#': {
    label: 'C#',
    install: 'dotnet add package System.IdentityModel.Tokens.Jwt',
    code: `using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.IdentityModel.Tokens;

// 1. Cargar la llave privada RSA desde un archivo PEM
var privateKeyPem = File.ReadAllText("private_key.pem");
var rsa = RSA.Create();
rsa.ImportFromPem(privateKeyPem);

// 2. Crear las credenciales de firma
var signingCredentials = new SigningCredentials(
    new RsaSecurityKey(rsa),
    SecurityAlgorithms.RsaSha256
);

// 3. Definir los claims del token
var claims = new[]
{
    new Claim("Provider", "NombreDelProvider"),        // REQUERIDO
    new Claim("ExternalId", "12345-user-id"),          // REQUERIDO
    new Claim("Email", "usuario@ejemplo.com"),         // REQUERIDO
    new Claim("Name", "Juan Pérez"),                   // REQUERIDO
};

// 4. Generar el token JWT
var tokenDescriptor = new SecurityTokenDescriptor
{
    Subject = new ClaimsIdentity(claims),
    Expires = DateTime.UtcNow.AddHours(1),
    IssuedAt = DateTime.UtcNow,
    SigningCredentials = signingCredentials
};

var tokenHandler = new JwtSecurityTokenHandler();
var token = tokenHandler.CreateToken(tokenDescriptor);
var jwt = tokenHandler.WriteToken(token);

Console.WriteLine("Token JWT generado:");
Console.WriteLine(jwt);`,
  },
  Java: {
    label: 'Java',
    install: `<!-- Maven: agregar a pom.xml -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.6</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.6</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.6</version>
    <scope>runtime</scope>
</dependency>`,
    code: `import io.jsonwebtoken.Jwts;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;

public class TokenGenerator {
    public static void main(String[] args) throws Exception {
        // 1. Cargar la llave privada RSA desde archivo PEM
        String pemContent = new String(Files.readAllBytes(Paths.get("private_key.pem")));
        String privateKeyBase64 = pemContent
            .replace("-----BEGIN RSA PRIVATE KEY-----", "")
            .replace("-----END RSA PRIVATE KEY-----", "")
            .replaceAll("\\\\s", "");

        byte[] keyBytes = Base64.getDecoder().decode(privateKeyBase64);
        PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(keyBytes);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        PrivateKey privateKey = keyFactory.generatePrivate(keySpec);

        // 2. Generar el token JWT
        Instant now = Instant.now();
        String jwt = Jwts.builder()
            .claim("Provider", "NombreDelProvider")        // REQUERIDO
            .claim("ExternalId", "12345-user-id")          // REQUERIDO
            .claim("Email", "usuario@ejemplo.com")         // REQUERIDO
            .claim("Name", "Juan Pérez")                   // REQUERIDO
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusSeconds(3600)))   // 1 hora
            .signWith(privateKey)
            .compact();

        System.out.println("Token JWT generado:");
        System.out.println(jwt);
    }
}`,
  },
  Python: {
    label: 'Python',
    install: 'pip install PyJWT cryptography',
    code: `import jwt
import datetime
from cryptography.hazmat.primitives import serialization

# 1. Cargar la llave privada RSA desde archivo PEM
with open("private_key.pem", "rb") as f:
    private_key = serialization.load_pem_private_key(f.read(), password=None)

# 2. Definir el payload del token
payload = {
    "Provider": "NombreDelProvider",        # REQUERIDO
    "ExternalId": "12345-user-id",          # REQUERIDO
    "Email": "usuario@ejemplo.com",         # REQUERIDO
    "Name": "Juan Pérez",                   # REQUERIDO
    "iat": datetime.datetime.now(datetime.timezone.utc),
    "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1),
}

# 3. Generar el token JWT
token = jwt.encode(payload, private_key, algorithm="RS256")

print("Token JWT generado:")
print(token)`,
  },
  JavaScript: {
    label: 'JavaScript',
    install: 'npm install jsonwebtoken',
    code: `const jwt = require('jsonwebtoken');
const fs = require('fs');

// 1. Cargar la llave privada RSA desde archivo PEM
const privateKey = fs.readFileSync('private_key.pem', 'utf8');

// 2. Definir el payload del token
const payload = {
  Provider: 'NombreDelProvider',        // REQUERIDO
  ExternalId: '12345-user-id',          // REQUERIDO
  Email: 'usuario@ejemplo.com',         // REQUERIDO
  Name: 'Juan Pérez',                   // REQUERIDO
};

// 3. Generar el token JWT
const token = jwt.sign(payload, privateKey, {
  algorithm: 'RS256',
  expiresIn: '1h',
});

console.log('Token JWT generado:');
console.log(token);`,
  },
  PHP: {
    label: 'PHP',
    install: 'composer require firebase/php-jwt',
    code: `<?php
require 'vendor/autoload.php';

use Firebase\\JWT\\JWT;

// 1. Cargar la llave privada RSA desde archivo PEM
$privateKey = file_get_contents('private_key.pem');

// 2. Definir el payload del token
$now = time();
$payload = [
    'Provider'   => 'NombreDelProvider',   // REQUERIDO
    'ExternalId' => '12345-user-id',        // REQUERIDO
    'Email'      => 'usuario@ejemplo.com',  // REQUERIDO
    'Name'       => 'Juan Pérez',           // REQUERIDO
    'iat'        => $now,
    'exp'        => $now + 3600,            // 1 hora
];

// 3. Generar el token JWT (RS256 con la llave privada)
$jwt = JWT::encode($payload, $privateKey, 'RS256');

echo "Token JWT generado:" . PHP_EOL;
echo $jwt . PHP_EOL;`,
  },
} as const

type TabKey = keyof typeof CODE_EXAMPLES
type UsageMethod = 'iframe' | 'redirect'

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

interface KeysCodeExamplesProps {
  providerName: string | null
  identityBaseUrl: string
}

export function KeysCodeExamples({ providerName, identityBaseUrl }: KeysCodeExamplesProps) {
  const [tab, setTab] = useState(0)
  const [method, setMethod] = useState<UsageMethod>('iframe')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const tabKeys = Object.keys(CODE_EXAMPLES) as TabKey[]

  const name = providerName || 'NombreDelProvider'

  const current = useMemo(() => {
    const raw = CODE_EXAMPLES[tabKeys[tab]]
    return { ...raw, code: raw.code.replaceAll('NombreDelProvider', name) }
  }, [tab, name, tabKeys])

  const usageMethods = useMemo(
    () => ({
      iframe: {
        label: 'IFrame (embebido)',
        description:
          'Embebe el portal de Contabox dentro de su propia página; el usuario permanece en su sitio.',
        code: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Integración Contabox - Partnership</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #F3F1FA; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #332670; }
    .iframe-container { width: 100%; height: 80vh; border: 1px solid #E7E4F4; border-radius: 8px; overflow: hidden; background: #fff; }
    iframe { width: 100%; height: 100%; border: none; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Portal de Declaraciones</h1>
    <div class="iframe-container">
      <!--
        Reemplace {TOKEN_JWT} con el token generado desde su backend.
        NUNCA genere el token en el frontend, la llave privada
        debe permanecer siempre en su servidor.
      -->
      <iframe
        src="${identityBaseUrl}/public/validate?token={TOKEN_JWT}"
        title="Contabox - Declaraciones"
        allow="clipboard-write"
      ></iframe>
    </div>
  </div>

  <script>
    // Ejemplo: cargar el iframe dinámicamente con un token obtenido de su API
    async function loadContabox() {
      // Obtenga el token desde su propio backend (NUNCA exponga la llave privada)
      const response = await fetch('/api/mi-backend/generar-token-contabox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          externalId: '12345-user-id',
          email: 'usuario@ejemplo.com',
          name: 'Juan Pérez'
        })
      });

      const { token } = await response.json();

      const iframe = document.querySelector('iframe');
      iframe.src = \`${identityBaseUrl}/external-auth/validate?token=\${token}\`;
    }

    // Descomentar para cargar dinámicamente:
    // loadContabox();
  </script>
</body>
</html>`,
      },
      redirect: {
        label: 'Redirect (302)',
        description:
          'Su servidor responde con un 302 hacia Contabox; el usuario navega fuera de su sitio, se crea la sesión y aterriza en el dashboard de Contabox (sin URL de retorno personalizada).',
        code: `# Respuesta HTTP que debe emitir su servidor tras firmar el JWT:
HTTP/1.1 302 Found
Location: ${identityBaseUrl}/public/validate?token={TOKEN_JWT}


// --- C# (ASP.NET) ---
// Tras firmar el JWT en su backend:
return Redirect($"${identityBaseUrl}/public/validate?token={jwt}");


<?php
// --- PHP nativo ---
// Tras firmar el JWT en su backend:
header("Location: ${identityBaseUrl}/public/validate?token={$jwt}");
exit;

// El usuario es redirigido a Contabox, se crea la sesión y aterriza en el
// dashboard de Contabox. A diferencia del iframe, navega fuera de su sitio.
// NUNCA genere el token en el frontend: la llave privada permanece en su servidor.`,
      },
    }),
    [identityBaseUrl],
  )

  async function handleCopy(text: string, index: number) {
    await navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <Card className="mt-2">
      <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="text-[11px] font-extrabold uppercase tracking-wide" style={{ color: 'var(--brand-700)' }}>
          1. Sign-in · iniciar sesión
        </div>
        <div className="text-[15px] font-extrabold mt-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
          Ejemplos de integración
        </div>
        <div className="text-[13px] mt-1" style={{ color: 'var(--ink-500)' }}>
          Utilice su llave privada para generar tokens JWT desde su servidor. Nunca exponga la llave
          privada en el frontend.
        </div>
      </div>

      <div className="p-4 border-b" style={{ borderColor: 'var(--border)', background: 'var(--hero-info)' }}>
        <div className="text-[13px] font-extrabold mb-2" style={{ color: 'var(--ink-900)' }}>
          Estructura del Token (Payload)
        </div>
        <pre className="bg-card border p-3 rounded text-xs overflow-x-auto" style={{ borderColor: 'var(--border)', color: 'var(--ink-700)' }}>
{`{
  "Provider": "${name}",      // REQUERIDO: Nombre del partnership registrado
  "ExternalId": "12345-user-id",        // REQUERIDO: ID único del usuario en su sistema
  "Email": "usuario@ejemplo.com",       // REQUERIDO: Email del usuario
  "Name": "Juan Pérez",                 // REQUERIDO: Nombre completo del usuario
  "exp": 1735689600,                    // REQUERIDO: Fecha de expiración (Unix timestamp)
  "iat": 1735603200                     // OPCIONAL: Fecha de emisión (Unix timestamp)
}`}
        </pre>
      </div>

      <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <Tabs items={tabKeys.map((k) => CODE_EXAMPLES[k].label)} active={tab} onChange={setTab} />
      </div>

      <div className="p-4 flex flex-col gap-3">
        {current.install && (
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wide mb-1" style={{ color: 'var(--ink-500)' }}>
              Instalación
            </div>
            <CodeBlock
              code={current.install}
              copied={copiedIndex === 0}
              onCopy={() => handleCopy(current.install, 0)}
            />
          </div>
        )}

        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-wide mb-1" style={{ color: 'var(--ink-500)' }}>
            Generación del Token
          </div>
          <CodeBlock code={current.code} copied={copiedIndex === 1} onCopy={() => handleCopy(current.code, 1)} />
        </div>
      </div>

      <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="text-[14px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
          Uso del token
        </div>
        <div className="text-[13px] mb-3" style={{ color: 'var(--ink-500)' }}>
          Elija cómo enviar al usuario al portal de Contabox con el token generado.
        </div>

        <Tabs
          items={[usageMethods.iframe.label, usageMethods.redirect.label]}
          active={method === 'iframe' ? 0 : 1}
          onChange={(i) => setMethod(i === 0 ? 'iframe' : 'redirect')}
        />

        <div className="text-[13px] mt-3 mb-1" style={{ color: 'var(--ink-500)' }}>
          {usageMethods[method].description}
        </div>

        <CodeBlock
          code={usageMethods[method].code}
          copied={copiedIndex === 2}
          onCopy={() => handleCopy(usageMethods[method].code, 2)}
        />
      </div>
    </Card>
  )
}
