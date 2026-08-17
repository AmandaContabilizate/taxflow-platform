/**
 * Contratos de Administración de Roles (microservicio Identity).
 * - Catálogo de roles  → apiType "roles"  (`/roles-list`, `/roles/{id}`, `/roles`, `/claims-catalog`)
 * - Roles por usuario  → apiType "users"  (`/assign-role`, `/remove-role`, `/{userId}/roles`, `/switch-role`)
 *
 * Los DTOs de RESPUESTA están confirmados con el backend. Los cuerpos de
 * PETICIÓN (Create/Update/Assign/Replace/Switch) son inferidos — ver comentarios.
 */

// ── Respuestas (confirmadas) ────────────────────────────────────────────────

/** Claim dentro de un rol (respuesta de GET rol / roles-list). */
export interface RoleClaimDto {
  claimCatalogId: number;
  claimType: string;
  claimValue: string;
  description: string | null;
}

/** Detalle de un rol (GET /roles/{roleId}, y respuesta de Create). */
export interface RoleDetailDto {
  id: string;
  name: string;
  description: string | null;
  claims: RoleClaimDto[];
}

/** Item del listado (GET /roles-list). */
export interface RoleOverviewDto {
  id: string;
  name: string;
  /** Nombre en español para mostrar (columna AspNetRoles.DisplayName); el name técnico va en inglés. */
  displayName: string | null;
  description: string | null;
  isDefault: boolean;
  isSystem: boolean;
  claims: RoleClaimDto[];
}

/** Nombre visible de un rol: el español si existe, si no el técnico. */
export function roleLabel(r: { name: string; displayName?: string | null }): string {
  return r.displayName?.trim() || r.name;
}

/** Envoltura de GET /roles-list. */
export interface GetRolesResponse {
  roles: RoleOverviewDto[];
}

/** Claim del catálogo (GET /claims-catalog). `id` == claimCatalogId. */
export interface ClaimCatalogItemDto {
  id: number;
  claimType: string;
  claimValue: string;
  description: string | null;
}

/** Departamento con sus claims (GET /claims-catalog). */
export interface ClaimsDepartmentDto {
  departmentId: number;
  departmentName: string;
  departmentCode: string;
  claims: ClaimCatalogItemDto[];
}

/** Envoltura de GET /claims-catalog. */
export interface GetClaimsCatalogResponse {
  departments: ClaimsDepartmentDto[];
}

/** Rol de un usuario (GET /api/Users/{userId}/roles → array directo). */
export interface UserRoleDto {
  roleId: string;
  roleName: string;
  description: string | null;
  isDefault: boolean;
  isSystemRole: boolean;
}

/** Usuario que tiene asignado un rol (GET /roles/{roleId}/users). */
export interface RoleUserDto {
  userId: string;
  fullName: string | null;
  email: string;
  /** true = este rol es el ACTIVO del usuario (el que carga su token al entrar). */
  isDefault: boolean;
}

export interface GetRoleUsersResponse {
  users: RoleUserDto[];
}

// ── Peticiones (inferidas — ajustar si el backend difiere) ───────────────────

/** POST /roles — crear rol. Los claims se envían por claimCatalogId. */
export interface CreateRolePayload {
  name: string;
  displayName?: string | null;
  description: string | null;
  claimCatalogIds: number[];
}

/**
 * Claim dentro del cuerpo de PUT /roles.
 * `claimValue` es el del catálogo (puede venir null).
 */
export interface UpdateRoleClaimDto {
  claimCatalogId: number;
  claimValue: string | null;
}

/**
 * PUT /roles — editar rol. El backend (UpdateRoleCommand) exige `roleId` en el
 * cuerpo (no en la URL) y recibe los permisos como `claims`, NO `claimCatalogIds`.
 */
export interface UpdateRolePayload {
  roleId: string;
  displayName?: string | null;
  description: string | null;
  claims: UpdateRoleClaimDto[];
}

/** POST /assign-role · /remove-role. */
export interface UserRolePayload {
  userId: string;
  roleId: string;
}

/** PUT /{userId}/roles — reemplazo en bloque + rol por defecto. */
export interface ReplaceUserRolesPayload {
  roleIds: string[];
  defaultRoleId: string;
}

/** POST /switch-role — cambia el rol activo del usuario autenticado. */
export interface SwitchRolePayload {
  roleId: string;
}

/** Respuesta de POST /switch-role (nuevo JWT). */
export interface SwitchRoleResponse {
  token: string;
}

/** Error uniforme de las acciones de roles. */
export interface RolesError {
  statusCode: number;
  message: string;
}
