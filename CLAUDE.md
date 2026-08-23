# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- Next.js 16 (App Router) + React 19
- Tailwind CSS 4 + tokens CSS custom en `app/globals.css`
- `next-themes` para modo claro/oscuro (estrategia `class` en `<html>`)
- Componentes shadcn/ui en `components/ui/*`
- Auth + features en `features/*` (server actions)

## Comandos

```bash
npm run dev      # servidor de desarrollo (localhost:3000)
npm run build    # build de producción
npm run start    # sirve el build de producción
npm run lint     # eslint .
```

No hay suite de tests configurada (sin Jest/Vitest/Playwright en `package.json`).
Evita comentarios innecesarios en el código, si al editar el archivo ves comentarios ineceesarios eliminalos

El backend (.NET, microservicios "ContaboxPro core2") es un repo aparte y debe
estar corriendo en local para que las server actions respondan; ver
`.env.local.example` para las URLs/puertos esperados de cada microservicio.

⚠️ `next.config.mjs` tiene `typescript.ignoreBuildErrors: true` — `next build`
**no falla** por errores de tipos. Corre `npx tsc --noEmit` explícitamente si
necesitas confirmar que el código type-checkea.

## Arquitectura

### El "dashboard" es una SPA dentro de una sola ruta

`app/` es deliberadamente delgado: solo existen unas pocas rutas reales
(`/`, `/auth/login`, `/dashboard`, `/onboarding`, `/planes`, `/pago-exitoso`).
Una vez el usuario entra a `/dashboard` (`app/dashboard/page.tsx`), toda la
navegación interna (Home, Clientes, Declaraciones, Facturas, Roles, etc.) es
**client-side**, manejada por `components/dashboard/index.tsx` con un
`useState<Screen>` y un switch de componentes en `components/dashboard/screens/`.
No busques rutas de Next.js para cada sección del dashboard — busca la entrada
correspondiente en `components/dashboard/screens/index.ts`.

- `components/dashboard/sidebar.tsx` — navegación lateral, filtra opciones
  según `role`/`permissions`.
- `components/dashboard/constants.ts` — títulos, roles normalizados, mapeos
  de display.
- `features/taxpayers/stores/rfcStore.tsx` — `RfcProvider`, contexto de RFC
  activo compartido entre pantallas (útil cuando un contador opera varios
  contribuyentes).

### Auth: doble capa (middleware + guard de cliente)

- `middleware.ts` — solo verifica la **presencia** de la cookie `auth_token`
  (edge, rápido) y redirige según `lib/routes.ts` (`PUBLIC_ROUTES` /
  `PROTECTED_ROUTES` / `AUTH_REDIRECT_ROUTES`).
- `app/auth-guard.tsx` (`AuthGuard`, client component) — revalida la sesión
  real en cada cambio de ruta llamando a `getStatusToken()` y expulsa a login
  si el token expiró. El middleware por sí solo no valida el JWT.
- Nuevas rutas públicas/protegidas se declaran en `lib/routes.ts`, no
  hardcodeadas en el middleware.

### Server actions → múltiples microservicios .NET

El backend está partido en microservicios independientes (ver
`lib/api/apiUrls.ts`): **Identity** (auth, users, taxpayers, roles),
**Procedures** (declaration, vault, cfdi, finances, stripe), **Reports**
(dashboards, ventas, taxpayers), **Scrappers** (SAT). Cada server action:

1. Vive en `features/<dominio>/actions/<verbo><Entidad>.action.ts` con
   `"use server"` al inicio.
2. Llama a `lib/api/fetchClient.ts` (`fetchGet`/`fetchPost`/`fetchPostPublic`/
   `fetchPostMultipart`/`fetchGetBlob`/…) pasando el **endpoint relativo**
   (definido en `lib/api/apiRoutes.ts`, catálogo central `API_ROUTES`) y el
   **`apiType`** correcto (clave de `API_BASE_URLS` en `apiUrls.ts`) para que
   pegue al microservicio correcto.
