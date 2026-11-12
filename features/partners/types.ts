export interface PartnersError {
  statusCode: number;
  message: string;
}

export interface Partner {
  id: number;
  name: string;
  code: string;
  receivesCommission: boolean;
  isAlliance: boolean;
  b2B2CExecutiveUserId: string | null;
  b2B2CExecutiveName: string | null;
  allianceStartDate: string | null;
  discountCodesCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface SavePartnerInput {
  id?: number;
  name: string;
  receivesCommission: boolean;
  b2b2cExecutiveUserId?: string;
  allianceStartDate?: string;
  isActive: boolean;
}

// ── Perfil Empresa (spec-perfil-empresa §3.1/§5.1) ─────────────────────────────

export interface CompanyPrice {
  id: number;
  subscriptionPlanId: number;
  planName: string;
  listPrice: number;
  priceMxn: number;
  validFrom: string;
  validTo: string | null;
}

export interface CompanyAdmin {
  userId: string;
  fullName: string | null;
  email: string;
  isActive: boolean;
  createdAt: string | null;
}

export interface CompanyPlanOption {
  id: number;
  name: string;
  listPrice: number;
  billingPeriod: string;
}

/** 1 Stripe · 2 Transferencia. */
export type CompanyBillingMode = 1 | 2;

export interface CompanyProfile {
  partnershipId: number;
  partnershipName: string;
  partnershipCode: string;
  partnershipIsActive: boolean;
  isAlliance: boolean;
  b2B2CExecutiveName: string | null;
  /** false = la alianza aún no opera como empresa. */
  hasProfile: boolean;
  rfc: string | null;
  legalName: string | null;
  billingEmail: string | null;
  stripeCustomerId: string | null;
  billingMode: CompanyBillingMode;
  maxActivationsPerMonth: number | null;
  monthlyBudgetMxn: number | null;
  autoApproveBatches: boolean;
  blockOnOverdueDays: number;
  accountExecutiveUserId: string | null;
  accountExecutiveName: string | null;
  hasSso: boolean;
  isActive: boolean;
  linkedUsersCount: number;
  prices: CompanyPrice[];
  admins: CompanyAdmin[];
  planOptions: CompanyPlanOption[];
}

export interface SaveCompanyProfileInput {
  partnershipId: number;
  rfc: string;
  legalName: string;
  billingEmail: string;
  stripeCustomerId: string | null;
  billingMode: CompanyBillingMode;
  maxActivationsPerMonth: number | null;
  monthlyBudgetMxn: number | null;
  autoApproveBatches: boolean;
  blockOnOverdueDays: number;
  accountExecutiveUserId: string | null;
  hasSso: boolean;
  isActive: boolean;
}

export interface CompanyPriceInput {
  subscriptionPlanId: number;
  priceMxn: number;
  validFrom: string;
  validTo: string | null;
}

/** Alta del administrador delegado (POST users/create-user de Identity con el rol AdminPartnership). */
export interface CreateCompanyAdminInput {
  partnershipId: number;
  email: string;
  fullName: string;
  phone?: string;
  roleId: string;
}

export interface SavePartnerResponse {
  success: boolean;
  partnerId: number;
  /** Los 3 códigos de descuento generados automáticamente (solo al crear). */
  generatedCodes: string[] | null;
}
