"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { normalizeInvoicePage } from "../invoicePage";
import { invoiceSortSchema } from "../schemas/declarationInvoices.schema";
import type {
  DeclarationInvoice,
  InvoiceSortBy,
  InvoiceSortDir,
  Paged,
  PagedConTotales,
} from "../types";

interface OpsError {
  statusCode: number;
  message: string;
}

const EMPTY: PagedConTotales<DeclarationInvoice> = { items: [], total: 0, skip: 0, take: 0 };

/**
 * Facturas del periodo de una declaración, con su clasificación cuando existe.
 * Solo contadores (policy Contador.ReadDeclaraciones).
 *
 * `isIssued` / `invoiceTypeId` / `clasificada` son opcionales: omitirlos trae
 * todo. El filtrado ocurre en el backend, así que `total` respeta los filtros.
 */
export async function getDeclarationInvoices(params: {
  declarationId: number;
  /** true = emitidas, false = recibidas, omitir = todas. */
  isIssued?: boolean;
  /** 1 Ingreso, 2 Egreso, 3 Traslado, 4 Pago, 5 Nómina. */
  invoiceTypeId?: number;
  /** true = clasificados, false = sin clasificar, omitir = todos. */
  clasificada?: boolean;
  skip?: number;
  take?: number;
  /** Lista blanca server-side (E2); default invoiceDate/asc reproduce el orden anterior. */
  sortBy?: InvoiceSortBy;
  sortDir?: InvoiceSortDir;
  /** true = trae el detalle completo de conceptos por factura. */
  includeConcepts?: boolean;
  /**
   * Omitir = todos; true = solo constancias de retención; false = solo CFDI
   * normales. La pantalla del contador manda `false` porque las constancias
   * tienen su propio endpoint (`getDeclarationWithholdings`) y así el `total` y
   * las páginas de cada sub-pestaña son las de su propio universo.
   */
  esRetencion?: boolean;
  /** true = ruta espejo de solo consulta (claim Contador.ConsultaDeclaraciones). */
  consulta?: boolean;
}): Promise<Result<PagedConTotales<DeclarationInvoice>, OpsError>> {
  const {
    declarationId,
    isIssued,
    invoiceTypeId,
    clasificada,
    skip = 0,
    take = 100,
    sortBy,
    sortDir,
    includeConcepts,
    esRetencion,
    consulta,
  } = params;
  if (!declarationId || declarationId <= 0) {
    return err({ statusCode: 400, message: "Declaración inválida." });
  }
  if (invoiceTypeId != null && (invoiceTypeId < 1 || invoiceTypeId > 5)) {
    return err({ statusCode: 400, message: "Tipo de comprobante inválido." });
  }
  const sortParsed = invoiceSortSchema.safeParse({ sortBy, sortDir });
  if (!sortParsed.success) {
    return err({ statusCode: 400, message: "Orden inválido." });
  }

  try {
    const data = await fetchGet<unknown>(
      API_ROUTES.DECLARATIONS_OPS.INVOICES({
        declarationId,
        isIssued,
        invoiceTypeId,
        clasificada,
        skip,
        take,
        sortBy,
        sortDir,
        includeConcepts,
        esRetencion,
        consulta,
      }),
      "declarations_reports",
    );
    return ok(data == null ? EMPTY : normalizeInvoicePage(data, skip, take));
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getDeclarationInvoices] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener las facturas del periodo." });
  }
}