3. Envuelve la respuesta en `Result<T, E>` (`lib/common/result.ts`: `ok()` /
   `err()`), capturando `ApiError` (de `fetchClient.ts`, trae `status` y
   `body` del backend) — **nunca deja que la excepción suba al componente**.
   Ver `features/auth/actions/signIn.action.ts` o
   `features/taxpayers/actions/getTaxpayers.action.ts` como referencia.
4. `fetchClient.ts` agrega el header `Authorization: Bearer <auth_token>`
   automáticamente vía cookies (`buildAuthHeaders`) a menos que se use la
   variante `*Public`.

Al agregar un endpoint nuevo: primero añade la ruta a `API_ROUTES` en
`apiRoutes.ts` (agrupada por dominio, con comentario del `apiType`/método
esperado), luego el `apiType` en `apiUrls.ts` si es un microservicio nuevo,
y por último la action en `features/<dominio>/actions/`.

### Roles y permisos

Vienen del backend como claims en cookies (`claim_role`, `claim_permission`,
`userId`) y se parsean en `app/dashboard/page.tsx` (`parsePermissions`). Se
propagan por props a `Dashboard` → `Sidebar`/screens, que ocultan opciones de
navegación según rol/permiso. `features/roles/` maneja la administración de
roles (CRUD) contra el microservicio Identity (`apiType: "roles"`).

## Theming — REGLAS OBLIGATORIAS

El proyecto soporta modo claro y oscuro. Todo componente nuevo debe responder
automáticamente al tema. La fuente única de verdad son los tokens CSS definidos
en `app/globals.css` (bloques `:root` y `.dark`).

### Paleta oficial (manual de identidad Contabilízate 2023)

Solo estos cinco colores y sus tintes/sombras (más blanco/negro y el rojo
funcional de error `--danger`):

- Medium Spring Green `#06FF94` — chispa/acento sobre fondos oscuros
- Caribbean Green `#00D3A1` — brand principal (`--brand-500`, `--ring`)
- Persian Green `#00AD87` — brand para texto/botones sobre claro (`--brand-600`, `--accent`)
- Blue-Violet `#7339FD` — acento secundario (info, pendientes, `--violet`)
- Russian Violet `#221158` — ink/texto/fondos oscuros (`--ink-900`, `--primary`)

Para texto violeta sobre fondos suaves usa `var(--violet-ink)` (se aclara en
dark). No introduzcas ámbar, coral, azul cielo ni grises slate: los tokens
`--amber`/`--coral`/`--sky` existen por compatibilidad pero hoy apuntan a la
familia Blue-Violet.

### Qué usar

- **Fondos neutros, texto, bordes** → siempre vía `var(--token)` o la clase
  Tailwind equivalente (`bg-card`, `text-foreground`, `border-border`,
  `bg-muted`, `text-muted-foreground`).
- **Cards / contenedores** → `var(--card)` + `var(--card-foreground)`.
- **Sidebar** → `var(--sidebar)`, `--sidebar-foreground`, `--sidebar-accent`,
  `--sidebar-border`.
- **Botones primarios** → `var(--primary)` + `var(--primary-foreground)`.
- **Inputs** → `var(--input)`, focus con `var(--ring)`.
- **Acentos suaves (hero cards, info boxes)** → usar los tokens existentes:
  `--hero-info`, `--hero-amber`, `--hero-brand-soft`, `--hero-ink-soft`,
  `--hero-coral-soft-bg`, `--helpbox-bg` + `--helpbox-text`.
- **Estado activo (nav, tabs, chips seleccionados)** → `--nav-active-bg`,
  `--nav-active-fg`, `--nav-active-icon-bg`, `--nav-active-icon-fg`,
  `--nav-active-hint`. **NUNCA** `var(--ink-900)` + `color: '#fff'` hardcoded
  para fondos activos (en dark, `ink-900` se vuelve blanco y el texto desaparece).
