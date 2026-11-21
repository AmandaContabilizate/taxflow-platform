import type { CompanyBillingMode } from "@/features/partners/types";

/** Resumen de "Mi empresa" (GET api/empresa/resumen). Sin datos de cobro sensibles ni comisión. */
export interface CompanySummary {
  partnershipId: number;
  name: string;
  code: string;
  /** false = la alianza existe pero Contabilízate aún no capturó su perfil de empresa. */
  hasProfile: boolean;
  isActive: boolean;
  rfc: string | null;
  legalName: string | null;
  hasSso: boolean;
  billingMode: CompanyBillingMode;
  autoApproveBatches: boolean;
  maxActivationsPerMonth: number | null;
  monthlyBudgetMxn: number | null;
  accountExecutiveName: string | null;
  /** Usuarios ligados a la empresa (SSO o creados para ella). */
  linkedUsersCount: number;
  /** Personas en seguimiento fiscal; 0 hasta que exista la pantalla Personas. */
  personsCount: number;
  adminsCount: number;
  pricesCount: number;
  /** Embudo: personas activas por etapa (clave = etapa como texto en JSON). */
  stageCounts: Record<string, number>;
  semaforo: CompanySemaforo;
}

export interface CompanySemaforo {
  enOrden: number;
  conObservaciones: number;
  riesgoAlto: number;
  sinDatos: number;
  sinAutorizacion: number;
}

// ───────────── Expediente de la persona (paso 6) ─────────────

export interface CompanyPersonFiscal {
  consentScope: number | null;
  consentExpiresAt: string | null;
  rfc: string | null;
  legalName: string | null;
  regimes: string[];
  estatusPadron: string | null;
  hasCiec: boolean;
  list69Status: string | null;
  list69PublicationDate: string | null;
  hasCsf: boolean;
  csfDownloadedAt: string | null;
  hasComplianceOpinion: boolean;
  complianceOpinionAt: string | null;
  score: number | null;
  declarationsTotal: number | null;
  declarationsPresented: number | null;
  declarationsPending: number | null;
  isReconciling: boolean;
}

export interface CompanyConsentHistoryItem {
  scope: number;
  grantedAt: string;
  expiresAt: string;
  revokedAt: string | null;
  privacyNoticeVersion: string;
}

export interface CompanyAccessLogItem {
  /** 1 VerExpediente · 2 Descargar · 3 Exportar · 4 VerFacturacion */
  action: number;
  detail: string | null;
  at: string;
  userName: string | null;
}

export interface CompanyPersonActivation {
  id: number;
  period: string;
  planName: string;
  priceMxn: number;
  /** 0 Pendiente · 1 Activada · 2 Fallida · 3 Excluida */
  status: number;
  activatedAt: string | null;
  isRenewal: boolean;
  error: string | null;
}

export interface CompanyPersonFile {
  person: CompanyPerson;
  fiscal: CompanyPersonFiscal;
  consents: CompanyConsentHistoryItem[];
  activity: CompanyAccessLogItem[];
  activations: CompanyPersonActivation[];
}

// ───────────── Personas (spec-perfil-empresa §3.3 / §5.2) ─────────────

/** Etapas de CompanyPersonStage (backend). */
export const PERSON_STAGES = [
  { value: 1, label: 'Cargada', hint: 'La empresa la registró' },
  { value: 2, label: 'Invitada', hint: 'Se le envió la liga' },
  { value: 3, label: 'Invitación abierta', hint: 'Abrió la liga' },
  { value: 4, label: 'Cuenta creada', hint: 'Ya tiene usuario' },
  { value: 5, label: 'CIEC capturada', hint: 'Capturó su CIEC' },
  { value: 6, label: 'RFC registrado', hint: 'Con constancia fiscal' },
  { value: 7, label: 'Autorizó a la empresa', hint: 'Consentimiento vigente' },
  { value: 8, label: 'Lista para activar', hint: 'Esperando lote' },
  { value: 9, label: 'Activada', hint: 'Con plan vigente' },
  { value: 10, label: 'Con plan propio', hint: 'Ya paga su plan; entra a la cola cuando venza' },
] as const;

export type PersonStage = (typeof PERSON_STAGES)[number]['value'];

