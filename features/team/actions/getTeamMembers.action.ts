"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { TeamError, TeamMember } from "../types";

interface GetTeamMembersResponse {
  success: boolean;
  members: TeamMember[];
  managerSegmentId: number | null;
}

export interface TeamMembersResult {
  members: TeamMember[];
  /** Segmento que encabeza quien consulta; null si es admin (elige libremente). */
  managerSegmentId: number | null;
}

/** Plantilla del gerente autenticado (GET /team/members, Identity). */
export async function getTeamMembers(): Promise<Result<TeamMembersResult, TeamError>> {
  try {
    const data = await fetchGet<GetTeamMembersResponse>(
      API_ROUTES.TEAM.MEMBERS,
      "team",
    );
    return ok({
      members: data?.members ?? [],
      managerSegmentId: data?.managerSegmentId ?? null,
    });
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getTeamMembers] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener tu equipo." });
  }
}
