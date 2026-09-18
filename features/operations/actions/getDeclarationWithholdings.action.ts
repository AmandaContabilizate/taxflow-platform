"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { invoiceSortSchema } from "../schemas/declarationInvoices.schema";
import type {
  DeclarationInvoice,
  InvoiceSortBy,
  InvoiceSortDir,
  InvoiceTotales,
  Paged,
  PagedConTotales,
} from "../types";

interface OpsError {
  statusCode: number;
  message: string;
}

const EMPTY: PagedConTotales<DeclarationInvoice> = { items: [], total: 0, skip: 0, take: 0 };
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
  };
}


/** Acepta `PagedResult`, array pelón o `items: null` sin reventar. */
function normalize(
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

/**
 * SOLO las constancias de retención del periodo de una declaración, paginadas
 * sobre su propio universo. Misma forma de respuesta que
 * `getDeclarationInvoices`: los items ya traen `esRetencion`, `totalRetenido` y
 * el bloque `retenciones`.
 *
 * Va por su propio endpoint y no por `getDeclarationInvoices` porque la
 * sub-pestaña de retenciones partía en el cliente UNA página del universo
 * combinado: con más comprobantes que el `take`, las constancias no llegaban a
 * la primera página y la pantalla afirmaba que no había ninguna. En el 625 eso
 * pasa siempre que el periodo rebasa el take — la constancia de un mes se timbra
 * al inicio del siguiente, así que es la fecha más alta del periodo y queda al
 * final del orden ascendente.
 *
 * No acepta `invoiceTypeId`: los CFDI de retención no tienen TipoDeComprobante.
 */
export async function getDeclarationWithholdings(params: {
  declarationId: number;
  /** true = emitidas, false = recibidas, omitir = todas. */
  isIssued?: boolean;
  /** true = clasificados, false = sin clasificar, omitir = todos. */
  clasificada?: boolean;
  skip?: number;
  take?: number;
  sortBy?: InvoiceSortBy;
  sortDir?: InvoiceSortDir;
  /** true = ruta espejo de solo consulta (claim Contador.ConsultaDeclaraciones). */
  consulta?: boolean;
}): Promise<Result<PagedConTotales<DeclarationInvoice>, OpsError>> {
  const { declarationId, isIssued, clasificada, skip = 0, take = 100, sortBy, sortDir, consulta } =
    params;
  if (!declarationId || declarationId <= 0) {
    return err({ statusCode: 400, message: "Declaración inválida." });
  }
  const sortParsed = invoiceSortSchema.safeParse({ sortBy, sortDir });
  if (!sortParsed.success) {
    return err({ statusCode: 400, message: "Orden inválido." });
  }

  try {
    const data = await fetchGet<unknown>(
      API_ROUTES.DECLARATIONS_OPS.INVOICES_RETENCIONES({
        declarationId,
        isIssued,
        clasificada,
        skip,
        take,
        sortBy,
        sortDir,
        consulta,
      }),
      "declarations_reports",
    );
    return ok(data == null ? EMPTY : normalize(data, skip, take));
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getDeclarationWithholdings] Error:", e);
    return err({
      statusCode: 500,
      message: "No pudimos obtener las constancias de retención del periodo.",
    });
  }
}
