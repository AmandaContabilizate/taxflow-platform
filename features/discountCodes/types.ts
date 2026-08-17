export interface DiscountCodesError {
  statusCode: number;
  message: string;
}

/** Ids del catálogo Catalogs.DiscountType. */
export const DISCOUNT_TYPES = [
  { id: 1, name: "Porcentaje" },
  { id: 2, name: "Declaraciones" },
] as const;

export interface DiscountCodeAdmin {
  id: number;
  code: string;
  description: string | null;
  ownerType: "partner" | "user" | "none";
  partnershipId: number | null;
  sellerUserId: string | null;
  ownerName: string | null;
  ownerProfileType: string | null;
  discountTypeId: number;
  discountPercent: number;
  declarationsCount: number | null;
  maxUses: number | null;
  usedCount: number;
  whitelistedRfcsCount: number;
  /** Lista blanca completa; el modal de edición la precarga para no perder RFCs. */
  whitelistedRfcs: string[];
  subscriptionPlanIds: number[];
  isActive: boolean;
  createdAt: string;
}

export interface DiscountCodeLookups {
  sellers: { userId: string; name: string; profileType: string }[];
  partners: { id: number; name: string }[];
  plans: { id: number; name: string; price: number }[];
}

export interface SaveDiscountCodeInput {
  id?: number;
  code: string;
  description?: string;
  partnershipId?: number;
  sellerUserId?: string;
  discountTypeId: number;
  discountPercent?: number;
  declarationsCount?: number;
  maxUses: number;
  subscriptionPlanIds: number[];
  whitelistedRfcs: string[];
  isActive: boolean;
}
