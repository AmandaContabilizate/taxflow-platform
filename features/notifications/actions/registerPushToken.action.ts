"use server"

import { fetchPost } from "@/lib/api/fetchClient"
import { API_ROUTES } from "@/lib/api/apiRoutes"
import { ok, err, type Result } from "@/lib/common/result"

export interface RegisterPushTokenPayload {
  userId?: string
  token: string
  platformId?: number
}

export async function registerPushTokenAction(
  payload: RegisterPushTokenPayload
): Promise<Result<{ success: boolean; message: string }>> {
  try {
    const data = await fetchPost<{ success: boolean; message: string }>(
      API_ROUTES.PUSH_TOKENS.REGISTER,
      {
        userId: payload.userId,
        token: payload.token,
        platformId: payload.platformId ?? 4, // 4 = Web
      },
      "push_tokens"
    )

    return ok(data || { success: true, message: "Token registrado con éxito." })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado al registrar token."
    return err(new Error(message))
  }
}
