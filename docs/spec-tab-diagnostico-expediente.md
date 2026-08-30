# Spec — Diagnóstico bajo demanda: botón del cliente + tab del expediente

> Estado: v4 aprobada · Alcance: frontend (taxflow-platform) + 2 reglas de backend
> (Identity) · Fecha: 2026-08-30
>
> v2 amplió la v1 con el **botón manual del cliente** (autorizado tocar pantallas guest).
> v3 agrega el **ajuste de elegibilidad en el backend** (caso "Alexa": contribuyente sin
> declaraciones sembradas) — decidido hacerlo aquí en lugar de diferirlo.
> v4 (§3.1-ter): en el **flujo vendedor** se quita el candado "al corriente" — el
> diagnóstico del backoffice es manual y el gerente decide si vale la pena verificar
> contra el SAT (caso GONG: migrado que "no debe nada" según el legado). Cliente y cron
> conservan su regla intacta.
> La unificación del estatus del score en las 3 pantallas del cliente ya se entregó.

## 1. Objetivo

Dar un disparador **manual** del diagnóstico fiscal en los dos mundos:

1. **Cliente (guest)** — botón en su pantalla **Diagnóstico** para forzar el refresco de su
   CSF y la reevaluación de sus pendientes (máx. **1 corrida por día**, hora de México).
2. **Backoffice** — tab **"Diagnóstico"** en el expediente del cliente (pantalla Clientes)
   para que comercial/gerencia lo dispare por contribuyente (**cooldown de 6 horas**).

Ambos ven el avance en vivo (conectando → revisando → listo, polling 20s del hook
`useFiscalScore`) y el desenlace real (score/pendientes).

## 2. Contrato del API (ya existe en Identity — no se toca backend)

Base `{BASE_IDENTITY}/api/diagnostico` (sin `{dbOrigin}`).

| Flujo | Check (GET) | Disparo (POST) | Claim | Límite |
|---|---|---|---|---|
| Cliente | `/cliente/puede-ejecutar?rfc=` | `/cliente?rfc=` | `Taxpayer.RunDiagnostico` | 1/día calendario (MX) por RFC |
| Vendedor | `/vendedor/puede-ejecutar/{taxpayerId}` | `/vendedor/{taxpayerId}` | `GerenciaComercial.RunDiagnosticoCliente` | 6 h por contribuyente |

- `puede-ejecutar` → `{ tienePendientes, credencialValida, yaCorriendo, puedeEjecutar, proximaVentanaUtc }`.
  Se llama SIEMPRE antes de pintar el botón; el POST revalida todo.
- POST → `{ triggered }`; 400 con `errorCode` estable: `NO_VALID_CREDENTIAL` |
  `DIAGNOSTICO_THROTTLED` | `DIAGNOSTICO_ALREADY_RUNNING` | `TAXPAYER_NOT_FOUND`.
  Nunca se parsea `title`/`detail`.
- En el flujo cliente, un RFC ajeno responde **404** (nunca 403).

## 3. Piezas

### 3.1 Plomería compartida — ✅ YA HECHA

| Archivo | Contenido |
|---|---|
| `lib/api/apiUrls.ts` | apiType `diagnostico` (sin `/SQLServer`) |
| `lib/api/apiRoutes.ts` | Bloque `DIAGNOSTICO` con las 4 rutas |
| `features/diagnostico/types.ts` | `CanRunDiagnostico`, `RunDiagnosticoResult`, `DiagnosticoError` + `diagnosticoErrorMessage(errorCode)` (mensajes en español) |
| `features/diagnostico/actions/canRunDiagnostico.action.ts` | `canRunDiagnosticoCliente(rfc)` y `canRunDiagnosticoVendedor(taxpayerId)` |
| `features/diagnostico/actions/runDiagnostico.action.ts` | `runDiagnosticoCliente(rfc)` y `runDiagnosticoVendedor(taxpayerId)` |

### 3.1-bis Regla de elegibilidad en backend (Identity) — PENDIENTE · caso "Alexa"

**Problema**: hoy `puedeEjecutar = tienePendientes && credencial && !throttle && !corriendo`.
Un contribuyente **sin ninguna declaración sembrada** (CSF sin producir obligaciones aún)
tiene `tienePendientes = false` → nadie puede dispararle el diagnóstico… que es
exactamente lo que releería su CSF y sembraría sus declaraciones. El candado bloquea el
remedio para el caso que más lo necesita.

**Cambio** (en `Features/Diagnostico` de Identity — el módulo de Juan Carlos, mismo patrón):

- `DiagnosticoEligibilityService`: nuevo check `NeedsDiagnosticoAsync(taxpayerId)` =
  `HasPendingDeclarationsAsync(...)` **O** el contribuyente **no tiene ninguna
  `Declaration`** (count = 0 → necesita siembra/refresco de CSF).
