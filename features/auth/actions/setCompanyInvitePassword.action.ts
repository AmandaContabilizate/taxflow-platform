"use server";

import { decodeJwt } from "jose";
import { ApiError, fetchPostPublic } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { PROTECTED_ROUTES, PUBLIC_ROUTES } from "@/lib/routes";
import { resolveLoginDestination } from "../lib/resolveLoginDestination";
import type { LoginResponse, SignInError } from "../types";
import { setSessionCookies } from "./setSessionCookies.action";

interface SetCompanyInvitePasswordInput {
  ref: string;
  password: string;
  rememberMe?: boolean;
}

interface SetCompanyInvitePasswordResponse {
  login?: LoginResponse | null;
  errorCode?: string | null;
  message?: string | null;
}

/**
 * Perfil Empresa: define la contraseña de la cuenta que la empresa creó al invitar y deja la sesión
 * iniciada (misma mecánica que signIn). POST /api/users/company-invite/set-password, anónimo.
 * Devuelve la ruta a la que mandar a la persona.
 */
export async function setCompanyInvitePassword(
  input: SetCompanyInvitePasswordInput,
): Promise<Result<string, SignInError>> {
  try {
    const response = await fetchPostPublic<SetCompanyInvitePasswordResponse>(
      API_ROUTES.USERS.COMPANY_INVITE_SET_PASSWORD,
      { ref: input.ref, password: input.password, rememberMe: input.rememberMe ?? false },
      "users",
    );

    const login = response?.login;
    if (!login?.token) {
      // LOGIN_REQUIRED: la contraseña quedó guardada pero no hubo token; que entre por el login normal.
      return ok(PUBLIC_ROUTES.LOGIN);
    }

    await setSessionCookies(
      {
        token: login.token,
        refreshToken: login.refreshToken,
        email: login.email,
        fullName: login.fullName,
        userId: login.userId,
        rfc: login.rfc,
        expiresAt: login.expiresAt,
        emailChangeBlocked: login.emailChangeBlocked,
        emailChangeBlockedReason: login.emailChangeBlockedReason,
      },
      { rememberMe: input.rememberMe },
    );

    const { role } = decodeJwt(login.token) as { role?: string };
    return ok(
      resolveLoginDestination({
        role,
        rfc: login.rfc,
        fullName: login.fullName,
        fallback: PROTECTED_ROUTES.DASHBOARD,
      }),
    );
  } catch (e) {
    if (e instanceof ApiError) {
      return err({
        statusCode: e.status,
        errorCode: e.errorCode,
        fieldErrors: { root: [e.message || "No se pudo definir la contraseña."] },
      });
    }
    console.error("[setCompanyInvitePassword] Error:", e instanceof Error ? e.message : String(e));
    return err({
      statusCode: 500,
      fieldErrors: { root: ["No se pudo definir la contraseña. Intenta de nuevo."] },
    });
  }
}
