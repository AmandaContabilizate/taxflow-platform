# Estatus del diagnóstico fiscal — guía para reutilizarlo en otras pantallas

## Resumen

En el commit `249a7b0` ("Crear nueva forma de presentar diagnostico fiscal") se agregaron tres
campos nuevos a `FiscalScore` (`hasCsfData`, `isReconciling`, `pendingVerificationCount`) y una
lógica de "pasos" (conectando → revisando → listo) que hoy **solo** vive en la pantalla
`Diagnóstico`. Este documento explica de dónde sale el dato, cómo se deriva el estatus, y dónde
están las otras dos pantallas que muestran el score fiscal pero que todavía no usan esta lógica —
para que se pueda mostrar el estatus del diagnóstico en más puntos del dashboard sin duplicar la
lógica una cuarta vez.

## 1. Origen del dato

- Server action: `getFiscalScore(rfc)` —
  [features/declarations/actions/getFiscalScore.action.ts](../features/declarations/actions/getFiscalScore.action.ts)
  ```ts
  export async function getFiscalScore(
    rfc: string,
  ): Promise<Result<FiscalScore, FiscalScoreError>> {
    // fetchGet<FiscalScore>(API_ROUTES.DECLARATION.FISCAL_SCORE(rfc), 'declaration')
  }
  ```
- Ruta: `API_ROUTES.DECLARATION.FISCAL_SCORE(rfc)` →
  [lib/api/apiRoutes.ts:91](../lib/api/apiRoutes.ts) → `` `/fiscal-score?rfc=${rfc}` ``
- `apiType: 'declaration'` → [lib/api/apiUrls.ts:17](../lib/api/apiUrls.ts) →
  `${BASE_PROCEDURES}/declaration/SQLServer` (microservicio **Procedures**).
- Devuelve `Result<FiscalScore, FiscalScoreError>` (`ok`/`err` de `lib/common`) — nunca lanza,
  siempre hay que chequear `res.success` antes de leer `res.value`.

Para llamarlo hace falta el RFC activo, que viene de
[features/taxpayers/stores/rfcStore.tsx](../features/taxpayers/stores/rfcStore.tsx):

```ts
const { selectedRfc } = useRfcStore()
// o, si solo necesitas saber si hay un RFC conectado:
const { hasRfc, loading } = useHasRfc()
```

## 2. Forma del dato

[features/declarations/types.ts:8-25](../features/declarations/types.ts):

```ts
export interface FiscalScore {
  rfc: string
  total: number // total de declaraciones del RFC
  presented: number // declaraciones que cuentan como presentadas
  pending: number // total - presented
  score: number // 0-100 (2 decimales)
  breakdown: FiscalScoreStatusBreakdown[]
  hasCsfData: boolean // true si ya se leyó la Constancia de Situación Fiscal al menos una vez
  isReconciling: boolean // true si el scraper de declaraciones sigue corriendo para este RFC
  pendingVerificationCount: number // cuántas siguen "Por Revisar" (sembradas, sin confirmar aún)
}

export interface FiscalScoreError {
  statusCode: number
  message: string
  code?: string // TAXPAYER_NOT_FOUND | INVALID_REQUEST | EMAIL_REQUIRED
}
```

Los tres campos nuevos (`hasCsfData`, `isReconciling`, `pendingVerificationCount`) son los que
permiten distinguir "todavía estamos conectando con el SAT" de "el score ya es confiable".
`score`, `total`, `presented`, `pending` ya existían antes del commit de ayer.

## 3. Cómo se deriva el "estatus" (no viene del backend como enum)

El backend **no** manda un campo `status`. El estatus se calcula en el cliente a partir de los
campos de arriba. La implementación de referencia (la más nueva y completa) está en
[components/dashboard/screens/diagnostico.tsx:27-47](../components/dashboard/screens/diagnostico.tsx):

```ts
/** true mientras el score todavía no es confiable: sin CSF leída, o con
 *  declaraciones "Por Revisar" sin confirmar. */
function isStillChecking(score: FiscalScore | null): boolean {
  if (!score) return false
  return !score.hasCsfData || score.isReconciling || score.pendingVerificationCount > 0
}

type DiagnosticoStep = 'loading' | 'connecting' | 'checking' | 'ready'

function diagnosticoStep(score: FiscalScore | null, loading: boolean): DiagnosticoStep {
  if (loading || !score) return 'loading'
  if (!score.hasCsfData) return 'connecting'
  if (score.isReconciling || score.pendingVerificationCount > 0) return 'checking'
  return 'ready'
}

/** Etiqueta de calidad del score, solo aplica una vez que step === 'ready'. */
function fiscalStatus(score: number): FiscalStatus {
  if (score >= 75) return { word: 'excelente', pill: 'brand', pillText: 'Todo en orden', positive: true }
  if (score >= 50) return { word: 'buena', pill: 'brand', pillText: 'Vas bien', positive: true }
  if (score >= 25) return { word: 'regular', pill: 'amber', pillText: 'Requiere atención', positive: false }
  return { word: 'crítica', pill: 'coral', pillText: 'Requiere atención', positive: false }
}
```