- `CanRunDiagnosticoHandler` y `RunDiagnosticoHandler` usan ese check combinado en lugar
  de solo `HasPendingDeclarations` — se mantiene la garantía de que "puede-ejecutar
  nunca dice sí cuando el disparo diría no".
- El DTO no cambia de forma: `tienePendientes` sigue reportando lo que reporta;
  `puedeEjecutar` es el que se relaja. **Throttles intactos** (1/día cliente, 6h
  vendedor) — sin riesgo de abuso.
- Credencial válida sigue siendo obligatoria.

**Efecto**: el botón de un cliente tipo Alexa se enciende; al dispararlo se refresca su
CSF, se siembran sus declaraciones si su constancia trae obligaciones, y el flujo normal
continúa. Un cliente al corriente CON declaraciones presentadas y sin pendientes sigue
viendo "Estás al corriente" (tiene declaraciones, ninguna pendiente → regla original).

### 3.1-ter Flujo vendedor sin candado "al corriente" (Identity) — v4

**Problema**: la regla `needsDiagnostico` (pendientes u 0 declaraciones) es correcta para
el cron (no gastar robot en quien no debe) y para el cliente (no disparar sin razón),
pero en el backoffice es circular: el gerente corre el diagnóstico precisamente para
*descubrir* adeudos que el sistema no conoce (típico en migrados cuyo legado los trae
"al corriente"), y el candado solo lo deja correr cuando el sistema ya los conoce.

**Cambio**: en `CanRunDiagnosticoHandler` y `RunDiagnosticoHandler`, cuando
`Source == Vendedor` el check `NeedsDiagnosticoAsync` **no aplica** — la decisión de
"vale la pena" pasa del sistema al gerente. Siguen obligatorios: credencial válida,
cooldown de 6 h y no-corriendo. Cliente (`Source == Cliente`) y cron conservan la regla
v3 (§3.1-bis) sin cambios. El DTO no cambia: `tienePendientes` sigue informativo.

**Efecto en UI**: en el tab del expediente la razón "Al corriente — no hay nada que
diagnosticar" deja de ocurrir (queda como fallback); el botón del gerente solo se apaga
por credencial, cooldown o corrida en curso. `triggered: false` ya no ocurre en vendedor.

### 3.2 Botón del cliente (pantalla Diagnóstico, guest) — PENDIENTE

**Dónde**: en el hero de `screens/diagnostico.tsx`, debajo del contenido del estado
(convive con los pasos ya unificados del hook).

**Comportamiento** (al montar la pantalla se llama `canRunDiagnosticoCliente(rfc)`):

| Respuesta del check | UI |
|---|---|
| `puedeEjecutar: true` | Botón **"Actualizar mi diagnóstico"** activo |
| `yaCorriendo: true` | No se pinta botón — el hero ya está en "conectando/revisando" (hook) |
| throttle activo (`proximaVentanaUtc`) | Botón deshabilitado + "Disponible mañana" (la ventana es por día calendario MX; si la fecha es hoy, se muestra la hora local) |
| `credencialValida: false` | Botón deshabilitado + "Actualiza tu CIEC para poder ejecutarlo" |
| `puedeEjecutar: false` con `tienePendientes: false` | Botón deshabilitado + "Estás al corriente — no hay nada que diagnosticar" (con la regla 3.1-bis esto solo aplica a quien SÍ tiene declaraciones y ninguna pendiente) |

**Al disparar** (`runDiagnosticoCliente`):
- `triggered: true` → `refresh()` del hook → el hero pasa a "revisando…" con polling
  hasta `ready` (el cliente VE el proceso, no un spinner mudo) → al terminar, el check
  se re-consulta (quedará en throttle hasta mañana).
- `triggered: false` → aviso "Ya estás al corriente".
- 400 → mensaje por `errorCode` + re-consulta del check.

**Caso 0 declaraciones**: con la regla 3.1-bis, el cliente sin declaraciones sembradas
SÍ puede disparar (su corrida refresca la CSF y siembra) — el hero "Aún no tienes
declaraciones" muestra el botón activo con el texto "Buscar mis obligaciones en el SAT".

### 3.3 Tab "Diagnóstico" del expediente (backoffice) — PENDIENTE

**v3.1 — Adición**: además del botón y los estados, el tab muestra **las declaraciones
pendientes (tipo regularización) que el proceso encuentra** para ese contribuyente —
periodo, régimen y estatus (Por Revisar / No Presentada) — para que el gerente vea el
resultado concreto del diagnóstico (y el potencial de venta de regularizaciones):

- La lista carga al abrir el tab y se muestra con **skeleton "cargando…"** mientras el
  diagnóstico corre; se refresca sola con el polling hasta que el proceso termina.
