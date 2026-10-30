"use server";

import { ApiError, fetchPut } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { TeamError } from "../types";

export interface UpdateExecutiveProfileInput {
  memberUserId: string;
  segmentId?: number;
  b2cChannelId?: number;
  team?: string | null;
  isActive?: boolean;
  /** Nombra o retira al miembro como gerente de su segmento. Solo lo acepta un administrador. */
  isManager?: boolean;
}

/** `requiresRelogin`: cambió el rol, y los claims viajan en el token. */
export interface UpdateExecutiveProfileResponse {
  requiresRelogin: boolean;
}

/**
 * Edita el perfil comercial de un miembro (PUT /team/members/{userId}/profile,
 * Identity). El backend valida el alcance: el gerente solo toca su plantilla o su
 * segmento, y nombrar gerentes queda reservado a un administrador.
 */
export async function updateExecutiveProfile(
  input: UpdateExecutiveProfileInput,
): Promise<Result<UpdateExecutiveProfileResponse, TeamError>> {
  try {
    const res = await fetchPut<{ requiresRelogin?: boolean }>(
      API_ROUTES.TEAM.MEMBER_PROFILE(input.memberUserId),
      {
        segmentId: input.segmentId ?? null,
        b2cChannelId: input.b2cChannelId ?? null,
        team: input.team === undefined ? null : input.team,
        isActive: input.isActive ?? null,
        isManager: input.isManager ?? null,
      },
      "team",
    );
    return ok({ requiresRelogin: res?.requiresRelogin === true });
  } catch (e) {
    if (e instanceof ApiError) {
      const detail =
        typeof e.body === "object" && e.body !== null && "detail" in e.body
          ? String((e.body as { detail?: string }).detail)
          : e.message;
      return err({ statusCode: e.status, message: detail });
    }
    console.error("[updateExecutiveProfile] Error:", e);
    return err({ statusCode: 500, message: "No pudimos actualizar el perfil." });
  }
}
