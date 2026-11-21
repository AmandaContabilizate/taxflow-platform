# 612 — Cálculo de impuestos en el front del contador

Rama `612-calculate`. Especificación general: `Requerimientos/612-calculate.md` (§6 contrato
clasificador ↔ back, §7 cambios por aplicativo). Este documento cubre solo `taxflow-platform`.

## Qué se habilitó

| Sitio | Antes | Ahora |
|---|---|---|
| `components/dashboard/operaciones/declaration-detail.tsx` · `REGIMES_CON_PANTALLAS` | Solo 625 y 626 veían Cálculos, Clasificación y Reporte Cliente; los demás, el aviso "Estamos trabajando…" | Se agregó el **612**. Los demás regímenes (605, 606, 601…) siguen con el aviso |
| `declaration-detail.tsx` · pestañas | — | Pestañas **Gastos** y **Saldos a favor**, solo en 612 y fuera del modo consulta |
| `calculos-tab.tsx` | Todo lo que no era 626 caía en la vista del 625 | El 612 tiene su propia vista (`Calculos612`) |
| `resumen-declaracion.tsx` · `readResumen` | Todo lo que no era 626 se leía con el parser del 625 | `readResumen612`, con el mismo lector que Cálculos |

Se dejaron **a propósito**:

- `comprobantes-tab.tsx` · `REGIMEN_PLATAFORMAS = '625'`: el aviso de "no llegaron constancias de
  retención" es exclusivo del 625 (sus ingresos salen de ellas). En el 612 las constancias solo
  restan retenciones.
- `expediente-cliente.tsx` · `formatRegimeBadge`: ya etiquetaba el 612.
- El botón **Recalcular** y la pestaña **Recálculo** nunca filtraron por régimen.
- `features/declaration-report/lib/reportDetail.ts` (reporte del cliente) es genérico: pinta
  cualquier llave numérica; no tenía bloqueo.

## Pantallas y componentes

Todos en `components/dashboard/operaciones/`.

| Archivo | Qué es |
|---|---|
| `calc-612.ts` | `read612(calc)`: lector del JSON del 612 con las llaves exactas del clasificador (§ "Cálculo: llaves que se leen"). Lo que no venga queda `null` → "—" |
| `calculos-612.tsx` | Pestaña **Cálculos** del 612: avisos del clasificador (`Warnings`); tarjeta de IVA (actividades 16/8/0 %/exentas, IVA cobrado, IVA de gastos, proporción, no acreditable, acreditable, retenido, saldos aplicados, remanente, saldo generado, a cargo o a favor) y de ISR (ingresos y gastos del mes y acumulados, depreciación del mes y acumulada, pérdidas, base, límite inferior, excedente, %, cuota fija, causado, retenido del mes y anterior, pagos provisionales, a cargo). Debajo, la tabla de saldos aplicados con su origen y la de depreciación por activo |
| `gastos-612-tab.tsx` | Pestaña **Gastos**: sugerencias de esta declaración (con botón para ver las de otros meses), activos confirmados con sus capas (cambiar tipo, Quitar, **Dar de baja**: venta o pérdida con fecha, precio, comprador, UUID de la venta y notas), botón **Agregar activo que ya se deprecia (sin factura)** y **Corregir** en los capturados, IVA acreditado contra el tope, activos dados de baja (con desde cuándo dejaron de depreciarse y **Revertir**) y gastos recibidos del periodo con "Marcar como activo fijo" (solo facturas I) |
| `activo-capturado-form.tsx` | Formulario del activo capturado sin factura (R7), para alta y corrección, con el deducible estimado y en cuántos meses se agota (`estimarCapturado`) |
| `saldos-favor-iva-tab.tsx` | Pestaña **Saldos a favor**: historial (periodo de origen, folio, tipo, fecha, monto original, remanente, origen, acreditado fuera del sistema y declaraciones donde se aplicó) y formulario de captura y edición |
| `parts-612.tsx` | Piezas comunes (filas, encabezados, tabla, avisos, `periodoLabel`, `REGIMEN_612`) |
| `recalculo-tab.tsx` | Tras recalcular un 612 muestra `warnings`, cuántas `fixedAssetSuggestions` / `newFixedAssetLayers` dejó la corrida y, si viene, el total de `fixedAssetIvaCredits` (acreditado y excedente por tope) |

