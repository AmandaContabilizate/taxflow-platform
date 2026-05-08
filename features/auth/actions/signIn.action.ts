"use server";

import { ApiError, fetchPostPublic } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { PROTECTED_ROUTES } from "@/lib/routes";
import type { SignInSchema } from "../schemas/signIn.schema";
import type { LoginResponse, SignInError } from "../types";
import { setSessionCookies } from "./setSessionCookies.action";

export async function signIn(
  credentials: SignInSchema,
  redirectPath: string = PROTECTED_ROUTES.DASHBOARD,
): Promise<Result<string, SignInError>> {
  try {
    const response = await fetchPostPublic<LoginResponse>(
      API_ROUTES.AUTH.LOGIN,
      // El backend acepta camelCase (System.Text.Json default) y PascalCase.
      {
        email: credentials.email,
        password: credentials.password,
        rememberMe: credentials.rememberMe ?? false,
      },
      "auth",
    );

    if (!response?.token) {
      return err({
        statusCode: 401,
        fieldErrors: { email: ["Credenciales inválidas"] },
      });
    }

    await setSessionCookies(
      {
        token: response.token,
        refreshToken: response.refreshToken,
        email: response.email,
        fullName: response.fullName,
        userId: response.userId,
        rfc: response.rfc,
        expiresAt: response.expiresAt,
      },
      { rememberMe: credentials.rememberMe },
    );

    return ok(redirectPath);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      return err({
        statusCode: 401,
        fieldErrors: { email: ["Credenciales inválidas"] },
      });
    }
    console.error("[signIn] Error:", e);
    return err({
      statusCode: 500,
      fieldErrors: { root: ["Error al iniciar sesión. Intenta de nuevo."] },
    });
  }
}
