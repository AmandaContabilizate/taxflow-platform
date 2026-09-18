import type { DeclarationInvoice, InvoiceCuadre, InvoiceTotales, PagedConTotales } from "./types";

/**
 * Parseo de la página de facturas que devuelven `/invoices` y `/invoices/retenciones`. Vive aquí
 * y no en cada action porque las dos consumen la misma forma de respuesta: tenerlo duplicado ya
 * significaba que extender los totales obligaba a acordarse de tocar dos archivos.
 */

/** `totales` sólo si el back lo mandó completo; si no, undefined y la pantalla cae a la página. */
function totales(raw: unknown): InvoiceTotales | undefined {
  const t = (raw ?? {}) as Record<string, unknown>;
  const n = (k: string) => (typeof t[k] === "number" ? (t[k] as number) : null);
  const subTotal = n("subTotal");
  const total = n("total");
  if (subTotal == null || total == null) return undefined;
  return {
    subTotal,
    total,
    comprobantes: n("comprobantes") ?? 0,
    egresos: n("egresos") ?? 0,
    egresosSubTotal: n("egresosSubTotal") ?? 0,
    cuadre: cuadre(t.cuadre),
  };
}

/**
 * El cuadre contra Ingresos Brutos. El back lo manda en null cuando el universo puede traer
 * constancias de retención (llegan con tipo Ingreso y el subtotal saldría inflado), así que
 * `undefined` aquí es un caso normal y no un error: la pantalla omite la línea.
 */
function cuadre(raw: unknown): InvoiceCuadre | undefined {
  const c = (raw ?? {}) as Record<string, unknown>;
  if (typeof c.subTotal !== "number") return undefined;
  const excluidos = Array.isArray(c.excluidos) ? c.excluidos : [];
  return {
    subTotal: c.subTotal,
    comprobantes: typeof c.comprobantes === "number" ? c.comprobantes : 0,
    excluidos: excluidos
      .map((e) => (e ?? {}) as Record<string, unknown>)
      .filter((e) => typeof e.motivo === "string")
      .map((e) => ({
        motivo: e.motivo as string,
        comprobantes: typeof e.comprobantes === "number" ? e.comprobantes : 0,
        subTotal: typeof e.subTotal === "number" ? e.subTotal : 0,
      })),
  };
}

/** Acepta `PagedResult`, array pelón o `items: null` sin reventar. */
export function normalizeInvoicePage(
  raw: unknown,
  skip: number,
  take: number,
): PagedConTotales<DeclarationInvoice> {
  if (Array.isArray(raw)) {
    const items = raw as DeclarationInvoice[];
    return { items, total: items.length, skip, take };
  }
  const obj = (raw ?? {}) as Partial<PagedConTotales<DeclarationInvoice>>;
  const items = Array.isArray(obj.items) ? obj.items : [];
  return {
    items,
    total: typeof obj.total === "number" ? obj.total : items.length,
    skip: typeof obj.skip === "number" ? obj.skip : skip,
    take: typeof obj.take === "number" ? obj.take : take,
    totales: totales(obj.totales),
  };
}
