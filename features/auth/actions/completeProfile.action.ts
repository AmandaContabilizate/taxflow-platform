"use server";

import { ApiError, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { SignInError } from "../types";

interface CompleteProfileInput {
  fullName: string;
  phone: string;
  referralCode?: string;
}

/**
 * Server Action que completa el perfil básico del usuario (nombre/teléfono/
 * código de referido) tras el alta. POST /api/users/CompleteUserProfile —
 * requiere sesión (cookie auth_token ya presente); el email lo toma el
 * backend del claim del JWT, no va en el body.
 *
 * El DTO del backend es `{ Name, Phone, ReferralCode, SaveOnUnknowReferalCode }`
 * — los nombres de campo deben coincidir con esos exactamente (el binding es
 * insensible a mayúsculas, pero no a sinónimos: "fullName" no mapea a "Name").
 */
export async function completeUserProfile(
  input: CompleteProfileInput,
): Promise<Result<true, SignInError>> {
  try {
    await fetchPost<unknown>(
      API_ROUTES.USERS.COMPLETE_PROFILE,
      {
        Name: input.fullName,
        Phone: input.phone,
        ReferralCode: input.referralCode ?? "",
      },
      "users",
    );
    return ok(true);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({
        statusCode: e.status,
        fieldErrors: { root: [e.message || "No se pudo completar el perfil"] },
      });
    }
    console.error("[completeUserProfile] Error:", e);
    return err({
      statusCode: 500,
      fieldErrors: { root: ["Error al completar el perfil. Intenta de nuevo."] },
    });
  }
}