- Vacía + proceso terminado → "El diagnóstico no encontró declaraciones pendientes".
- Fuente: las declaraciones del contribuyente en estatus 13 (Por Revisar) y 14
  (No Presentada) vía el endpoint de backoffice de declaraciones por contribuyente.

Sin cambios respecto a la v1:

- Visible solo con el claim `GerenciaComercial.RunDiagnosticoCliente` (mismo patrón que
  el tab Credenciales).
- Al entrar al tab → `canRunDiagnosticoVendedor(taxpayerId)` → uno de 7 estados:
  verificando / **listo** (botón activo) / al corriente / sin credencial (liga al tab
  Credenciales) / en curso (pasos del hook) / cooldown ("Disponible a las HH:mm" hora MX)
  / desenlace (score y pendientes al llegar a `ready`).
- El hook necesita el RFC → el expediente ya lo trae (`data.rfc`).
- **Nota**: `useFiscalScore` lee el RFC del store del cliente; para el expediente se le
  agrega un parámetro opcional `rfc?: string` (default: el del store) — cambio aditivo
  que no altera a los consumidores actuales.

**Craft (ambas superficies)**: crossfade entre estados (`opacity + translateY(4px)`,
150ms ease-out), botones `active:scale(0.97)`, spinner en el botón durante el POST (sin
doble disparo), razones siempre visibles en botones deshabilitados, horas en formato
local legible.

## 4. Trabajo previo ya entregado (contexto)

- Hook `useFiscalScore` compartido + sin parpadeo en polling.
- Home / Diagnóstico / Vista Fiscal unificadas: pasos, polling, umbrales de etiqueta
  (75/50/25) y estado honesto "Aún no tienes declaraciones" cuando `total = 0`.

## 5. Requisitos de datos (fuera del código)

- `Taxpayer.RunDiagnostico` en el rol **Guest** (el de los clientes).
- `GerenciaComercial.RunDiagnosticoCliente` en los roles del backoffice que lo usarán.
- Ambos claims deben existir en `AspNetClaims` (con descripción/departamento para verse
  bien en Roles y permisos) + relogin de los usuarios.

## 6. Prueba de aceptación

**Cliente**: con pendientes y CIEC válida ve el botón → dispara → "revisando…" → score
actualizado → botón "Disponible mañana". Sin pendientes → botón deshabilitado con razón.
Segundo disparo el mismo día → throttled con mensaje claro.

**Backoffice**: usuario con claim ve el tab → mismos flujos con cooldown de 6h → dos
disparos seguidos muestran la hora de la próxima ventana. Sin claim → el tab no existe.

**Regresión**: las 3 pantallas del cliente siguen mostrando pasos/score como en la
unificación previa; `tsc` limpio.

## 7. Historial de corridas (v4.1)

El tab del expediente muestra al final la sección **"Historial de corridas"**: las
últimas 20 corridas del diagnóstico del contribuyente (tabla `DiagnosticoRun`), la más
reciente primero, con fecha/hora local, fuente (Automático / Cliente / Backoffice),
quién la disparó (nombre o correo; "—" en automáticas), duración y desenlace
(Completada / En curso / Abortada). Se refresca con el mismo polling del tab.

- Endpoint: `GET /api/diagnostico/vendedor/historial/{taxpayerId}` (Identity,
  `GetDiagnosticoHistorialQuery`), mismo claim `GerenciaComercial.RunDiagnosticoCliente`.
- Frontend: `HISTORIAL_VENDEDOR` en apiRoutes + `getDiagnosticoHistorial.action.ts` +
  tipos `DiagnosticoCorrida`/`DiagnosticoHistorial`.

## 7-bis. Fuera de alcance

- Cualquier otro cambio de backend distinto a §3.1-bis, §3.1-ter y el historial (§7).

## 8. Prueba de aceptación adicional (regla 3.1-bis)

- Cliente sin declaraciones (tipo Alexa) con CIEC válida → `puede-ejecutar` regresa
  `puedeEjecutar: true` → botón activo → disparo → CSF re-leída → regímenes/declaraciones
  sembradas si su constancia trae obligaciones.
- Cliente con declaraciones todas presentadas y sin pendientes → sigue "Estás al corriente".
- Throttle: el mismo cliente sin declaraciones no puede disparar dos veces el mismo día.

## 9. Prueba de aceptación adicional (regla v4 — vendedor sin candado)

- Contribuyente migrado "al corriente" (declaraciones en proceso/futuras, ninguna 13/14),
  CIEC válida → en el tab del expediente `puedeEjecutar: true` → el gerente dispara →
  corrida normal (CSF re-leída, obligaciones reevaluadas) → cooldown de 6 h visible.
- El mismo contribuyente en SU app (flujo cliente) → sigue "Estás al corriente" (la
  regla del cliente no cambió).
- Sin credencial o dentro del cooldown → el botón del gerente sigue apagado con razón.