### Aviso de Recalcular

Confirmar, descartar, cambiar el tipo o marcar un activo, y capturar o editar un saldo, no cambian
el cálculo. Cada acción avisa al detalle (`onRequiereRecalculo`) y aparece una franja con el botón
**Recalcular**, que usa el mismo `startRecalc` del encabezado (pestaña Recálculo +
`useRecalculation`). La franja desaparece cuando el recálculo termina bien.

### Validaciones de la captura manual

`features/iva-favor-balances/schemas/ivaFavorBalance.schema.ts` (se usa en el formulario y otra vez
en la server action). El front es más estricto que el back en folio, tipo, fecha y ejercicio; el
resto replica `IvaFavorBalanceRules.Validate`:

- ejercicio de 2014 en adelante (back: 2000); mes 1–12; el periodo de origen no puede ser futuro;
- folio de operación: solo dígitos, de 6 a 20 (back: opcional, hasta 50);
- tipo: Normal o Complementaria (back: opcional);
- fecha de presentación: no futura y posterior al fin del mes de origen (back: opcional);
- monto original > 0, remanente ≥ 0, máximo dos decimales;
- remanente ≤ monto original − lo ya acreditado en el sistema (Σ `applications.appliedAmount`; en
  la edición, en el formulario).

En la edición solo viaja lo que cambió. Un saldo generado por una declaración del sistema
(`originDeclarationId` ≠ null) **no se edita**: periodo, folio, tipo y fecha salen de esa
declaración (el botón Editar queda deshabilitado; el back respondería `INVALID_INPUT`). En uno con
origen externo que no es `Manual` solo se editan folio, tipo y fecha (el back rechaza periodo y
montos con `INVALID_INPUT`). En uno `Manual`, si cambia el monto
original también viaja `remainingAmount`: sin él, el back conserva lo acreditado fuera del sistema y
mueve el remanente.

### Cambios del 21-oct (§11 de `Requerimientos/612-calculate.md`)

Todos los campos nuevos son **opcionales**: con un back o un clasificador viejos no se pinta lo
que falte y nada truena.

- **R7, activo capturado sin factura.** En Gastos, botón *Agregar activo que ya se deprecia (sin
  factura)*: tipo (catálogo `GET /types`), descripción, **monto mensual de depreciación** y **mes
  y año en que empezó**. Validación en `capturedFixedAssetSchema` (formulario y server action):
  monto > 0 con dos decimales, mes 1–12, año ≥ 2000 y el mes de inicio no puede ser futuro.
  Estimación en pantalla: deducible = mensual × 12 ÷ tasa del tipo; se agota en ⌈12 ÷ tasa⌉
  meses desde el inicio (último mes y cuántos le quedan a la fecha). Si el deducible pasa el tope
  del tipo, avisa. En la lista llevan la etiqueta **Capturado** (en lugar del UUID) y su monto
  mensual con el inicio en lugar de capas; **Corregir** abre el mismo formulario y manda `PUT`.
- **Detalle del activo.** Bajo la tasa: *IVA acreditado X de un tope de Y* (`ivaCredited`,
  `ivaCreditCap`; 28,000 auto y 40,000 eléctrico) y *tope alcanzado* cuando ya se llenó. En los
  dados de baja: *Dejó de depreciarse desde \<mes de la baja\>; la última depreciación fue en
  \<mes anterior\>* (R8).
- **Cálculos.** La tabla de depreciación agrega *Meses en el ejercicio*
  (`MesesDepreciadosEjercicio`) y las etiquetas *Capturado* y *Vendido/Perdido* (`Capturado`,
  `DisposalKind`; si `Capturado` no viene se toma del activo). Nueva tabla **IVA de activos
  fijos** con `FixedAssetIvaCredits` (activo, CFDI, IVA acreditado, excedente por tope, total).
  Los `Warnings` se siguen pintando tal cual, incluido el de factura papá no encontrada. El hint
  de *IVA no acreditable* aclara que el de activos se pierde (R4).

## Endpoints que consume

