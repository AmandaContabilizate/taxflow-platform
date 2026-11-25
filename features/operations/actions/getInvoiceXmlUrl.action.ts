"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { InvoiceXmlUrl } from "../types";

interface InvoiceXmlUrlError {
  statusCode: number;
  message: string;
  /** INVOICE_XML_NOT_FOUND | DECLARATION_NOT_FOUND | INVALID_REQUEST | UNEXPECTED_ERROR. */
  code?: string;
}

/**
 * URL temporal (SAS de solo lectura, ~10 min) al XML de un comprobante de la
 * declaración. Misma policy que la lista de comprobantes
 * (Contador.ReadDeclaraciones, o Contador.ConsultaDeclaraciones con `consulta`).
 */
export async function getInvoiceXmlUrl(params: {
  declarationId: number;
  invoiceId: number;
  consulta?: boolean;
}): Promise<Result<InvoiceXmlUrl, InvoiceXmlUrlError>> {
  const { declarationId, invoiceId, consulta } = params;
  if (!declarationId || declarationId <= 0 || !invoiceId || invoiceId <= 0) {
    return err({ statusCode: 400, message: "Comprobante inválido.", code: "INVALID_REQUEST" });
  }

  try {
    const data = await fetchGet<InvoiceXmlUrl>(
      API_ROUTES.DECLARATIONS_OPS.INVOICE_XML_URL({ declarationId, invoiceId, consulta }),
      "declarations_reports",
    );
    if (!data?.url) {
      return err({ statusCode: 500, message: "No pudimos obtener el XML del comprobante." });
    }
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode });
    }
    console.error("[getInvoiceXmlUrl] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener el XML del comprobante." });
  }
}