export const RELATION_TYPES = [
  { value: 1, label: 'Conductor' },
  { value: 2, label: 'Repartidor' },
  { value: 3, label: 'Proveedor' },
  { value: 4, label: 'Prestador de servicios' },
  { value: 5, label: 'Comisionista' },
  { value: 6, label: 'Colaborador independiente' },
  { value: 7, label: 'Empleado' },
  { value: 8, label: 'Socio comercial' },
] as const;

export type RelationType = (typeof RELATION_TYPES)[number]['value'];

export function stageLabel(stage: number): string {
  return PERSON_STAGES.find((s) => s.value === stage)?.label ?? `Etapa ${stage}`;
}

export function relationLabel(type: number): string {
  return RELATION_TYPES.find((r) => r.value === type)?.label ?? '—';
}

export interface CompanyPerson {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  rfcDeclared: string | null;
  relationType: number;
  externalId: string | null;
  city: string | null;
  state: string | null;
  stage: number;
  stageUpdatedAt: string;
  hasAccount: boolean;
  /** La invitación creó la cuenta y la persona aún no define contraseña: se puede reenviar la liga. */
  pendingPassword: boolean;
  lastInviteChannel: number | null;
  lastInviteAt: string | null;
  inviteAttempts: number;
  isActive: boolean;
  createdAt: string;
  /** Bits autorizados vigentes; null = sin autorización (la empresa solo ve la etapa). */
  consentScope: number | null;
  consentExpiresAt: string | null;
  /** Columnas fiscales (solo si autorizó ese alcance; si no, null → "Sin autorización"). */
  rfc: string | null;
  hasCsf: boolean | null;
  csfDownloadedAt: string | null;
  hasComplianceOpinion: boolean | null;
  complianceOpinionAt: string | null;
  score: number | null;
  declarationsTotal: number | null;
  declarationsPresented: number | null;
  /** Lista 69-B del SAT: estatus (Presunto, Definitivo, …) o null si no aparece / no autorizado. */
  list69Status: string | null;
  list69PublicationDate: string | null;
}

export interface CompanyPersonsPage {
  items: CompanyPerson[];
  total: number;
  page: number;
  pageSize: number;
  /** Personas activas por etapa, sin filtros (clave = etapa como texto en JSON). */
  stageCounts: Record<string, number>;
}

export interface GetCompanyPersonsParams {
  search?: string;
  stage?: number;
  relationType?: number;
  includeInactive?: boolean;
  page?: number;
  pageSize?: number;
  /** Solo invitadas, de la más reciente a la más vieja (pantalla Invitaciones). */
  invitedOnly?: boolean;
  /** Solo internos con vista de empresa. */
  partnershipId?: number;
}

export interface CompanyPersonInput {
  fullName: string;
  email: string;
  phone?: string | null;
  rfcDeclared?: string | null;
  relationType: number;
  externalId?: string | null;
  city?: string | null;
  state?: string | null;
}

export interface PersonRowResult {
  row: number;
  email: string;
  /** creada · ligada · omitida · error · enviada */
  status: string;
  message: string | null;
  personId: number | null;
}

export interface AddPersonsResult {
  created: number;
  linkedExisting: number;
  skipped: number;
  failed: number;
  rows: PersonRowResult[];
}

export interface InvitePersonsResult {
  sent: number;
  /** Cuentas de Contabilízate creadas por esta invitación (la persona solo define su contraseña). */
  accountsCreated: number;
  skipped: number;
  failed: number;
  rows: PersonRowResult[];
}

// ───────────── Consentimiento (lado de la persona, spec §5.3) ─────────────

/** Bits de CompanyConsentScope que una empresa puede pedir en fase 1. */
export const CONSENT_SCOPES = [
  { bit: 1, label: 'RFC y régimen fiscal', hint: 'Lo mínimo para darte seguimiento', required: true },
  { bit: 2, label: 'Opinión de cumplimiento', hint: 'Si estás al corriente con el SAT', required: false },
  { bit: 4, label: 'Constancia de situación fiscal', hint: 'Tu CSF, como PDF', required: false },
  { bit: 8, label: 'Diagnóstico fiscal', hint: 'Semáforo y hallazgos de tus declaraciones', required: false },
] as const;

