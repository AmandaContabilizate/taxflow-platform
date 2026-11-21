"use server";

import { ApiError, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { AddPersonsResult, CompanyPersonInput, EmpresaError, InvitePersonsResult } from "../types";

function toError(e: unknown, fallback: string, tag: string): EmpresaError {
  if (e instanceof ApiError) {
    const body = e.body as { errorCode?: string; message?: string } | null;
    return { statusCode: e.status, errorCode: e.errorCode ?? body?.errorCode, message: body?.message ?? e.message };
  }
  console.error(`[${tag}] Error:`, e);
  return { statusCode: 500, message: fallback };
}

function withPartnership(route: string, partnershipId?: number): string {
  return partnershipId ? `${route}?partnershipId=${partnershipId}` : route;
}

/** Alta de personas: una (alta individual) o varias (carga masiva). Permiso Empresa.Invitar. */
export async function addCompanyPersons(
  personas: CompanyPersonInput[],
  partnershipId?: number,
): Promise<Result<AddPersonsResult, EmpresaError>> {
  try {
    const data = await fetchPost<{ success: boolean; resultado: AddPersonsResult }>(
      withPartnership(API_ROUTES.EMPRESA.PERSONAS, partnershipId),
      { personas },
      "empresa",
    );
    return ok(data.resultado);
  } catch (e) {
    return err(toError(e, "No pudimos cargar a las personas.", "addCompanyPersons"));
  }
}

/** Invita (o reenvía) por correo. `ids` vacío = todas las personas sin cuenta que nunca han sido invitadas. */
export async function inviteCompanyPersons(
  ids: number[],
  partnershipId?: number,
): Promise<Result<InvitePersonsResult, EmpresaError>> {
  try {
    const data = await fetchPost<{ success: boolean; resultado: InvitePersonsResult }>(
      withPartnership(API_ROUTES.EMPRESA.PERSONAS_INVITAR, partnershipId),
      { ids, canal: 1 },
      "empresa",
    );
    return ok(data.resultado);
  } catch (e) {
    return err(toError(e, "No pudimos enviar las invitaciones.", "inviteCompanyPersons"));
  }
}

/** Baja de una persona del seguimiento (sin reembolso; su plan vigente sigue hasta vencer). */
export async function deactivateCompanyPerson(
  personId: number,
  motivo: string | null,
  partnershipId?: number,
): Promise<Result<true, EmpresaError>> {
  try {
    await fetchPost<{ success: boolean }>(
      withPartnership(API_ROUTES.EMPRESA.PERSONA_BAJA(personId), partnershipId),
      { motivo },
      "empresa",
    );
    return ok(true);
  } catch (e) {
    return err(toError(e, "No pudimos dar de baja a la persona.", "deactivateCompanyPerson"));
  }
}
