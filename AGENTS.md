# Instrucciones para agentes (Claude Code, Codex, Cursor, Copilot y otros)

## Permisos (claims) y "Roles y permisos"

El editor de roles (`components/dashboard/roles/role-editor.tsx`) pinta los permisos con la forma
del sidebar: **Sección → Pantalla → Subdepartamento**. Se amarra por el `id` de cada ítem de
`MASTER_NAV_SECTIONS` (`components/dashboard/constants.ts`), que en el backend es
`AspNetDepartaments.ModuleKey`.

Cuando una pantalla, pestaña, botón o modal nuevo necesite un permiso:

1. **Pregunta al usuario** en qué pantalla del menú va, si el permiso *abre* la pantalla o se usa
   *dentro* de ella, y en qué subdepartamento (propón opciones). No lo decidas solo.
2. Si **abre** la pantalla: agrégalo a `MODULE_CLAIMS['<id>']` en `constants.ts` (sin eso el ítem no
   sale en el menú).
3. El claim se **siembra en el backend** (ContaboxPro.Backend) con una migración, en el
   departamento con `ModuleKey = '<id>'` (o `'<id>/<slug>'` si va dentro). Guía y receta SQL:
   `ContaboxPro.Backend/docs/permisos-y-departamentos.md`. Si la pantalla es nueva, su departamento
   lleva `ModuleKey` = el mismo `id` del ítem y `Name` = la misma etiqueta.
4. No renombres el `id` de un ítem del sidebar sin migrar su `ModuleKey` en el backend: el editor
   perdería la tarjeta.

Si el editor muestra la sección **"Otros"**, hay claims sembrados fuera de toda pantalla: lo ideal
es moverlos con una migración en el backend.