Es decir, hay **dos capas** de estatus:

1. `DiagnosticoStep` (`connecting`/`checking`/`ready`) — si el dato ya es confiable para mostrarse.
2. `fiscalStatus(score)` — una vez `ready`, qué tan bueno es el score (excelente/buena/regular/crítica).

Mientras `isStillChecking(score)` sea `true`, la pantalla vuelve a pedir `getFiscalScore` cada 20s
hasta que se resuelva ([diagnostico.tsx:69-104](../components/dashboard/screens/diagnostico.tsx)):

```ts
if (isStillChecking(initialScore)) {
  intervalId = setInterval(() => void pollScore(), 20000)
}
```

Sin este polling, una pantalla que solo hace `fetch` una vez se queda pegada mostrando "0 de 0
declaraciones" mientras el scraper del SAT sigue corriendo en el backend.

## 4. Piezas de UI reutilizables

- `Pill` — [components/dashboard/ui/pill.tsx](../components/dashboard/ui/pill.tsx), kinds:
  `default | brand | coral | amber | ink`. Es lo que usa `diagnostico.tsx` para los pasos.
- `Badge` — [components/dashboard/ui/badge.tsx](../components/dashboard/ui/badge.tsx), kinds:
  `default | brand | amber | coral`.
- `StatusDot` — [components/dashboard/ui/status-dot.tsx](../components/dashboard/ui/status-dot.tsx),
  punto de color simple (`{ ok: boolean }`).

**No existe todavía** un componente dedicado tipo "badge de estatus de diagnóstico" — cada
pantalla arma el suyo inline combinando estas piezas con sus propios colores/tonos.

## 5. Estado actual de las pantallas que muestran el score fiscal

| Pantalla | Archivo | Usa los 3 campos nuevos | State machine |
|---|---|---|---|
| Diagnóstico | [screens/diagnostico.tsx](../components/dashboard/screens/diagnostico.tsx) | ✅ sí | `loading / connecting / checking / ready` + polling 20s |
| Home (hero card) | [fiscal-score.tsx](../components/dashboard/fiscal-score.tsx), usado en [screens/home.tsx](../components/dashboard/screens/home.tsx) | ❌ no | `idle / loading / ready / empty / processing / error`, sin polling |
| Vista Fiscal | [screens/vista-fiscal.tsx](../components/dashboard/screens/vista-fiscal.tsx) | ❌ no | solo `loadingData: boolean`, sin distinguir "conectando"/"revisando" |

Puntos a tener en cuenta:

- **Home** (`fiscal-score.tsx`) decide "vacío" vs "procesando" comparando `total === 0` contra si
  ya existe el documento CSF (`getTaxCertificateMetadata`), en vez de usar `hasCsfData`/
  `isReconciling` directamente. No hace polling, así que si el usuario entra mientras el scraper
  sigue corriendo, el hero card se queda mostrando un estado desactualizado.
- **Vista Fiscal** no distingue nada — si `getFiscalScore` responde rápido pero con `isReconciling:
  true`, igual pinta el score tal cual como si fuera definitivo.
- Los tres tienen **umbrales de etiqueta distintos** para el mismo score (excelente/muy
  bueno/bueno/regular no caen en los mismos cortes de 25/50/75/90 entre pantallas), así que un
  mismo score puede leerse "Excelente" en una pantalla y "Muy bueno" en otra.

## 6. Recomendación para pantallas nuevas

Antes de copiar `isStillChecking`/`diagnosticoStep` una cuarta vez, conviene extraer esa lógica
(idealmente junto con el fetch + polling de 20s) a un hook compartido, por ejemplo
`features/declarations/hooks/useFiscalScore.ts`, que devuelva algo como:

```ts
{ score: FiscalScore | null, step: DiagnosticoStep, loading: boolean }
```

y sea consumido por `diagnostico.tsx`, `fiscal-score.tsx` y `vista-fiscal.tsx` (reemplazando su
lógica local) además de cualquier pantalla nueva que necesite mostrar el estatus. Esto evita que
seguir agregando puntos donde se muestra el diagnóstico multiplique estados divergentes. Esta
extracción **no está hecha todavía** — queda como siguiente paso a decidir/implementar.
