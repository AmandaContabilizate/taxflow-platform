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
| `calc-612.ts` | `read612(calc)`: lector tolerante del JSON del 612. Acepta las llaves en español del clasificador (`ActividadesGravadasALaTasaDel16`, `TotalISR`…) y, como respaldo, las del estilo 626 (`subtotalIncome16`, `ISR.retentionToPay`) por si el back traduce. Lo que no venga queda `null` → "—" |
| `calculos-612.tsx` | Pestaña **Cálculos** del 612: tarjeta de IVA (actividades 16/8/0 %/exentas, IVA cobrado, IVA de gastos, proporción, no acreditable, acreditable, retenido, saldos aplicados, remanente, saldo generado, a cargo o a favor) y de ISR (ingresos y gastos del mes y acumulados, depreciación del mes y acumulada, pérdidas, base, límite inferior, excedente, %, cuota fija, causado, retenido del mes y anterior, pagos provisionales, a cargo). Debajo, la tabla de saldos aplicados con su origen y la de depreciación por activo |
| `gastos-612-tab.tsx` | Pestaña **Gastos**: sugerencias (Confirmar, cambio de tipo, Descartar), activos confirmados con sus capas (cambiar tipo, Quitar) y gastos recibidos del periodo con "Marcar como activo fijo" (tipo + descripción) |
| `saldos-favor-iva-tab.tsx` | Pestaña **Saldos a favor**: historial (periodo de origen, folio, tipo, fecha, monto original, remanente, origen, declaraciones donde se aplicó) y formulario de captura y edición |
| `parts-612.tsx` | Piezas comunes (filas, encabezados, tabla, avisos, `periodoLabel`, `REGIMEN_612`) |

### Aviso de Recalcular

Confirmar, descartar, cambiar el tipo o marcar un activo, y capturar o editar un saldo, no cambian
el cálculo. Cada acción avisa al detalle (`onRequiereRecalculo`) y aparece una franja con el botón
**Recalcular**, que usa el mismo `startRecalc` del encabezado (pestaña Recálculo +
`useRecalculation`). La franja desaparece cuando el recálculo termina bien.

### Validaciones de la captura manual

`features/iva-favor-balances/schemas/ivaFavorBalance.schema.ts` (se usa en el formulario y otra vez
en la server action):

- ejercicio de 2014 en adelante; mes 1–12; el periodo de origen no puede ser futuro;
- folio de operación: solo dígitos, de 6 a 20;
- tipo: Normal o Complementaria;
- fecha de presentación: no futura y posterior al fin del mes de origen;
- monto original > 0, remanente ≥ 0 y ≤ monto original, máximo dos decimales.

En un saldo generado por el sistema solo se editan folio, tipo y fecha (el periodo y los montos los
lleva el cálculo).

## Endpoints que consume

Base: microservicio Procedures (`API_BASE_PROCEDURES`). Rutas en `lib/api/apiRoutes.ts`
(`FIXED_ASSETS`, `IVA_FAVOR_BALANCES`) y `apiType` en `lib/api/apiUrls.ts` (`fixed_assets`,
`iva_favor_balances`). Server actions en `features/fixed-assets/actions/` y
`features/iva-favor-balances/actions/`.

| Método | Ruta | Action | Uso |
|---|---|---|---|
| GET | `/api/FixedAssets/types` | `getFixedAssetTypes` | Catálogo de tipos (`code`, `name`, `annualRate`, `deductibleCap`) |
| GET | `/api/FixedAssets?rfc=&declarationId=` | `getFixedAssets` | Activos del contribuyente con `status`, `layers` |
| POST | `/api/FixedAssets` | `createFixedAsset` | `{ rfc, declarationId, invoiceUuid, assetTypeCode, description }` |
| PUT | `/api/FixedAssets/{id}` | `updateFixedAsset` | `{ assetTypeCode?, status?, description? }` |
| GET | `/api/IvaFavorBalances?rfc=` | `getIvaFavorBalances` | Historial con `applications` |
| POST | `/api/IvaFavorBalances` | `createIvaFavorBalance` | Captura manual |
| PUT | `/api/IvaFavorBalances/{id}` | `updateIvaFavorBalance` | Solo los campos que cambiaron |

Ya existentes: `GET declarations/{id}/calculations` (Reports), `GET declarations/{id}/invoices`
(Reports, recibidas) y `POST declaration/recalculate` (Procedures).

Caché (TanStack Query): `['decl', id, 'fixed-assets', rfc]` y `['decl', id, 'iva-favor', rfc]`
están en `DATA_SEGMENTS`, así que el recálculo los refresca junto con los cálculos (el back crea
sugerencias, capas, aplicaciones y el saldo generado). El catálogo de tipos va en
`['catalog', 'fixed-asset-types']`.

### Supuestos sobre el back (confirmar al integrar)

El back se implementa en paralelo; si nombra algo distinto, el ajuste es en `features/*/types.ts`
o en `calc-612.ts`:

- Respuestas en camelCase como en §6: activo `{ id, originUuid, assetTypeCode, assetTypeName?,
  annualRate?, deductibleCap?, description, status, source?, amount?, motivo?, layers: [{ uuid,
  amount, startFiscalYear, startMonth }] }`; saldo `{ id, originFiscalYear, originMonth,
  operationNumber, declarationType, presentedDate, originalAmount, remainingAmount,
  originDeclarationId?, source?, applications: [{ declarationId, fiscalYear?, month?, amount,
  appliedAt? }] }`. Las listas se aceptan como arreglo o envueltas en `{ items }`.
- `status` en español: `Sugerido`, `Confirmado`, `Descartado` (se compara sin casing).
- `TotalesImpuestos.Depreciaciones` se busca en el JSON de ISR, en el de IVA o en la raíz de
  `/calculations`, porque hoy `/calculations` solo devuelve `RawIvaJson` y `RawIsrJson`.
- `SaldosAFavorAplicados`, `SaldoAFavorGenerado` e `IvaNoAcreditable` dentro del JSON de IVA. Si no
  viene `IvaNoAcreditable`, se muestra IVA de gastos − IVA acreditable.
- ISR retenido de meses anteriores: `IsrRetenidoAnterior` o `IsrRetenidoPreviosAcumulados`; si no
  viene, `IsrDeRetenciones − IsrRetenidoDelPeriodo`.

## Pendientes

- Probar contra el back de STG cuando estén los endpoints y la migración aplicada.
- Las 4 declaraciones de prueba del contador (validar la proporción D3 en pantalla).
- El listado de gastos pagina de 100 en 100 sobre las recibidas y filtra I y P en el cliente.