Base: microservicio Procedures (`API_BASE_PROCEDURES`, ya termina en `/api`). Rutas en
`lib/api/apiRoutes.ts` (`FIXED_ASSETS`, `IVA_FAVOR_BALANCES`) y `apiType` en `lib/api/apiUrls.ts`
(`fixed_assets` = `/FixedAssets`, `iva_favor_balances` = `/IvaFavorBalances`, sin `/SQLServer`).
Server actions en `features/fixed-assets/actions/` y `features/iva-favor-balances/actions/`.
Contrato del back: `contaboxpro-backend-core/docs/612-calculate.md` §3 y `Features/FixedAssets/*`,
`Features/IvaFavorBalances/IvaFavorBalanceFeature.cs`.

JSON de System.Text.Json por omisión: camelCase, montos y tasas como número (`annualRate` 0.25),
`status`/`source` como string, `DateOnly` como `"yyyy-MM-dd"`, `DateTimeOffset` ISO. Las listas
son arreglos. UUID en mayúsculas.

| Método | Ruta | Cuerpo / query | Respuesta (200) |
|---|---|---|---|
| GET | `/api/FixedAssets/types` | — | `[{ id, code, name, annualRate, deductibleCap }]` (solo activos) |
| GET | `/api/FixedAssets?rfc=&declarationId=` | `declarationId` **no filtra**: solo valida que sea del RFC | `FixedAsset[]`, todos los estados |
| POST | `/api/FixedAssets` | `{ rfc, declarationId?, invoiceUuid, assetTypeCode, description? }` | `FixedAsset`, `Confirmado`, `source = "Contador"` |
| PUT | `/api/FixedAssets/{id}` | `{ assetTypeCode?, status?, description? }`; `status` ∈ `Confirmado`/`Descartado` (o el código `Confirmed`/`Discarded`) | `FixedAsset` |
| POST | `/api/FixedAssets/{id}/disposal` | `{ kind: 'Sold'\|'Lost', disposalDate, salePrice?, buyerRfc?, buyerName?, saleInvoiceUuid?, notes? }`; datos de venta solo con `Sold` | `FixedAsset` con `disposal`, `Vendido`/`Perdido` |
| DELETE | `/api/FixedAssets/{id}/disposal` | — | `FixedAsset` de vuelta en `Confirmado` |
| POST | `/api/FixedAssets/captured` | `{ rfc, assetTypeCode, description?, monthlyAmount, startFiscalYear, startMonth }` | `FixedAsset` con `isCaptured = true`, `capture` y `originUuid = null` (supuesto) |
| PUT | `/api/FixedAssets/captured/{id}` | mismos campos que el POST (incluye `rfc`) | `FixedAsset` (**ruta supuesta**: el §11 solo dice "con PUT"; si el back usa otra, se cambia en `API_ROUTES.FIXED_ASSETS.CAPTURED_UPDATE`) |
| GET | `/api/IvaFavorBalances?rfc=` | — | `IvaFavorBalance[]` por periodo de origen |
| POST | `/api/IvaFavorBalances` | `{ rfc, originFiscalYear, originMonth, operationNumber?, declarationType?, presentedDate?, originalAmount, remainingAmount? }` | `IvaFavorBalance`, `source = "Manual"` |
| PUT | `/api/IvaFavorBalances/{id}` | mismos campos, todos opcionales | `IvaFavorBalance` |

- `FixedAsset` = `{ id, originUuid, description, assetTypeCode, assetTypeName, annualRate,
  deductibleCap, status, statusCode, source, sourceCode, suggestedInDeclarationId, confirmedAt,
  amount, motivo, disposal, layers: [{ id, uuid, amount, acquisitionDate, startFiscalYear, startMonth }] }`.
  `amount` y `motivo` son las columnas `SuggestedAmount` y `SuggestionReason` (null en altas del
  contador). `disposal` = `{ disposalDate, salePrice, buyerRfc, buyerName, saleInvoiceUuid,
  saleInvoiceId, notes }` o `null`. Opcionales del 21-oct: `ivaCreditCap` (null = sin tope),
  `ivaCredited`, `isCaptured` y `capture` = `{ monthlyAmount, startFiscalYear, startMonth }`
  (null en activos con factura). Un capturado se reconoce por `isCaptured === true` o por traer
  `capture` (`fixedAssetIsCaptured`). `GET /types` puede traer también `ivaCreditCap`.
