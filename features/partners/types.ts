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

export interface SavePartnerResponse {
  success: boolean;
  partnerId: number;
  /** Los 3 códigos de descuento generados automáticamente (solo al crear). */
  generatedCodes: string[] | null;
}
