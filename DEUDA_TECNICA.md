# Deuda técnica

Registro de cosas que sabemos que hay que arreglar, con contexto para no re-investigar.

---

## Pantallas sin permiso: comportamiento inconsistente (sin mensaje, sin redirect)

**Estado:** pendiente
**Prioridad:** media
**Detectado:** 2026-09-17, por reportes de comportamiento errático en `/dashboard?s=plan`.

### Contexto

No hay gate de autorización a nivel de ruta en el dashboard (`components/dashboard/index.tsx`). `middleware.ts:46-62` solo valida que exista la cookie `auth_token` (autenticación), nunca rol/claims. `MODULE_CLAIMS` (`constants.ts`) solo filtra qué aparece en el sidebar (`roleNavSections`) — `ScreenRouter` nunca lo consulta para decidir qué renderizar. Navegar directo a una URL bypasea el sidebar por completo.

Resultado: caer en una pantalla sin permiso da 3 resultados visuales distintos según el camino:
- Staff en screen no manejado en su rama → catch-all (`index.tsx:436-442`) → `PlaceholderScreen` con `TITLES[screen]`, indistinguible de una feature real no construida.
- Guest en screen staff-only → `switch default` (`index.tsx:490-491`) retorna `null` → pantalla en blanco, header arriba sigue mostrando el título real.
- Screen sí implementado para el rol pero el backend responde 403 → `NoAccessState` (`components/dashboard/ui/error-state.tsx:18-37`), solo si esa screen rutea sus errores por `ErrorState`/`isForbiddenError` (~24 de las screens lo hacen).

Nada distingue "no tienes permiso" de "esto no existe para tu rol" de "esto no está construido todavía" — son la misma señal (cae en catch-all) con 3 pintados distintos.

### Qué hacer (cuando se aborde)

Definido con el usuario 2026-09-17: mientras no se decida el mensaje/UX correcto, dejar lo que se muestra hoy en cada catch-all tal cual (no tocar apariencia) y agregar, en los dos catch-all de `index.tsx` (staff línea ~436-442 y guest default línea ~490-491), un timer de 10s que redirija a home vía el helper `go('home')` (`index.tsx:133`, SPA/pushState, ya usado en todo el dashboard — no full reload).

Implementación mínima: componente propio `AutoRedirectHome` (no lógica inline dentro de `ScreenRouter`, que mezcla ramas staff/guest en una sola función — hooks condicionales ahí romperían Rules of Hooks). Se monta como `<AutoRedirectHome go={go} key={screen} />` junto al contenido actual en ambos catch-alls; `key={screen}` para que el timer reinicie si cambia de pantalla antes de los 10s.

**Riesgo conocido, aceptado por ahora:** como el catch-all no distingue "sin permiso" de "feature real no construida", el timer se dispara igual para ambos casos. `'george'` está a salvo (usa `ProximamenteScreen` aparte, no pasa por el catch-all), pero cualquier placeholder futuro que caiga en el catch-all también quedaría redirigiendo a los 10s sin ser tema de permisos.

**Fuera de alcance de este parche:** el 3er camino (`NoAccessState`, 403 real de backend) no pasa por estos catch-alls — no se toca a menos que se pida aparte.

### Beneficio

Usuario que cae sin permiso en una pantalla ya no se queda varado (blanco o placeholder engañoso) — regresa a home solo. No resuelve la inconsistencia de fondo (3 UIs distintas para el mismo problema) ni agrega un modelo real de permisos a nivel de ruta; eso queda como decisión de producto/UX aparte.
