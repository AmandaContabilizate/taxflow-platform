# Contabilízate — Guía para desarrollo

## Stack
- Next.js 16 (App Router) + React 19
- Tailwind CSS 4 + tokens CSS custom en `app/globals.css`
- `next-themes` para modo claro/oscuro (estrategia `class` en `<html>`)
- Componentes shadcn/ui en `components/ui/*`
- Auth + features en `features/*` (server actions)

## Theming — REGLAS OBLIGATORIAS

El proyecto soporta modo claro y oscuro. Todo componente nuevo debe responder
automáticamente al tema. La fuente única de verdad son los tokens CSS definidos
en `app/globals.css` (bloques `:root` y `.dark`).

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
// ❌ Colores literales en fondos/texto neutros
style={{ background: '#FFF', color: '#15113F' }}
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
púrpura `#1E1952`, etc.), entonces el texto encima sí va literal (`#fff`,
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
