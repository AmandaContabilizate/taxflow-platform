# Guía para usar OpenCode desde Warp — Proyecto Contabilízate

Esta guía explica cómo distribuir el trabajo del frontend entre **varios chats de OpenCode en la consola Warp**, eligiendo el plan y modelo correcto según el tamaño de la tarea. El objetivo es **ahorrar tokens, reducir costos y mantener contexto limpio** en cada conversación.

---

## 1. Filosofía general

- **Un chat = una misión.** No mezcles refactors grandes con cambios visuales pequeños en la misma conversación. Cuando el contexto se llena de cosas irrelevantes, la IA se vuelve más lenta y costosa.
- **Elige el plan/modelo según la complejidad.** No uses un modelo fuerte para cambiar el color de un botón, ni uno débil para diseñar una feature completa.
- **Pásale a OpenCode SOLO lo que necesita.** Indícale rutas exactas, archivos y carpetas. Evita decir "revisa todo el proyecto" — eso quema tokens y diluye el foco.

---

## 2. Distribución de chats por plan/modelo

### Chat A — **Plan Go / Gratis — modelo ligero** (tareas rápidas y baratas)

Úsalo para cambios pequeños, cosméticos o repetitivos donde ya sabes exactamente qué tocar.

**Modelos recomendados:**

| Plan | Modelo | Límite (req/5h) | Perfil |
|------|--------|-----------------|--------|
| Go | **DeepSeek V4 Flash** | 31,650 | Rapidísimo, casi ilimitado, ideal para iterar rápido |
| Free | **DeepSeek V4 Flash** | 200 | El mejor regalado, mismo modelo que en Go pero con menor rate limit |

**Buenos casos:**
- Cambiar color, tamaño o padding de un botón.
- Ajustar tipografías o espaciados.
- Renombrar variables o props.
- Añadir/quitar una clase de Tailwind.
- Pequeños textos, copys, traducciones.
- Cambios de íconos (`lucide-react`).
- Tweaks de un solo archivo.

**Cómo pedírselo:**
> "En `components/ui/button.tsx`, cambia el `rounded-md` por `rounded-xl` y aumenta el padding horizontal a `px-6`."

---

### Chat B — **Plan Go / Gratis — modelo medio** (tareas medianas)

Úsalo para features de tamaño medio que tocan 2–6 archivos o requieren un poco de lógica, pero no rediseñan el sistema. Es tu caballo de batalla diario.

**Modelos recomendados:**

| Plan | Modelo | Límite (req/5h) | Perfil |
|------|--------|-----------------|--------|
| Go | **DeepSeek V4 Pro** | 3,450 | Excelente relación velocidad/calidad, buen razonamiento |
| Free | **Qwen3.5 Plus** | 200 | Sólido para lógica intermedia, muy estable |

**Buenos casos:**
- Crear un nuevo componente con estado.
- Agregar un campo a un formulario + validación Zod.
- Conectar un componente a una server action existente.
- Implementar una nueva ruta del App Router.
- Refactor localizado de un componente.
- Debug de un bug puntual.
- Aplicar tokens del tema a una pantalla existente.

**Cómo pedírselo:**
> "Crea el componente `TaxpayerStatusBadge` en `components/taxpayers/taxpayer-status-badge.tsx`. Debe recibir un prop `status: 'active' | 'pending' | 'inactive'` y renderizar un chip con los tokens de `globals.css`. Mira `components/ui/badge.tsx` como referencia."

---

### Chat C — **Plan Go — modelo fuerte (potencia media)**

Úsalo para tareas extensas que requieren razonamiento sobre múltiples archivos, pero donde no necesitas la profundidad máxima. Este chat maneja el grueso del trabajo pesado con buena relación costo/calidad.

**Modelos recomendados:**

| Plan | Modelo | Límite (req/5h) | Perfil |
|------|--------|-----------------|--------|
| Go | **Qwen3.6 Plus** o **MiniMax M2.7** | 3,300 / 3,400 | Muy buen razonamiento multi-archivo, ventana de contexto amplia |
| Free | **DeepSeek V4 Pro** | 200 | Buena capacidad de razonamiento, ideal si no tienes Go aún |

