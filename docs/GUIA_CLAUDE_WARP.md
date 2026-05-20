# Guía para usar Claude desde Warp — Proyecto Contabilízate

Esta guía explica cómo distribuir el trabajo del frontend entre **varios chats
de Claude en la consola Warp**, eligiendo el modelo correcto según el tamaño
de la tarea. El objetivo es **ahorrar tokens, reducir costos y mantener
contexto limpio** en cada conversación.

---

## 1. Filosofía general

- **Un chat = una misión.** No mezcles refactors grandes con cambios visuales
  pequeños en la misma conversación. Cuando el contexto se llena de cosas
  irrelevantes, Claude se vuelve más lento y caro.
- **Elige el modelo según la complejidad.** No uses Opus para cambiar el color
  de un botón, ni Haiku para diseñar una arquitectura nueva.
- **Pásale a Claude SOLO lo que necesita.** Indícale rutas exactas, archivos
  y carpetas. Evita decir "revisa todo el proyecto" — eso quema tokens.

---

## 2. Distribución de chats por modelo

### Chat A — **Haiku 4.5** (tareas rápidas)

Úsalo para cambios pequeños, cosméticos o repetitivos donde ya sabes
exactamente qué tocar.

**Buenos casos:**

- Cambiar color, tamaño o padding de un botón.
- Ajustar tipografías o espaciados.
- Renombrar variables o props.
- Añadir/quitar una clase de Tailwind.
- Pequeños textos, copys, traducciones.
- Cambios de íconos (`lucide-react`).
- Tweaks de un solo archivo.

**Cómo pedírselo:**

> "En `components/ui/button.tsx`, cambia el `rounded-md` por `rounded-xl`
> y aumenta el padding horizontal a `px-6`."

---

### Chat B — **Sonnet 4.6** (tareas medianas)

Úsalo para features de tamaño medio que tocan 2–6 archivos o requieren un
poco de lógica, pero no rediseñan el sistema.

**Buenos casos:**

- Crear un nuevo componente con estado.
- Agregar un campo a un formulario + validación Zod.
- Conectar un componente a una server action existente.
- Implementar una nueva ruta del App Router.
- Refactor localizado de un componente.
- Debug de un bug puntual.
- Aplicar tokens del tema a una pantalla existente.

**Cómo pedírselo:**

> "Crea el componente `TaxpayerStatusBadge` en
> `components/taxpayers/taxpayer-status-badge.tsx`. Debe recibir un prop
> `status: 'active' | 'pending' | 'inactive'` y renderizar un chip con los
> tokens de `globals.css`. Mira `components/ui/badge.tsx` como referencia."

---

### Chat C — **Opus 4.7 (potencia media / normal)**

Úsalo para tareas extensas que requieren razonamiento sobre múltiples
archivos, pero donde no necesitas la latencia/profundidad máxima.

**Buenos casos:**

- Implementar un módulo nuevo completo (varios componentes + actions).
- Refactor de una feature entera (`features/<dominio>/`).
- Migrar pantallas al sistema de tokens del tema.
- Diseñar flujos multi-paso (wizards, onboarding).
- Resolver bugs complejos que cruzan capas (UI ↔ action ↔ schema).

**Cómo pedírselo:**

> "Implementa la feature de declaración mensual completa: server actions en
> `features/declarations/actions/`, schemas en `features/declarations/schemas/`,
> y la UI en `app/(app)/declarations/`. Usa `features/taxpayers/` como
> referencia de estructura."

---

### Chat D — **Opus 4.7 (Fast / alta potencia)**

Resérvalo para lo más exigente: cambios arquitectónicos, decisiones de
diseño de sistemas, o auditorías que requieren mantener mucho contexto.
Es el más caro — úsalo cuando realmente lo necesites.

**Buenos casos:**

- Diseñar o revisar la arquitectura del proyecto.
- Auditorías de seguridad / performance / accesibilidad globales.
- Migraciones grandes (Next.js mayor, React mayor, Tailwind mayor).
- Definir convenciones nuevas que afectarán todo el repo.
- Code review profundo de PRs grandes.
- Resolver bugs profundos que llevan horas atascados con Sonnet/Opus normal.

**Cómo pedírselo:**

> "Audita todo `features/auth/` y `app/auth/`. Quiero saber: (1) qué server
> actions exponen datos sensibles sin validar sesión, (2) qué inputs no
> tienen validación Zod, (3) qué rutas no respetan el middleware. Reporte
> en formato tabla."

