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
  /** Cuántos usuarios tienen asignado este rol. */
  usersCount: number;
  /** Alianza dueña del rol (Perfil Empresa, paso 12b); null = rol global. */
  partnershipId?: number | null;
  partnershipName?: string | null;
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
  /**
   * Id del ítem del sidebar (pantalla), '<id>/<slug>' (subdepartamento) o cajón sin pantalla
   * ('portal-cliente', 'cuenta', 'sistema-interno', 'legado'). null = departamento legacy sin
   * ubicar. Ausente en backends anteriores a AlignDepartmentsToSidebarModules.
   */
  moduleKey?: string | null;
  /** Subdepartamento → departamento pantalla. */
  parentId?: number | null;
  sortOrder?: number | null;
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
  /** Alianza/empresa a la que está ligado el usuario (Perfil Empresa); null = ninguna. */
  partnershipId: number | null;
  partnershipName: string | null;
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
  /** Mismo contenido que claimCatalogIds en el formato que lee CreateRoleCommand (`claims[].claimCatalogId`). */
  claims?: UpdateRoleClaimDto[];
  /** Rol propio de una alianza: el backend lo renombra "Empresa.<Código>.<Nombre>" y solo acepta permisos Empresa.* */
  partnershipId?: number | null;
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
  /** Obligatorio al asignar un rol de empresa (AdminPartnership / Empresa.*) a un usuario sin alianza. */
  partnershipId?: number;
}

/** Roles que solo tienen sentido ligados a una alianza/empresa (misma regla que el backend). */
export function isCompanyRole(role: { name: string }): boolean {
  const n = role.name.trim().toLowerCase();
  return n === 'adminpartnership' || n.startsWith('empresa.');
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

/** Respuesta de POST /switch-role (LoginResponse: nuevo JWT + su expiración). */
export interface SwitchRoleResponse {
  token: string;
  /** ISO. Necesaria para que la cookie de sesión conserve su maxAge. */
  expiresAt?: string;
}

/** Error uniforme de las acciones de roles. */
export interface RolesError {
  statusCode: number;
  message: string;
}