**Buenos casos:**
- Implementar un módulo nuevo completo (varios componentes + actions).
- Refactor de una feature entera (`features/<dominio>/`).
- Migrar pantallas al sistema de tokens del tema.
- Diseñar flujos multi-paso (wizards, onboarding).
- Resolver bugs complejos que cruzan capas (UI ↔ action ↔ schema).
- Refactorizar código legacy a los patrones actuales del proyecto.

**Cómo pedírselo:**
> "Implementa la feature de declaración mensual completa: server actions en `features/declarations/actions/`, schemas en `features/declarations/schemas/`, y la UI en `app/(app)/declarations/`. Usa `features/taxpayers/` como referencia de estructura."

---

### Chat D — **Plan Go — modelo fuerte (potencia alta / máxima)**

Resérvalo para lo más exigente: cambios arquitectónicos, decisiones de diseño de sistemas, o auditorías que requieren mantener mucho contexto simultáneo. Es el más caro — úsalo cuando realmente lo necesites.

**Modelos recomendados:**

| Plan | Modelo | Límite (req/5h) | Perfil |
|------|--------|-----------------|--------|
| Go | **GLM-5.1** o **Kimi K2.6** | 880 / 1,290 | Máxima potencia de razonamiento, contexto enorme, para lo más duro |
| Free | **Kimi K2.6** | 200 | Lo más potente disponible sin pagar, úsalo con cabeza |

**Buenos casos:**
- Diseñar o revisar la arquitectura del proyecto.
- Auditorías de seguridad / performance / accesibilidad globales.
- Migraciones grandes (Next.js mayor, React mayor, Tailwind mayor).
- Definir convenciones nuevas que afectarán todo el repo.
- Code review profundo de PRs grandes.
- Resolver bugs profundos que llevan horas atascados con otros modelos.

**Cómo pedírselo:**
> "Audita todo `features/auth/` y `app/auth/`. Quiero saber: (1) qué server actions exponen datos sensibles sin validar sesión, (2) qué inputs no tienen validación Zod, (3) qué rutas no respetan el middleware. Reporte en formato tabla."

---

## 3. Tabla resumen rápida

| Chat | Tamaño | Archivos | Go (recomendado) | Go límite | Free (recomendado) | Ejemplo |
|------|--------|----------|------------------|-----------|--------------------|---------|
| A | XS / S | 1 | DeepSeek V4 Flash | 31,650/5h | DeepSeek V4 Flash | Color de botón |
| B | M | 2–6 | DeepSeek V4 Pro | 3,450/5h | Qwen3.5 Plus | Componente con lógica |
| C | L | 5–20 | Qwen3.6 Plus / MiniMax M2.7 | 3,300/5h | DeepSeek V4 Pro | Feature completa |
| D | XL | 20+ o crítico | GLM-5.1 / Kimi K2.6 | 880/5h | Kimi K2.6 | Arquitectura, auditoría |

> **Tip de costos:** Los modelos potentes como GLM-5.1 consumen más crédito por request. El Free plan tiene 200 req/5h en total (todos los modelos). El Go plan cuesta $10/mes y da límites mucho más holgados. Si usas mucho el Chat C o D, el Go se paga solo.

---

## 4. Cómo pasar contexto eficientemente (CLAVE para ahorrar tokens)

OpenCode en Warp **no ve tu proyecto entero por defecto**. Cuanto más preciso seas con lo que necesita leer, menos tokens gastas y más rápido responde.

### Siempre incluye en tu prompt:

1. **Archivos exactos a modificar** (rutas absolutas o relativas claras):
   ```
   Modifica:
   - components/dashboard/sidebar.tsx
   - app/(app)/layout.tsx
   ```

2. **Carpeta donde debe crear archivos nuevos** (no dejes que adivine la ubicación):
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
- ❌ "Busca dónde está el sidebar." — dile tú la ruta exacta.
- ❌ "Léete todos los componentes de UI." — pásale solo los 2 que importan.
- ❌ Pegar el contenido entero de un archivo cuando OpenCode puede leerlo con sus herramientas.
- ❌ Subir capturas de pantalla cuando un texto describe igual el problema.
- ❌ "Arregla el error que sale." sin decir qué archivo, qué línea ni el mensaje de error.

