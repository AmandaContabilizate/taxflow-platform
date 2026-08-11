"use server";

import { getBaseUrl } from "@/lib/api/apiUrls";
import { getAuthToken } from "@/lib/api/auth";
import { type Result, err, ok } from "@/lib/common";

interface UploadTicketResponse {
  job_id: string;
  status: string;
}

interface UploadTicketError {
  statusCode: number;
  message: string;
}

export async function uploadTicket(
  file: File,
): Promise<Result<UploadTicketResponse, UploadTicketError>> {
  try {
    const token = await getAuthToken();
    const baseUrl = getBaseUrl("george");

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${baseUrl}/upload-ticket`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return err({
        statusCode: response.status,
        message: errorData.detail || "No pudimos subir tu ticket.",
      });
    }

    const data = (await response.json()) as UploadTicketResponse;
    return ok(data);
  } catch (e) {
    console.error("[uploadTicket] Error:", e);
    return err({
      statusCode: 500,
      message: "Error al subir el ticket.",
    });
  }
}