- Estatus y fuente son catálogos del back (`Declarations.FixedAssetStatus` / `FixedAssetSource`):
  `status` trae el nombre (`Sugerido` | `Confirmado` | `Descartado` | `Vendido` | `Perdido`) y
  `statusCode` el código (`Suggested` | `Confirmed` | `Discarded` | `Sold` | `Lost`); `source` ∈
  `IA` | `Regla` | `Contador`, `sourceCode` ∈ `AI` | `Rule` | `Accountant`.
- `IvaFavorBalance` = `{ id, originDeclarationId, originFiscalYear, originMonth, operationNumber,
  complementNumber, declarationType, presentedDate, originalAmount, appliedOutsideAmount,
  remainingAmount, source, sourceCode, applications: [{ declarationId, fiscalYear, month, appliedAmount }] }`;
  `source` ∈ `Clasificador` | `Manual` | `Robot` (`sourceCode` ∈ `Classifier` | `Manual` | `Robot`).
  `declarationType` se deriva de `complementNumber` (0 = Normal). Periodo, folio, tipo y fecha los
  arma el back desde la declaración de origen o desde el origen externo de la captura manual.
  Remanente = original − `appliedOutsideAmount` − Σ `appliedAmount`.

Cómo los usa la pantalla:

- **Sugerencias de esta declaración**: `status === 'Sugerido' && suggestedInDeclarationId ===
  declarationId`; las de otros meses se ven con un botón.
- **Marcar como activo fijo**: solo facturas I recibidas (un P responde
  `FIXED_ASSET_INVOICE_NOT_EXPENSE`; un P que ya es capa se marca "Capa de activo fijo"). Un UUID
  tiene un solo activo en cualquier estado: si está `Descartado`, "Volver a marcar" hace PUT
  `{ status: 'Confirmado', assetTypeCode?, description? }` (el POST respondería
  `FIXED_ASSET_ALREADY_EXISTS`).
- Descripción: hasta 500 caracteres (el back recorta ahí); vacía no viaja.

### Errores

Siempre **400** con `ProblemDetails` y `extensions.errorCode` (no hay 404): `FIXED_ASSET_NOT_FOUND`,
`FIXED_ASSET_TYPE_NOT_FOUND`, `FIXED_ASSET_INVOICE_NOT_EXPENSE`, `FIXED_ASSET_ALREADY_EXISTS`,
`FIXED_ASSET_DISPOSAL_INVALID`, `IVA_FAVOR_BALANCE_NOT_FOUND`, `TAXPAYER_NOT_FOUND`, `DECLARATION_NOT_FOUND`, `INVALID_INPUT`. El
`detail` trae el motivo concreto en español; las actions del 612 lo prefieren sobre el texto del
catálogo (`lib/api/problemDetail.ts`, `toCalc612Error`), porque para `INVALID_INPUT` el catálogo
dice "Entrada inválida…" y esconde qué corregir. Un JSON mal formado (p. ej. una fecha inválida)
llega como `ValidationProblemDetails` sin `errorCode`; ahí se usa el mensaje de `fetchClient`. Los
códigos nuevos están en `lib/api/errorCatalog.json`.

### Ya existentes

- `GET declarations/{id}/calculations` (Reports): `{ declarationId, iva, isr, taxRegimeId,
  regimeSatCode, regimeName }`; sin `DeclarationSummary` → `DECLARATION_NOT_FOUND`.
- `GET declarations/{id}/invoices` (Reports, recibidas).
- `POST declaration/recalculate` (Procedures): además de lo de siempre, en el 612 trae
  `totalesImpuestos` (crudo, PascalCase), `fixedAssetSuggestions: [{ uuid, assetTypeCode, amount,
  motivo, fuente }]`, `newFixedAssetLayers: [{ fixedAssetId, uuid, amount, startFiscalYear,
  startMonth }]` y `warnings: string[]` (`RecalculationResult` en `features/declarations/types.ts`).

Caché (TanStack Query): `['decl', id, 'fixed-assets', rfc]` y `['decl', id, 'iva-favor', rfc]`
están en `DATA_SEGMENTS`, así que el recálculo los refresca junto con los cálculos (el back crea
sugerencias, capas, aplicaciones y el saldo generado). El catálogo de tipos va en
`['catalog', 'fixed-asset-types']`.