export const CONSENT_REQUESTED_SCOPE = 15;

export interface MyCompanyLink {
  personId: number;
  partnershipId: number;
  companyName: string;
  relationType: number;
  stage: number;
  linkedAt: string;
  requestedScope: number;
  grantedScope: number | null;
  grantedAt: string | null;
  expiresAt: string | null;
  privacyNoticeVersion: string | null;
  hasActiveConsent: boolean;
}

// ───────────── Activación (cola del gerente, paso 7) ─────────────

export interface ActivationPlanOption {
  planId: number;
  name: string;
  billingPeriod: string | null;
  futureDeclarations: number;
  listPrice: number;
  priceMxn: number;
  hasNegotiatedPrice: boolean;
}

export interface ActivationCandidate {
  personId: number;
  partnershipId: number;
  companyName: string;
  autoApproveBatches: boolean;
  fullName: string;
  email: string;
  rfc: string | null;
  regimes: string[];
  stage: number;
  stageUpdatedAt: string;
  isRenewal: boolean;
  eligiblePlans: ActivationPlanOption[];
}

export interface ActivatePersonResult {
  success: boolean;
  activationId: number | null;
  saleId: number | null;
  priceMxn: number | null;
  errorCode: string | null;
  errorMessage: string | null;
}

// ───────────── Lotes diarios (paso 8) ─────────────

export const BATCH_STATUS: Record<number, { label: string; kind: 'default' | 'brand' | 'amber' | 'sky' | 'coral' }> = {
  1: { label: 'Propuesto', kind: 'amber' },
  2: { label: 'Aprobado', kind: 'sky' },
  3: { label: 'En proceso', kind: 'sky' },
  4: { label: 'Terminado', kind: 'brand' },
  5: { label: 'Cancelado', kind: 'default' },
};

export interface CompanyBatch {
  id: number;
  partnershipId: number;
  companyName: string;
  batchDate: string;
  status: number;
  personCount: number;
  estimatedMxn: number;
  pending: number;
  activated: number;
  failed: number;
  excluded: number;
  approvedByName: string | null;
  approvedAt: string | null;
  finishedAt: string | null;
  autoApproved: boolean;
  createdAt: string;
}

export interface CompanyBatchRow {
  activationId: number;
  personId: number;
  fullName: string;
  email: string;
  rfc: string | null;
  planId: number;
  planName: string;
  priceMxn: number;
  status: number;
  error: string | null;
  saleId: number | null;
  isRenewal: boolean;
  activatedAt: string | null;
}

export interface CompanyBatchDetail {
  batch: CompanyBatch;
  rows: CompanyBatchRow[];
}

export interface ProposeBatchesResult {
  companies: number;
  batchesCreated: number;
  batchesAutoApproved: number;
  personsProposed: number;
  personsExcluded: number;
  details: string[];
}

export interface RunBatchResult {
  batchId: number;
  status: number;
  activated: number;
  failed: number;
  remaining: number;
  timeBudgetExceeded: boolean;
}

// ───────────── Estados de cuenta (paso 9) ─────────────

export const STATEMENT_STATUS: Record<number, { label: string; kind: 'default' | 'brand' | 'amber' | 'sky' | 'coral' }> = {
  1: { label: 'Abierto', kind: 'default' },
  2: { label: 'Emitido', kind: 'amber' },
  3: { label: 'Pagado', kind: 'brand' },
  4: { label: 'Vencido', kind: 'coral' },
};

export interface CompanyStatement {
  id: number;
  partnershipId: number;
  companyName: string;
  period: string;
  activations: number;
  subtotal: number;
  vat: number;
  total: number;
  status: number;
  billingMode: number;
  stripeInvoiceId: string | null;
  stripeInvoiceUrl: string | null;
  issuedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
  paymentReference: string | null;
  createdAt: string;
}

export interface CompanyStatementRow {
  activationId: number;
  personId: number;
  fullName: string;
  email: string;
  rfc: string | null;
  planName: string;
  priceMxn: number;
  activatedAt: string | null;
  saleId: number | null;
  isRenewal: boolean;
}

export interface CompanyStatementDetail {
  statement: CompanyStatement;
  rows: CompanyStatementRow[];
}

