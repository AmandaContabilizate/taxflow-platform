"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { DeclarationInvoice, Paged } from "../types";

interface OpsError {
  statusCode: number;
  message: string;
}

const EMPTY: Paged<DeclarationInvoice> = { items: [], total: 0, skip: 0, take: 0 };

/** Acepta `PagedResult`, array pelón o `items: null` sin reventar. */
function normalize(
  raw: unknown,
  skip: number,
  take: number,
): Paged<DeclarationInvoice> {
  if (Array.isArray(raw)) {
    const items = raw as DeclarationInvoice[];
    return { items, total: items.length, skip, take };
  }
  const obj = (raw ?? {}) as Partial<Paged<DeclarationInvoice>>;
  const items = Array.isArray(obj.items) ? obj.items : [];
  return {
    items,
    total: typeof obj.total === "number" ? obj.total : items.length,
    skip: typeof obj.skip === "number" ? obj.skip : skip,
    take: typeof obj.take === "number" ? obj.take : take,
  };
}

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
}): Promise<Result<Paged<DeclarationInvoice>, OpsError>> {
  const { declarationId, isIssued, invoiceTypeId, clasificada, skip = 0, take = 100 } = params;
  if (!declarationId || declarationId <= 0) {
    return err({ statusCode: 400, message: "Declaración inválida." });
  }
  if (invoiceTypeId != null && (invoiceTypeId < 1 || invoiceTypeId > 5)) {
    return err({ statusCode: 400, message: "Tipo de comprobante inválido." });
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
      }),
      "declarations_reports",
    );
    return ok(data == null ? EMPTY : normalize(data, skip, take));
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getDeclarationInvoices] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener las facturas del periodo." });
  }
}
