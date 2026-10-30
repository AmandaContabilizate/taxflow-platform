"use server";

import { ApiError, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";

interface PurchaseTicketsRequest {
  ticketCount: number;
}

interface PurchaseTicketsResponse {
  checkoutSessionId: string;
}

interface PurchaseTicketsError {
  statusCode: number;
  message: string;
}

export async function purchaseTickets(
  req: PurchaseTicketsRequest,
): Promise<Result<PurchaseTicketsResponse, PurchaseTicketsError>> {
  try {
    // Validar que el ticketCount sea válido (10, 50, 100)
    const validCounts = [10, 50, 100];
    if (!validCounts.includes(req.ticketCount)) {
      return err({
        statusCode: 400,
        message:
          "Los paquetes disponibles son: 10, 50 o 100 tickets.",
      });
    }

    const data = await fetchPost<PurchaseTicketsResponse>(
      API_ROUTES.GEORGE.PURCHASE_TICKETS,
      req,
      "george"
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[purchaseTickets] Error:", e);
    return err({
      statusCode: 500,
      message: "No pudimos procesar tu compra de tickets.",
    });
  }
}