- **Marca (verde Contabilízate)** → `--brand-50` … `--brand-900`. No cambian
  entre temas, son la identidad.

### Escala `--ink-*` (se INVIERTE en dark)

- En claro: `ink-50` muy claro, `ink-900` muy oscuro.
- En oscuro: `ink-50` oscuro, `ink-900` blanco.
- Para **texto** usa `ink-700`/`ink-900` (siempre legible).
- Para **fondos sutiles** (hover, chip, divider) usa `ink-50`/`ink-100`.

### Qué NO hacer

```tsx
style={{ background: '#FFF', color: '#221158' }}
style={{ background: 'linear-gradient(160deg,#FFF,#F9FAFB)' }}
className="bg-white text-gray-900"

// ❌ Mezclar token + literal en estado activo
style={{ background: 'var(--ink-900)', color: '#fff' }}

// ✅ Tokens semánticos
style={{ background: 'var(--card)', color: 'var(--foreground)' }}
className="bg-card text-foreground"

// ✅ Activo con tokens dedicados
style={{ background: 'var(--nav-active-bg)', color: 'var(--nav-active-fg)' }}
```

### Excepción: fondos de color fijo

Si por diseño el fondo es un color de marca constante (gradiente verde, banner
púrpura `#221158`, etc.), entonces el texto encima sí va literal (`#fff`,
`rgba(255,255,255,0.85)`). Regla: **fondo neutro → token. Fondo de color
constante → texto literal está OK.**

### Si necesitas un token nuevo

Agrégalo en `app/globals.css` en **los dos bloques** (`:root` y `.dark`)
simultáneamente. Nunca añadas solo el claro.

### Pantallas que NO deben seguir el tema (login, landing, públicas)

Aplica `className="force-light"` al contenedor raíz de la página. Eso ancla
todas las variables a sus valores claros aunque el `<html>` tenga `.dark`.
Ya usado en `app/auth/login/page.tsx`. Útil porque esas pantallas son
"públicas" / pre-sesión y no tienen el toggle de tema.

### Íconos

- `lucide-react`: omitir `color` o pasar `color="currentColor"` para heredar
  del padre.
- SVGs embebidos: usar `fill="currentColor"` y controlar con
  `style={{ color: 'var(--foreground)' }}`.

### Checklist antes de marcar tarea como completa

1. Toggle del botón sol/luna en el sidebar — revisar el componente en ambos modos.
2. ¿Se lee todo el texto en oscuro?
3. ¿Hay rectángulos blancos flotando? (algo se quedó hardcoded).
4. ¿Los bordes son visibles en oscuro? (deben usar `var(--border)`).

## Componentes shadcn (`components/ui/*`)

Ya configurados con tokens semánticos. Úsalos tal cual. Si los customizas con
`className`, mantén las clases semánticas (`bg-muted`, `text-muted-foreground`)
en lugar de utilidades de color crudas (`bg-white`, `text-gray-900`).

## Tipografía

- `font-sans` → Assistant (UI / body)
- `font-serif` → Montserrat (display / headings) — se aplica con
  `style={{ fontFamily: 'var(--font-display)' }}`
- `font-mono` → para RFC, montos, IDs

## Estructura

- `app/` — rutas, layouts, server actions de página
- `components/` — componentes de aplicación
- `components/ui/` — primitivos shadcn (no tocar a menos que sea necesario)
- `features/<dominio>/` — lógica de dominio (auth, taxpayers, …) con
  `actions/`, `schemas/`, `types.ts`
- `lib/` — utilidades cross-cutting (api client, stripe, plans, routes)

## Convenciones

- Server Actions: archivos `*.action.ts` dentro de `features/<x>/actions/`.
- Validación con Zod en `features/<x>/schemas/`.
- API client centralizado en `lib/api/`.
- Rutas declaradas en `lib/routes.ts`.
