"use server";

import { ApiError, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { CreateCompanyAdminInput, PartnersError } from "../types";

/**
 * Alta del administrador delegado de una empresa: POST users/create-user (Identity) con el rol
 * AdminPartnership y el PartnershipId. El server genera la contraseña, liga al usuario con la alianza
 * (IdPartnership + UserProviders) y manda las credenciales por correo. Claim CreateUser.
 */
export async function createCompanyAdmin(input: CreateCompanyAdminInput): Promise<Result<true, PartnersError>> {
  try {
    await fetchPost<unknown>(
      API_ROUTES.USERS.CREATE_USER,
      {
        email: input.email.trim(),
        fullName: input.fullName.trim(),
        phone: input.phone?.trim() || null,
        roleId: input.roleId,
        partnershipId: input.partnershipId,
      },
      "users",
    );
    return ok(true);
  } catch (e) {
    if (e instanceof ApiError) {
      const detail =
        typeof e.body === "object" && e.body !== null && "detail" in e.body
          ? String((e.body as { detail?: string }).detail)
          : e.message;
      return err({ statusCode: e.status, message: detail });
    }
    console.error("[createCompanyAdmin] Error:", e);
    return err({ statusCode: 500, message: "No pudimos dar de alta al administrador." });
  }
}
