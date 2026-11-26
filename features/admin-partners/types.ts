export interface AdminPartnersError {
  statusCode: number;
  message: string;
}

export interface PartnerConsentLimits {
  perDay: number;
  perWeek: number;
  perDayOverridden: boolean;
  perWeekOverridden: boolean;
}

/** Renglón del tablero: uso de la API y señales de abuso de un aliado. */
export interface PartnerAbuseOverviewRow {
  partnershipId: number;
  name: string;
  isActive: boolean;
  fullySuspended: boolean;
  onboardingBlocked: boolean;
  activeLinks: number;
  consentRequests24h: number;
  consentRequests7d: number;
  accepted7d: number;
  rejected7d: number;
  reported7d: number;
  expired7d: number;
  responded30d: number;
  reported30d: number;
  reportRatePercent30d: number | null;
  acceptancePercent7d: number | null;
  invalidRfc24h: number;
  probeWithoutEmail24h: number;
  notLinked24h: number;
  requests24h: number;
  openAlerts: number;
  limits: PartnerConsentLimits;
}

export type PartnerAlertType =
  | "OwnerReport"
  | "ReportRate"
  | "LowAcceptance"
  | "ConsentQuotaExceeded"
  | "ProbeWithoutEmail"
  | "NotLinkedLookups"
  | "InvalidRfcBurst"
  | "SequentialRfc";

export interface PartnerAbuseAlert {
  id: number;
  partnershipId: number;
  partnershipName: string;
  type: PartnerAlertType;
  severity: "Info" | "Warning" | "Critical";
  status: "Open" | "Reviewed" | "Dismissed";
  summary: string;
  metricsJson: string | null;
  windowStart: string;
  windowEnd: string;
  occurrences: number;
  lastSeenAt: string;
  restrictionId: number | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewNotes: string | null;
}

export interface PartnerRestriction {
  id: number;
  type: "FullSuspension" | "TaxpayerOnboarding";
  reason: "Manual" | "InvalidRfcBurst" | "SequentialRfc" | "ConsentQuotaRepeated";
  notes: string | null;
  createdAt: string;
  createdBy: string;
  liftedAt: string | null;
  liftedBy: string | null;
  liftNotes: string | null;
}

export interface PartnerAbuseThresholds {
  consentRequestsPerDay: number;
  consentRequestsPerWeek: number;
  quotaExceededDaysToBlockOnboarding: number;
  quotaExceededWindowDays: number;
  reportRateWindowDays: number;
  reportRateMinResponses: number;
  reportRateWarningPercent: number;
  reportRateCriticalPercent: number;
  lowAcceptanceWindowDays: number;
  lowAcceptanceMinRequests: number;
  lowAcceptancePercent: number;
  probeWithoutEmailPerDay: number;
  notLinkedLookupsPerHour: number;
  invalidRfcPerDay: number;
  sequentialRfcRunLength: number;
  sequentialRfcWindowHours: number;
}

export interface PartnerAbuseDetail {
  summary: PartnerAbuseOverviewRow;
  restrictions: PartnerRestriction[];
  alerts: PartnerAbuseAlert[];
  thresholds: PartnerAbuseThresholds;
}