### Patrones eficientes

- ✅ "Edita `X` en la línea ~42 para que…"
- ✅ "Mira `archivo-de-referencia.tsx` (mismo patrón) y replícalo en `nuevo.tsx`."
- ✅ "Sólo necesito que toques `features/billing/`. Ignora el resto."
- ✅ Mencionar que `CLAUDE.md` existe en la raíz — OpenCode lo cargará automáticamente.

---

## 5. Flujo recomendado en Warp

1. **Antes de abrir el chat**, define en una nota:
   - ¿Qué quiero lograr en 1 frase?
   - ¿Qué archivos toca?
   - ¿De qué tamaño es? → eso decide el plan/modelo.

2. **Abre el chat del plan/modelo correcto** (A / B / C / D) en Warp.

3. **Primer mensaje**: objetivo + archivos + referencias + restricciones.

4. **Itera corto.** Si la conversación se llena de idas y vueltas largas, ciérrala y abre otra con un resumen limpio. Contextos viejos pesan y encarecen.

5. **Al cerrar**, si quedó algo pendiente, anótalo fuera del chat (issue, TODO, ticket). No confíes en que el próximo chat "recuerde" lo hablado en otro.

---

## 6. Reglas específicas de este proyecto

Ya están en `CLAUDE.md` (raíz del repo). OpenCode las carga automáticamente al iniciar, pero recuérdale **cuando la tarea las cruce directamente**:

- **Theming:** usar tokens (`var(--card)`, `bg-card`, etc.), nunca `#FFF` o `bg-white` para fondos/texto neutros. Probar en claro y oscuro.
- **Componentes shadcn** viven en `components/ui/` — no modificar salvo necesidad justificada.
- **Server actions:** `features/<dominio>/actions/*.action.ts`.
- **Schemas Zod:** `features/<dominio>/schemas/`.
- **Rutas centralizadas** en `lib/routes.ts`.
- **Tipografía:** `font-sans` (Assistant) para UI/body, `font-serif` (Montserrat) para display/headings, `font-mono` para RFC/montos/IDs.

---

## 7. Mini-cheatsheet para el primer mensaje

```
[Objetivo en 1 frase]

Archivos a modificar:
- ruta/al/archivo1.tsx
- ruta/al/archivo2.ts

Archivos nuevos a crear (con su ruta):
- ruta/donde/crearlo.tsx

Referencias (no modificar, sólo leer):
- ruta/de/ejemplo.tsx

Restricciones:
- Usar tokens de tema.
- [otras reglas específicas]

Resultado esperado:
- [bullet de qué debe pasar al terminar]
```

Si llenas esta plantilla, cualquier chat (ligero, medio o fuerte) trabajará con el mínimo de tokens posible y máxima efectividad.

---

## 8. Cómo manejar tareas complejas con dos chats simultáneos

Para tareas **XL** (arquitectura, refactors masivos, nuevas features grandes), abre **dos chats del Plan Go con modelo fuerte**:

### Chat de diseño (potencia alta)

Le pides que **planee** sin tocar código:
> "Quiero rediseñar el flujo de facturación. No escribas código todavía. Analiza `features/billing/` y `app/(app)/billing/`. Propón la arquitectura de componentes nuevos, estructura de carpetas, y un plan de migración paso a paso."

### Chat de ejecución (potencia media-alta)

Con el plan del chat de diseño, le pides que **implemente** paso a paso:
> "Sigue este plan [pegas resumen del chat de diseño]. Empieza por el paso 1: crea el schema Zod en `features/billing/schemas/`. Usa el patrón de `features/invoices/schemas/`."

**Ventaja:** el chat de ejecución no contamina su contexto con discusiones de arquitectura, y el de diseño no se satura con detalles de implementación. Ambos rinden mejor y gastan menos tokens.

---

**TL;DR:** Modelo ligero para cosmético, medio para features medianas, fuerte (potencia media) para módulos grandes, fuerte (potencia alta) para arquitectura/auditoría. Siempre pásale rutas exactas y archivos de referencia — nunca lo mandes a explorar el repo a ciegas. Para tareas XL, separa diseño y ejecución en dos chats paralelos.
