"use server";

import { ApiError, fetchGet, fetchPost, fetchPut } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { CompanyRoleOption, CompanyUser, EmpresaError } from "../types";

function toError(e: unknown, fallback: string, tag: string): EmpresaError {
  if (e instanceof ApiError) {
    const body = e.body as { errorCode?: string; message?: string } | null;
    return { statusCode: e.status, errorCode: e.errorCode ?? body?.errorCode, message: body?.message ?? e.message };
  }
  console.error(`[${tag}] Error:`, e);
  return { statusCode: 500, message: fallback };
}

/** Usuarios de mi empresa + roles asignables (Identity, permiso Empresa.AdministrarUsuarios). */
export async function getCompanyUsers(): Promise<Result<{ usuarios: CompanyUser[]; roles: CompanyRoleOption[] }, EmpresaError>> {
  try {
    const data = await fetchGet<{ success: boolean; usuarios: CompanyUser[]; roles: CompanyRoleOption[] }>(API_ROUTES.EMPRESA_USUARIOS.LIST, "empresa_usuarios");
    return ok({ usuarios: data.usuarios ?? [], roles: data.roles ?? [] });
  } catch (e) {
    return err(toError(e, "No pudimos cargar los usuarios de tu empresa.", "getCompanyUsers"));
  }
}

/** Alta: el sistema genera la contraseña y la manda por correo (mismo flujo que el backoffice). */
export async function createCompanyUser(input: { email: string; fullName: string; phone?: string | null; roleId: string }): Promise<Result<string | null, EmpresaError>> {
  try {
    const data = await fetchPost<{ success: boolean; userId: string | null }>(API_ROUTES.EMPRESA_USUARIOS.CREAR, input, "empresa_usuarios");
    return ok(data.userId ?? null);
  } catch (e) {
    return err(toError(e, "No pudimos dar de alta al usuario.", "createCompanyUser"));
  }
}

export async function setCompanyUserRole(userId: string, roleId: string): Promise<Result<true, EmpresaError>> {
  try {
    await fetchPut<{ success: boolean }>(API_ROUTES.EMPRESA_USUARIOS.ROL(userId), { roleId }, "empresa_usuarios");
    return ok(true);
  } catch (e) {
    return err(toError(e, "No pudimos cambiar el rol.", "setCompanyUserRole"));
  }
}

export async function setCompanyUserActive(userId: string, active: boolean): Promise<Result<true, EmpresaError>> {
  try {
    await fetchPost<{ success: boolean }>(active ? API_ROUTES.EMPRESA_USUARIOS.ALTA(userId) : API_ROUTES.EMPRESA_USUARIOS.BAJA(userId), {}, "empresa_usuarios");
    return ok(true);
  } catch (e) {
    return err(toError(e, active ? "No pudimos reactivar al usuario." : "No pudimos dar de baja al usuario.", "setCompanyUserActive"));
  }
}
