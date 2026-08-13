"use server";

import { getBaseUrl } from "@/lib/api/apiUrls";
import { getAuthToken } from "@/lib/api/auth";
import { type Result, err, ok } from "@/lib/common";

interface TaxCertificateResponse {
  url: string;
  fileName: string;
  contentType: string;
}

interface GetTaxCertificateError {
  statusCode: number;
  message: string;
}

export async function getTaxCertificate(
  rfc: string,
): Promise<Result<TaxCertificateResponse, GetTaxCertificateError>> {
  try {
    if (!rfc) {
      return err({
        statusCode: 400,
        message: "RFC is required",
      });
    }

    const token = await getAuthToken();
    const baseUrl = getBaseUrl("taxpayers");

    const response = await fetch(
      `${baseUrl}/taxcertificate?rfc=${encodeURIComponent(rfc)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return err({
        statusCode: response.status,
        message: errorData.message || "No pudimos obtener la constancia",
      });
    }

    // La respuesta probablemente sea un redirect o una URL
    const data = (await response.json()) as TaxCertificateResponse;
    return ok(data);
  } catch (e) {
    console.error("[getTaxCertificate] Error:", e);
    return err({
      statusCode: 500,
      message: "Error al obtener la constancia",
    });
  }
}

export async function downloadTaxCertificateAsBytes(
  url: string,
): Promise<Result<{ bytes: ArrayBuffer; fileName: string }, GetTaxCertificateError>> {
  try {
    if (!url) {
      return err({
        statusCode: 400,
        message: "URL is required",
      });
    }

    const token = await getAuthToken();

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return err({
        statusCode: response.status,
        message: "No pudimos descargar la constancia",
      });
    }

    const bytes = await response.arrayBuffer();
    const fileName = "constancia.pdf";

    return ok({ bytes, fileName });
  } catch (e) {
    console.error("[downloadTaxCertificateAsBytes] Error:", e);
    return err({
      statusCode: 500,
      message: "Error al descargar la constancia",
    });
  }
}
