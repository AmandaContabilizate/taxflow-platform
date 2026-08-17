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
}

/**
 * Edita el perfil comercial de un miembro de la plantilla
 * (PUT /team/members/{userId}/profile, Identity). El backend valida que el
 * miembro pertenezca a la plantilla del gerente.
 */
export async function updateExecutiveProfile(
  input: UpdateExecutiveProfileInput,
): Promise<Result<true, TeamError>> {
  try {
    await fetchPut(
      API_ROUTES.TEAM.MEMBER_PROFILE(input.memberUserId),
      {
        segmentId: input.segmentId ?? null,
        b2cChannelId: input.b2cChannelId ?? null,
        team: input.team === undefined ? null : input.team,
        isActive: input.isActive ?? null,
      },
      "team",
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
    console.error("[updateExecutiveProfile] Error:", e);
    return err({ statusCode: 500, message: "No pudimos actualizar el perfil." });
  }
}
