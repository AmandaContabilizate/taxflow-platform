"use server";

import { getBaseUrl } from "@/lib/api/apiUrls";
import { getAuthToken } from "@/lib/api/auth";
import { type Result, err, ok } from "@/lib/common";

interface RegisterCompanyRequest {
  cedulaFile: File;
  externalId?: string;
}

interface RegisterCompanyResponse {
  companyId: string;
  apiKey: string;
}

interface RegisterCompanyError {
  statusCode: number;
  message: string;
}

export async function registerCompany(
  req: RegisterCompanyRequest,
): Promise<Result<RegisterCompanyResponse, RegisterCompanyError>> {
  try {
    const token = await getAuthToken();
    const baseUrl = getBaseUrl("george");
    const url = `${baseUrl}/register-company`;

    console.log("[registerCompany] Attempting to register company:", {
      url,
      token: token ? `${token.substring(0, 20)}...` : "NO_TOKEN",
      fileName: req.cedulaFile.name,
      fileSize: req.cedulaFile.size,
    });

    const formData = new FormData();
    formData.append("cedula", req.cedulaFile);
    if (req.externalId) {
      formData.append("externalId", req.externalId);
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[registerCompany] Error response:", {
        status: response.status,
        errorData,
      });
      return err({
        statusCode: response.status,
        message: errorData.detail || errorData.message || "Error registrando empresa",
      });
    }

    const data = (await response.json()) as RegisterCompanyResponse;
    return ok(data);
  } catch (e) {
    console.error("[registerCompany] Error:", e);
    return err({
      statusCode: 500,
      message: "No pudimos registrar tu empresa con George.",
    });
  }
}