export interface CloseStatementsResult {
  period: string;
  companies: number;
  statementsIssued: number;
  stripeInvoices: number;
  markedOverdue: number;
  details: string[];
}

// ───────────── Vista interna (paso 10) ─────────────

export interface CompanyListItem {
  partnershipId: number;
  name: string;
  code: string;
  legalName: string | null;
  hasProfile: boolean;
  isActive: boolean;
  hasSso: boolean;
  personsCount: number;
  readyToActivate: number;
  activated: number;
  accountExecutiveName: string | null;
}

// ───────────── Usuarios de mi empresa (paso 12a) ─────────────

export interface CompanyUser {
  userId: string;
  fullName: string | null;
  email: string;
  phone: string | null;
  isActive: boolean;
  roleId: string | null;
  roleName: string | null;
  roleDisplayName: string | null;
  createdAt: string | null;
}

export interface CompanyRoleOption {
  roleId: string;
  name: string;
  displayName: string | null;
  description: string | null;
  /** true = rol propio de la empresa; false = rol global Empresa.* / Administrador empresarial. */
  isCompanyOwned: boolean;
}

export interface EmpresaError {
  statusCode: number;
  /** NO_COMPANY, COMPANY_REQUIRED, FORBIDDEN cuando el backend lo informa. */
  errorCode?: string;
  message: string;
}

// ───────────── Servicios adicionales (spec-servicios-adicionales §5.2 "Empresa") ─────────────

/** Servicio del catálogo como se ofrece a la empresa (precio pactado si existe). */
export interface CompanyServiceCatalogItem {
  planId: number;
  key: string;
  name: string;
  providerKey: string;
  /** 1 por RFC · 2 por usuario. */
  billingUnit: number;
  billingPeriod: string;
  listPrice: number;
  negotiatedPrice: number | null;
  /** negotiatedPrice ?? listPrice (lo calcula el backend). */
  price: number;
  shortDescription: string | null;
  features: string[] | null;
  logoUrl: string | null;
  hasStripeRecurringPrice: boolean;
  regimeScope: number;
  regimeIds: number[];
}

/** Suscripción viva de un servicio sobre una persona. */
export interface PersonService {
  subscriptionId: number;
  companyPersonId: number;
  planId: number;
  providerKey: string;
  /** 1 la persona · 2 la empresa. */
  payerType: number;
  /** 1 Pendiente de alta · 2 Activo · 3 Alta fallida · 4 Cancelado · 5 Terminado · 6 Suspendido. */
  status: number;
  priceMxn: number;
  startsAt: string;
  endsAt: string | null;
  cancelRequestedAt: string | null;
  provisionedAt: string | null;
  lastError: string | null;
}

export interface CompanyServices {
  catalog: CompanyServiceCatalogItem[];
  /** Clave = companyPersonId (como texto en JSON). */
  persons: Record<string, PersonService[]>;
  blockedByOverdue: boolean;
  activeServices: number;
  monthlyServicesCost: number;
}

export interface ContractServiceRow {
  companyPersonId: number;
  personName: string;
  status: "contratada" | "omitida" | "error";
  message: string | null;
  subscriptionId: number | null;
}

export interface ContractServicesResult {
  contracted: number;
  skipped: number;
  failed: number;
  monthlyTotal: number;
  rows: ContractServiceRow[];
}

export const SERVICE_STATUS_LABELS: Record<number, string> = {
  1: "Alta en proceso",
  2: "Activo",
  3: "Alta fallida",
  4: "Baja programada",
  5: "Terminado",
  6: "Suspendido",
};

// ───────────── Listas del SAT (69-B vía SíConf; list69.Taxpayer69B) ─────────────

export interface CompanyList69Match {
  personId: number;
  fullName: string;
  email: string;
  rfc: string;
  statusId: number;
  status: string;
  publicationDate: string | null;
}

export interface CompanyList69StatusCount {
  statusId: number;
  status: string;
  count: number;
}

export interface CompanyList69Summary {
  /** Personas activas con RFC conocido y autorizado: la base del porcentaje. */
  evaluated: number;
  notEvaluated: number;
  clean: number;
  byStatus: CompanyList69StatusCount[];
  matches: CompanyList69Match[];
  listUpdatedAt: string | null;
  listSize: number;
}
