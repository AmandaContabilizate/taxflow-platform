"use server";

import { getTaxCertificate, downloadTaxCertificateAsBytes } from "./getTaxCertificate.action";
import { registerCompany } from "./registerCompany.action";
import { type Result, err, ok } from "@/lib/common";

interface AutoRegisterCompanyResponse {
  companyId: string;
  apiKey: string;
  message: string;
}

interface AutoRegisterCompanyError {
  statusCode: number;
  message: string;
}

export async function autoRegisterCompanyFromTaxCertificate(
  rfc: string,
): Promise<Result<AutoRegisterCompanyResponse, AutoRegisterCompanyError>> {
  try {
    if (!rfc) {
      return err({
        statusCode: 400,
        message: "RFC is required",
      });
    }

    // Step 1: Get tax certificate URL
    console.log("[autoRegisterCompanyFromTaxCertificate] Step 1: Getting tax certificate URL for RFC:", rfc);
    const certResult = await getTaxCertificate(rfc);
    if (!certResult.success) {
      return err({
        statusCode: certResult.error.statusCode,
        message: `No pudimos obtener la constancia: ${certResult.error.message}`,
      });
    }
    console.log("[autoRegisterCompanyFromTaxCertificate] Step 1 SUCCESS: Got URL:", certResult.value.url);

    // Step 2: Download certificate as bytes
    console.log("[autoRegisterCompanyFromTaxCertificate] Step 2: Downloading certificate from URL");
    const downloadResult = await downloadTaxCertificateAsBytes(certResult.value.url);
    if (!downloadResult.success) {
      return err({
        statusCode: downloadResult.error.statusCode,
        message: `No pudimos descargar la constancia: ${downloadResult.error.message}`,
      });
    }
    console.log("[autoRegisterCompanyFromTaxCertificate] Step 2 SUCCESS: Downloaded", downloadResult.value.bytes.byteLength, "bytes");

    const { bytes, fileName } = downloadResult.value;

    // Step 3: Create File object from bytes
    console.log("[autoRegisterCompanyFromTaxCertificate] Step 3: Creating File object");
    const file = new File([bytes], fileName, { type: "application/pdf" });
    console.log("[autoRegisterCompanyFromTaxCertificate] Step 3 SUCCESS: File created", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Step 4: Register company with certificate
    console.log("[autoRegisterCompanyFromTaxCertificate] Step 4: Registering company");
    const registerResult = await registerCompany({
      cedulaFile: file,
    });
    console.log("[autoRegisterCompanyFromTaxCertificate] Step 4 RESULT:", registerResult);

    if (!registerResult.success) {
      console.error("[autoRegisterCompanyFromTaxCertificate] Register failed:", registerResult.error);
      return err({
        statusCode: registerResult.error.statusCode,
        message: `No pudimos registrar tu empresa: ${registerResult.error.message}`,
      });
    }

    return ok({
      companyId: registerResult.value.companyId,
      apiKey: registerResult.value.apiKey,
      message: "Empresa registrada exitosamente con George",
    });
  } catch (e) {
    console.error("[autoRegisterCompanyFromTaxCertificate] Error:", e);
    return err({
      statusCode: 500,
      message: "Error al registrar la empresa automáticamente",
    });
  }
}
