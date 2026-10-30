"use server";

import { ApiError, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { InviteTeamMemberInput, InviteTeamMemberResponse, TeamError } from "../types";

/**
 * Invita a un miembro del equipo comercial (POST /team/invite, Identity).
 * Crea el usuario con su rol, genera su código de vendedor y su perfil
 * comercial, y le envía las credenciales por correo.
 */
export async function inviteTeamMember(
  input: InviteTeamMemberInput,
): Promise<Result<InviteTeamMemberResponse, TeamError>> {
  try {
    const data = await fetchPost<InviteTeamMemberResponse>(
      API_ROUTES.TEAM.INVITE,
      {
        fullName: input.fullName,
        email: input.email,
        roleId: input.roleId,
        memberType: input.memberType,
        segmentId: input.segmentId ?? null,
        b2cChannelId: input.b2cChannelId ?? null,
        team: input.team?.trim() || null,
      },
      "team",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      const detail =
        typeof e.body === "object" && e.body !== null && "detail" in e.body
          ? String((e.body as { detail?: string }).detail)
          : e.message;
      return err({ statusCode: e.status, message: detail });
    }
    console.error("[inviteTeamMember] Error:", e);
    return err({ statusCode: 500, message: "No pudimos enviar la invitación." });
  }
}