## Cálculo: llaves que se leen

`/calculations.iva` = `TotalIvaJson` del clasificador completo; `/calculations.isr` =
`TotalIsrJSon` completo + `Depreciaciones` + `Warnings`. En los dos el back agrega las llaves de
compatibilidad del 626 solo donde el 612 no trae la suya. Contrato:
`clasificador-python/docs/calculo_612.md`. Algunos montos vienen como string (`TotalIva`,
`IngresosAcumulados`, `DeduccionesAcumuladas`, `BaseGravable`, `ImpuestosAntesDeRetenciones`).

| Pantalla | Llave |
|---|---|
| Actividades 16 / 8 / 0 % / exentas | `ActividadesGravadasALaTasaDel16`, `…Del8`, `…Del0`, `ActividadesExentas` |
| IVA cobrado | `TotalIvaCobradoDelPeriodo` |
| IVA de los gastos | `IvaAcreditableAntesDeProporcion` |
| Proporción (D3) | `ProporcionIva` (fracción) |
| IVA no acreditable | `IvaNoAcreditable` |
| IVA acreditable / retenido | `IVAAcreditableDelPeriodo`, `IvaRetenido` |
| Saldos aplicados (total) | `SaldoAFavorAplicado` |
| Saldos aplicados (tabla) | `SaldosAFavorAplicados[]` = `{ Id, Aplicado, RemanenteDespues, OriginFiscalYear, OriginMonth, OperationNumber, DeclarationType, PresentedDate, OriginalAmount }`; el historial solo completa lo que falte |
| Remanente de saldos | `SaldoAFavorPendiente` |
| Saldo generado | `SaldoAFavorGenerado` |
| IVA a cargo / a favor | `TotalIva` (absoluto) + `IsAFavor`. `totalIVA` de la compatibilidad normaliza igual y trae signo: se usa el absoluto |
| Ingresos del mes / acumulados | `IngresosDelPeriodo`, `IngresosAcumulados` |
| Gastos del mes / acumulados | `ComprasYGastosDelPeriodo`, `DeduccionesAcumuladas` (sin activos y con el IVA no acreditable) |
| Depreciación del mes | `isr.Depreciaciones.DelMes` |
| Depreciación acumulada | `DepreciacionAcumulada` (= `Depreciaciones.AcumuladaEjercicio` + `AcumuladaCapturada`) |
| Depreciación por activo | `isr.Depreciaciones.Detalle[]` = `{ FixedAssetId, AssetTypeCode, MontoDeducible, Tasa, DelMes, AcumuladaEjercicio, AcumuladaTotal, Pendiente, Capas, Capturado?, DisposalKind?, MesesDepreciadosEjercicio? }` |
| IVA de activos fijos | `FixedAssetIvaCredits[]` = `{ FixedAssetId, Uuid, IvaAcreditado, IvaExcedenteTope }`; se busca en `iva`, luego en `isr` y luego en `isr.Depreciaciones` (**supuesto**: el §11.3 no dice en qué bloque lo injerta el back). Sin la llave, la tabla no aparece |
| Pérdidas, base, límite, excedente, cuota | `PerdidasFiscales`, `BaseGravable`, `LimiteInferior`, `Excedente`, `CuotaFija` |
| % sobre el excedente | `Porcentaje` (fracción). `ISR.porcentage` de la compatibilidad sale en 0 en el 612 |
| ISR causado | `ImpuestosAntesDeRetenciones` |
| ISR retenido del mes / total | `IsrRetenidoDelPeriodo`, `IsrDeRetenciones` (acumulado); de meses anteriores = total − del mes |
| Pagos provisionales | `PagosProvisionalesAnteriores` |
| ISR a cargo | `TotalISR` |
| Avisos | `isr.Warnings` |

## Pendientes

- Confirmar con el back la ruta del `PUT` del capturado y en qué bloque de `/calculations` viaja
  `FixedAssetIvaCredits`.
- Probar contra el back de STG cuando estén los endpoints y la migración aplicada.
- Las 4 declaraciones de prueba del contador (validar la proporción D3 en pantalla).
- El listado de gastos pagina de 100 en 100 sobre las recibidas y filtra I y P en el cliente.
