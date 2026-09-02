"use server"

import { ApiError, fetchGet } from "@/lib/api"
import { API_ROUTES } from "@/lib/api/apiRoutes"
import { type Result, err, ok } from "@/lib/common"

export interface DeclarationDocumentItem {
  type: "Declaration" | "PaymentLine" | "PaymentAcknowledgment"
  label: string
  blobUrl: string | null
  sasUrl: string | null
  hasFile: boolean
  updatedAt: string | null
}

export interface DeclarationDocumentsResponse {
  declarationId: number
  statusId: number
  statusLabel: string
  documents: DeclarationDocumentItem[]
}

export interface GetDeclarationDocumentsError {
  statusCode: number
  message: string
}

/**
 * Consulta los documentos fiscales disponibles de una declaración con sus SAS Tokens.
 */
export async function getDeclarationDocumentsAction(
  declarationId: number,
): Promise<Result<DeclarationDocumentsResponse, GetDeclarationDocumentsError>> {
  try {
    const data = await fetchGet<DeclarationDocumentsResponse>(
      API_ROUTES.DECLARATION.DOCUMENTS(declarationId),
      "declaration",
    )
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message })
    }
    console.error("[getDeclarationDocumentsAction] Error:", e)
    return err({
      statusCode: 500,
      message: "No se pudieron obtener los documentos de la declaración.",
    })
  }
}
