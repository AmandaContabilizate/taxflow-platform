"use server"

import { ApiError, fetchPostMultipart } from "@/lib/api"
import { API_ROUTES } from "@/lib/api/apiRoutes"
import { type Result, err, ok } from "@/lib/common"

export interface UploadDeclarationDocumentResponse {
  declarationId: number
  statusId: number
  statusLabel: string
  documentType: string
  fileName: string
  blobUrl: string
  sasUrl: string
  uploadedAt: string
}

export interface UploadDeclarationDocumentError {
  statusCode: number
  message: string
}

/**
 * Sube el Acuse de Declaración o la Línea de Captura en PDF hacia Azure Blob Storage.
 * Actualiza el estatus de la declaración a 'Presentada' (ID 3).
 */
export async function uploadDeclarationDocumentAction(
  declarationId: number,
  formData: FormData,
): Promise<Result<UploadDeclarationDocumentResponse, UploadDeclarationDocumentError>> {
  try {
    const data = await fetchPostMultipart<UploadDeclarationDocumentResponse>(
      API_ROUTES.DECLARATION.UPLOAD_DOCUMENT(declarationId),
      formData,
      "declaration",
    )
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message })
    }
    console.error("[uploadDeclarationDocumentAction] Error:", e)
    return err({
      statusCode: 500,
      message: "No se pudo subir el documento. Intenta nuevamente.",
    })
  }
}