---

## 3. Tabla resumen rápida

| Chat | Modelo          | Tamaño tarea | Archivos      | Ejemplo                        |
| ---- | --------------- | ------------ | ------------- | ------------------------------ |
| A    | Haiku 4.5       | XS / S       | 1             | Color de botón                 |
| B    | Sonnet 4.6      | M            | 2–6           | Nuevo componente con lógica    |
| C    | Opus 4.7 normal | L            | 5–20          | Feature/módulo completo        |
| D    | Opus 4.7 Fast   | XL           | 20+ o crítico | Arquitectura, auditoría global |

---

## 4. Cómo pasar contexto eficientemente (CLAVE para ahorrar tokens)

Claude en Warp **no ve tu proyecto entero por defecto**. Cuanto más preciso
seas con lo que necesita leer, menos tokens gastas.

### Siempre incluye en tu prompt:

1. **Archivos exactos a modificar** (rutas absolutas o relativas claras):

   ```
   Modifica:
   - components/dashboard/sidebar.tsx
   - app/(app)/layout.tsx
   ```

2. **Carpeta donde debe crear archivos nuevos** (no dejes que Claude elija):

   ```
   Crea el nuevo componente en components/billing/invoice-card.tsx
   Crea la server action en features/billing/actions/get-invoice.action.ts
   ```

3. **Archivos de referencia** (para que copie patrones sin leer todo):

   ```
   Usa components/taxpayers/taxpayer-card.tsx como referencia de estructura.
   Sigue las convenciones de features/taxpayers/schemas/.
   ```

4. **Restricciones del proyecto** (cuando aplique):
   ```
   - Usa tokens de tema (var(--card), var(--foreground)), nunca colores literales.
   - Valida con Zod en features/<x>/schemas/.
   - Server actions van en archivos *.action.ts.
   ```

### Anti-patrones (queman tokens sin necesidad)

- ❌ "Revisa todo el proyecto y dime qué cambiar."
- ❌ "Busca dónde está el sidebar." — dile tú la ruta.
- ❌ "Léete todos los componentes de UI." — pásale solo los 2 que importan.
- ❌ Pegar el contenido entero de un archivo que Claude puede leer él mismo
  con `Read`.
- ❌ Subir capturas de pantalla cuando un texto describe igual el problema.

### Patrones eficientes

- ✅ "Edita `X` en la línea ~42 para que…"
- ✅ "Mira `archivo-de-referencia.tsx` (mismo patrón) y replícalo en `nuevo.tsx`."
- ✅ "Sólo necesito que toques `features/billing/`. Ignora el resto."
- ✅ Decirle el `CLAUDE.md` ya existe en la raíz — él lo cargará solo.

---

## 5. Flujo recomendado en Warp

1. **Abre el chat del modelo correcto** (A / B / C / D).

2. **Primer mensaje**: objetivo + archivos + referencias + restricciones.

3. **Itera corto.** Si la conversación se llena de idas y vueltas largas,
   ciérrala y abre otra con un resumen limpio. Contextos viejos pesan.

4. **Al cerrar**, si quedó algo a futuro, anótalo fuera del chat (issue,
   TODO, ticket). No confíes en que el próximo chat "recuerde".

---

## 6. Reglas específicas de este proyecto

Ya están en `CLAUDE.md` (raíz del repo). Claude las carga automáticamente,
pero recuérdale **cuando la tarea las cruce directamente**:

- Theming: usar tokens (`var(--card)`, `bg-card`, etc.), nunca `#FFF` o
  `bg-white` para neutros. Probar en claro y oscuro.
- Componentes shadcn viven en `components/ui/` — no tocar salvo necesidad.
- Server actions: `features/<dominio>/actions/*.action.ts`.
- Schemas Zod: `features/<dominio>/schemas/`.
- Rutas centralizadas en `lib/routes.ts`.
- Tipografía: `font-sans` (Assistant) UI, `font-serif` (Montserrat) display,
  `font-mono` para RFC/montos/IDs.

---

Si llenas esta plantilla, cualquier chat (Haiku, Sonnet u Opus) trabajará
con el mínimo de tokens posible.

---

**TL;DR:** Haiku para cosmético, Sonnet para features medianas, Opus normal
para módulos grandes, Opus Fast para arquitectura/auditoría. Siempre
pásale rutas exactas y archivos de referencia — nunca lo mandes a explorar
el repo a ciegas.
