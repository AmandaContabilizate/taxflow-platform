"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { TeamError, TeamMember } from "../types";

interface GetTeamMembersResponse {
  success: boolean;
  members: TeamMember[];
}

/** Plantilla del gerente autenticado (GET /team/members, Identity). */
export async function getTeamMembers(): Promise<Result<TeamMember[], TeamError>> {
  try {
    const data = await fetchGet<GetTeamMembersResponse>(
      API_ROUTES.TEAM.MEMBERS,
      "team",
    );
    return ok(data?.members ?? []);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getTeamMembers] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener tu equipo." });
  }
}
