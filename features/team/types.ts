export interface TeamError {
  statusCode: number;
  message: string;
}

/**
 * 1 = Ejecutivo (empleado), 2 = Finder Fee (vendedor externo),
 * 3 = Contador (equipo de operaciones, sin código de vendedor),
 * 4 = Gerente comercial (encabeza un segmento; solo lo da de alta un administrador).
 */
export type MemberType = 1 | 2 | 3 | 4;

/** Ids del catálogo Catalogs.CommercialSegment. */
export const SEGMENTS = [
  { id: 1, name: "B2C Norte", isB2C: true },
  { id: 2, name: "B2C Centro", isB2C: true },
  { id: 3, name: "SAC", isB2C: false },
  { id: 4, name: "B2B2C", isB2C: false },
] as const;

/** Ids del catálogo Catalogs.B2CChannel. */
export const B2C_CHANNELS = [
  { id: 1, name: "Venta tradicional" },
  { id: 2, name: "Módulo presencial" },
] as const;

export interface InviteTeamMemberInput {
  fullName: string;
  email: string;
  roleId: string;
  memberType: MemberType;
  segmentId?: number;
  b2cChannelId?: number;
  team?: string;
}

export interface InviteTeamMemberResponse {
  success: boolean;
  userId: string;
  vendorCode: string;
}

export interface TeamMember {
  userId: string;
  fullName: string;
  email: string;
  profileTypeId: number;
  profileTypeName: string;
  segmentId: number | null;
  segmentName: string | null;
  b2CChannelId: number | null;
  b2CChannelName: string | null;
  vendorCode: string | null;
  team: string | null;
  hireDate: string | null;
  eligibleFromPeriod: string | null;
  isActive: boolean;
  /** Encabeza su segmento: ve a todo su equipo, no cuelga de otro gerente. */
  isManager: boolean;
}
