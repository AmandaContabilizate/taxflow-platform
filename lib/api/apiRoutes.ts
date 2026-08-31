/** Query de `issued|received-invoices-declaration`: el rango de meses es cerrado. */
export interface DeclarationPeriodInvoicesParams {
  rfc: string
  year: number
  beginMonth: number
  endMonth: number
  /** Id interno de Users.TaxRegimes, no el código SAT. */
  idRegime: number
}

function periodInvoicesQuery(p: DeclarationPeriodInvoicesParams): string {
  const qs = new URLSearchParams({
    rfc: p.rfc,
    year: String(p.year),
    beginMonth: String(p.beginMonth),
    endMonth: String(p.endMonth),
    idRegime: String(p.idRegime),
  })
  return `?${qs.toString()}`
}

/** Query común de los listados del contador (nivel 1 y nivel 2). */
interface TaxpayerListQuery {
  skip?: number
  take?: number
  /** 1 solo regularizaciones, 2 solo a futuro, ausente = ambas. */
  kind?: 1 | 2
  /** Id interno de Users.TaxRegimes, NO el código SAT. */
  taxRegimeId?: number
  /** Solo periodos de calendario aún no vencidos. No lo aceptan las rutas de regularización. */
  onlyUpcoming?: boolean
  /** Id de `DeclarationStatus` (`Declarations.Declaration.IdStatusDeclaration`). "En proceso" = 15. */
  statusId?: number
}

export interface TaxpayerGroupsQuery extends TaxpayerListQuery {
  search?: string
}

export interface TaxpayerPurchasesQuery extends TaxpayerListQuery {
  rfc?: string
}

function taxpayerListQuery(p: TaxpayerListQuery): URLSearchParams {
  const qs = new URLSearchParams({
    skip: String(p.skip ?? 0),
    take: String(p.take ?? 50),
  })
  if (p.kind) qs.set("kind", String(p.kind))
  if (p.taxRegimeId) qs.set("taxRegimeId", String(p.taxRegimeId))
  if (p.onlyUpcoming) qs.set("onlyUpcoming", "true")
  if (p.statusId) qs.set("statusId", String(p.statusId))
  return qs
}

function taxpayerGroupsQuery(p: TaxpayerGroupsQuery): string {
  const qs = taxpayerListQuery(p)
  if (p.search) qs.set("search", p.search)
  return `?${qs.toString()}`
}

function taxpayerPurchasesQuery(p: TaxpayerPurchasesQuery): string {
  const qs = taxpayerListQuery(p)
  if (p.rfc) qs.set("rfc", p.rfc)
  return `?${qs.toString()}`
}

export const API_ROUTES = {
  AUTH: {
    LOGIN: "/login",
    SIGN_OUT: "/signout",
    VALIDATE: "/validate",
    /** POST auth (Identity). Re-emite el access token (sliding expiration) con un JWT aún válido. */
    REFRESH: "/refresh",
    /** POST auth (Identity), anonimo. Desactiva la cuenta (isActive = 0) validando email + password. */
    DELETE_ACCOUNT: "/delete-account",
  },
  USERS: {
    ROOT: "",
    GET: (id: string) => `/${id}`,
    MY_INFO: "/my-info",
    /** POST users (Identity). El systemOriginId va en ruta; sin el, el back asume 1 (Contabox). */
    SEND_CODE: (systemOriginId?: number) =>
      systemOriginId == null ? "/SendCode" : `/SendCode/${systemOriginId}`,
    EXIST_EMAIL: (email: string) => `/ExistEmail/${encodeURIComponent(email)}`,
    VALIDATE_CODE: "/ValidateConfirmationCode",
    COMPLETE_PROFILE: "/CompleteUserProfile",
    /** POST users (Identity). El systemOriginId va en ruta; sin el, el back asume 1 (Contabox). */
    FORGOT_PASSWORD: (systemOriginId?: number) =>
      systemOriginId == null ? "/forgot-password" : `/forgot-password/${systemOriginId}`,
    RESET_PASSWORD: "/reset-password",
    UPDATE_PASSWORD: "/UpdatePassword",
    ASSIGN_ROLE: "/assign-role",
    REMOVE_ROLE: "/remove-role",
    ROLES: (userId: string) => `/${encodeURIComponent(userId)}/roles`,
    SWITCH_ROLE: "/switch-role",
    /** POST users (Identity). Desactiva la cuenta del usuario autenticado (isActive = 0). */
    DELETE_ACCOUNT: "/delete-account",
  },
  // Equipo comercial — módulo de comisiones. apiType "team" (Identity)
  TEAM: {
    INVITE: "/invite",
    MEMBERS: "/members",
    MEMBER_PROFILE: (userId: string) =>
      `/members/${encodeURIComponent(userId)}/profile`,
  },
  // Partners y alianzas B2B2C. apiType "partners" (Procedures)
  PARTNERS: {
    LIST: "",
    CREATE: "",
    UPDATE: (id: number) => `/${id}`,
  },
  // Códigos de descuento. apiType "discount_codes" (Procedures)
  DISCOUNT_CODES: {
    LIST: "",
    LOOKUPS: "/lookups",
    CREATE: "",
    UPDATE: (id: number) => `/${id}`,
    /** Bitácora de autorizaciones de códigos fuera de tope (auditoría). */
    AUTHORIZATIONS: "/authorizations",
  },
  // Comisiones. apiType "commissions" (Procedures)
  COMMISSIONS: {
    MY_SUMMARY: (period: string) => `/my-summary?period=${encodeURIComponent(period)}`,
    MY_OPERATIONS: (period: string) => `/my-operations?period=${encodeURIComponent(period)}`,
    TEAM_SUMMARY: (period: string) => `/team-summary?period=${encodeURIComponent(period)}`,
  },
  // Preferencias de notificación del usuario autenticado. apiType "notification_prefs" (Procedures)
  NOTIFICATION_PREFS: {
    INFO: "/info",
  },
  // Asignaciones de venta. apiType "assignments" (Procedures)
  ASSIGNMENTS: {
    UNASSIGNED: "/unassigned",
    REQUESTS: "/requests",
    APPROVE: (id: number) => `/requests/${id}/approve`,
    REJECT: (id: number) => `/requests/${id}/reject`,
    /** Retira una solicitud PENDIENTE (solo quien la creó). */
    CANCEL: (id: number) => `/requests/${id}/cancel`,
  },
  ROLES: {
    LIST: "/roles-list",
    GET: (roleId: string) => `/roles/${encodeURIComponent(roleId)}`,
    /** Usuarios que tienen asignado un rol (con flag de rol activo/por defecto). */
    USERS: (roleId: string) => `/${encodeURIComponent(roleId)}/users`,
    CREATE: "/roles",
    UPDATE: "/roles",
    DELETE: (roleId: string) => `/roles/${encodeURIComponent(roleId)}`,
    CLAIMS_CATALOG: "/claims-catalog",
  },
  TAXPAYERS: {
    ROOT: "",
    GET: (id: string) => `/${id}`,
    GET_BY_RFC: (rfc: string) => `/2/taxpayer?rfc=${encodeURIComponent(rfc)}`,
    UPDATECIEC: "/updateCiec",
    // Actividades económicas por régimen (matriz de la última CSF). apiType "taxpayers"
    REGIME_ACTIVITIES: (rfc: string) => `/regime-activities?rfc=${encodeURIComponent(rfc)}`,
    REGIME_ACTIVITY_ACTIVATE: (rfc: string, regimeId: number, activityId: number) =>
      `/regime-activities/activate?rfc=${encodeURIComponent(rfc)}&regimeId=${regimeId}&activityId=${activityId}`,
    REGIME_ACTIVITY_DEACTIVATE: (rfc: string, regimeId: number, activityId: number) =>
      `/regime-activities/deactivate?rfc=${encodeURIComponent(rfc)}&regimeId=${regimeId}&activityId=${activityId}`,
    // Crea contribuyente para cualquier régimen (no limitado a 605); valida CIEC sin
    // descargar constancia, régimen/razón social se completan async. apiType "taxpayers"
    CREATE_BY_CIEC: "/create-by-ciec",
    // Crea (o reutiliza) contribuyente por RFC y persiste su e.Firma. apiType "taxpayers"
    CREATE_BY_EFIRMA: "/create-by-efirma",
    AVAILABLE_RFCS: "/available-rfcs",
    // Credenciales del contribuyente (tab Credenciales del expediente). apiType "taxpayers"
    SAT_PASSWORD: (rfc: string) => `/sat-password?rfc=${encodeURIComponent(rfc)}`,
    RFC_STATUS: (rfc: string) => `/rfc-status?rfc=${encodeURIComponent(rfc)}`,
    COMPLIANCE_OPINION: (rfc: string) =>
      `/compliance-opinion?rfc=${encodeURIComponent(rfc)}`,
    TAX_CERTIFICATE: (rfc: string) =>
      `/taxcertificate?rfc=${encodeURIComponent(rfc)}`,
  },
  METADATA: {
    COMPLIANCE_OPINION: (rfc: string) =>
      `/compliance-opinion/metadata?rfc=${encodeURIComponent(rfc)}`,
    TAX_CERTIFICATE: (rfc: string) =>
      `/taxcertificate/metadata?rfc=${encodeURIComponent(rfc)}`,
  },
  REPORTS: {
    MONTHLY_INCOME: "/monthly-income",
    MONTHLY_BILLS: "/monthly-bills",
    ISSUED_INVOICES: "/issued-invoices",
    ACTIVE_CLIENTS: "/active-clients",
  },
  DECLARATIONS_OPS: {
    // apiType "declarations_reports" · GET. Todos los filtros son opcionales y
    // combinables. OJO: devuelve un array pelón, no PagedResult (sin total).
    // regimeId = Id de Users.TaxRegimes; periodValueId = Catalogs.Period
    // (101-112 mensual, 201-206 bimestral, 501 anual).
    LIST: (params: {
      rfc?: string
      regimeId?: number
      year?: number
      periodValueId?: number
      statusId?: number
      skip?: number
      take?: number
    }) => {
      const qs = new URLSearchParams()
      if (params.rfc) qs.set("rfc", params.rfc)
      if (params.regimeId) qs.set("regimeId", String(params.regimeId))
      if (params.year) qs.set("year", String(params.year))
      if (params.periodValueId) qs.set("periodValueId", String(params.periodValueId))
      if (params.statusId) qs.set("statusId", String(params.statusId))
      qs.set("skip", String(params.skip ?? 0))
      qs.set("take", String(params.take ?? 100))
      return `?${qs.toString()}`
    },
    // GET declarations_reports — panel del contador (cartera, periodo y CIEC).
    CONTADOR_DASHBOARD: (year: number, month: number) =>
      `/contador-dashboard?year=${year}&month=${month}`,
    // GET declarations_reports — equipo de operaciones (pool de contadores + carga del periodo).
    EQUIPO_OPERACIONES: (year: number, month: number) =>
      `/equipo-operaciones?year=${year}&month=${month}`,
    // GET declarations_reports — panel de gerencia contable (área + desglose).
    GERENCIA_CONTABLE_DASHBOARD: (year: number, month: number, accountantUserId?: string) =>
      `/gerencia-contable-dashboard?year=${year}&month=${month}${accountantUserId ? `&accountantUserId=${encodeURIComponent(accountantUserId)}` : ""}`,
    CALCULATIONS: (declarationId: number) => `/${declarationId}/calculations`,
    // Facturas del periodo + su clasificación. Devuelve PagedResult.
    // Filtros opcionales y combinables; omitirlos = "todos". El backend filtra
    // dentro del IQueryable, así que `total` ya viene filtrado.
    // invoiceTypeId: 1 Ingreso, 2 Egreso, 3 Traslado, 4 Pago, 5 Nómina
    // (fuera de 1-5 el backend responde INVALID_REQUEST).
    // `sortBy`/`sortDir`: lista blanca del backend (invoiceDate|total, asc|desc);
    // default invoiceDate/asc reproduce el orden anterior. `includeConcepts=true`
    // llena `conceptos` (detalle completo); sin el flag viaja `null`.
    INVOICES: (params: {
      declarationId: number
      isIssued?: boolean
      invoiceTypeId?: number
      clasificada?: boolean
      skip?: number
      take?: number
      sortBy?: "invoiceDate" | "total"
      sortDir?: "asc" | "desc"
      includeConcepts?: boolean
    }) => {
      const qs = new URLSearchParams()
      if (params.isIssued != null) qs.set("isIssued", String(params.isIssued))
      if (params.invoiceTypeId != null) qs.set("invoiceTypeId", String(params.invoiceTypeId))
      if (params.clasificada != null) qs.set("clasificada", String(params.clasificada))
      qs.set("skip", String(params.skip ?? 0))
      qs.set("take", String(params.take ?? 100))
      if (params.sortBy) qs.set("sortBy", params.sortBy)
      if (params.sortDir) qs.set("sortDir", params.sortDir)
      if (params.includeConcepts) qs.set("includeConcepts", "true")
      return `/${params.declarationId}/invoices?${qs.toString()}`
    },
    GENERAL: (declarationId: number) => `/${declarationId}/general`,
    // apiType "declarations_reports" · GET. Bitácora de cambios de estatus
    // (`DeclarationLog`). Devuelve un ARRAY plano (NO PagedResult), changedAt DESC.
    LOGS: (declarationId: number, skip = 0, take = 100) =>
      `/logs?declarationId=${declarationId}&skip=${skip}&take=${take}`,
  },
  // Controller nuevo de Procedures (`api/declarations`, plural). apiType
  // "declarations_procedures". Policy Contador.UpdateDeclaracionEstatus.
  DECLARATIONS_PROCEDURES: {
    // POST · body opcional `{ note?: string }`. 10|15 -> 9 + correo (best-effort).
    RESEND_TO_CLIENT: (declarationId: number) => `/${declarationId}/resend-to-client`,
  },
  SALES_OPS: {
    PROCEDURES: (skip = 0, take = 500) =>
      `/procedures?skip=${skip}&take=${take}`,
    SUMMARY: (skip = 0, take = 100, rfc?: string, status?: number) =>
      `/summary?skip=${skip}&take=${take}${rfc ? `&rfc=${encodeURIComponent(rfc)}` : ""}${status ? `&status=${status}` : ""}`,
    // GET sales_reports — trazabilidad Stripe de una venta (policy Contador.ReadVentas).
    DETAIL: (saleId: number) => `/detail/${saleId}`,
    // GET sales_reports — planes por vencer en los próximos `dias`.
    UPCOMING_RENEWALS: (
      skip = 0,
      take = 100,
      dias = 30,
      tipo?: "subscription" | "one_time",
      rfc?: string,
      incluirVencidas = false,
    ) =>
      `/upcoming-renewals?skip=${skip}&take=${take}&dias=${dias}${tipo ? `&tipo=${tipo}` : ""}${rfc ? `&rfc=${encodeURIComponent(rfc)}` : ""
      }${incluirVencidas ? "&incluirVencidas=true" : ""}`,
  },
  TAXPAYERS_OPS: {
    // regimeId es el Id interno de Users.TaxRegimes (p.ej. 18), NO el código SAT (625).
    // minSales: mínimo de ventas pagadas (StatusSaleId=2 con referencia de Stripe).
    // En LIST, minSales=1 ya filtra a los que compraron alguna vez; en
    // WITH_PAID_SALES y MY_CLIENTS el mínimo implícito ya es 1, así que sólo
    // tiene efecto con 2 o más.
    LIST: (skip = 0, take = 100, rfc?: string, regimeId?: number, minSales?: number) =>
      `?skip=${skip}&take=${take}${rfc ? `&rfc=${encodeURIComponent(rfc)}` : ""}${regimeId ? `&regimeId=${regimeId}` : ""
      }${minSales ? `&minSales=${minSales}` : ""}`,
    WITH_PAID_SALES: (skip = 0, take = 100, rfc?: string, minSales?: number) =>
      `/with-paid-sales?skip=${skip}&take=${take}${rfc ? `&rfc=${encodeURIComponent(rfc)}` : ""}${minSales ? `&minSales=${minSales}` : ""}`,
    MY_CLIENTS: (skip = 0, take = 100, rfc?: string, accountantUserId?: string, minSales?: number) =>
      `/my-clients?skip=${skip}&take=${take}${rfc ? `&rfc=${encodeURIComponent(rfc)}` : ""}${accountantUserId ? `&accountantUserId=${encodeURIComponent(accountantUserId)}` : ""
      }${minSales ? `&minSales=${minSales}` : ""}`,
    // Expediente del cliente (gerencia comercial): resumen + equipo + productos + periodos.
    EXPEDIENTE: (taxpayerId: number) => `/${taxpayerId}/expediente`,
  },
  // GET users_reports — padrón de cuentas registradas (solo requiere token).
  USERS_OPS: {
    LIST: (
      skip = 0,
      take = 100,
      search?: string,
      role?: string,
      emailConfirmed?: boolean,
      estatus?: string,
      roleExclusive?: boolean,
      origins?: string,
    ) =>
      `?skip=${skip}&take=${take}${search ? `&search=${encodeURIComponent(search)}` : ""}${role ? `&role=${encodeURIComponent(role)}` : ""
      }${emailConfirmed === undefined ? "" : `&emailConfirmed=${emailConfirmed}`}${estatus ? `&estatus=${encodeURIComponent(estatus)}` : ""}${roleExclusive ? "&roleExclusive=true" : ""}${origins ? `&origins=${encodeURIComponent(origins)}` : ""}`,
    // GET users_reports — panel comercial: embudo, altas recientes y clientes con RFC.
    SELLER_DASHBOARD: "/seller-dashboard",
  },
  ACCOUNTANT_ASSIGNMENTS: {
    GET: (taxpayerId: number) => `/${taxpayerId}`,
    REASSIGN: "/reassign",
    BY_RFC: (rfc: string) => `/by-rfc?rfc=${encodeURIComponent(rfc)}`,
  },
  SALES: {
    PAYMENTS: (rfc: string, page = 1, pageSize = 20) =>
      `/payments?rfc=${encodeURIComponent(rfc)}&page=${page}&pageSize=${pageSize}`,
  },
  // Diagnóstico fiscal bajo demanda (apiType "diagnostico", Identity, sin /SQLServer).
  // Cliente: rfc del propio JWT, máx 1 corrida/día. Vendedor: por taxpayerId, cooldown 6h.
  DIAGNOSTICO: {
    RUN_CLIENTE: (rfc: string) => `/cliente?rfc=${encodeURIComponent(rfc)}`,
    CAN_RUN_CLIENTE: (rfc: string) => `/cliente/puede-ejecutar?rfc=${encodeURIComponent(rfc)}`,
    RUN_VENDEDOR: (taxpayerId: number) => `/vendedor/${taxpayerId}`,
    CAN_RUN_VENDEDOR: (taxpayerId: number) => `/vendedor/puede-ejecutar/${taxpayerId}`,
    // Declaraciones pendientes (13/14) que el diagnóstico encontró — backoffice.
    RESULTADO_VENDEDOR: (taxpayerId: number) => `/vendedor/resultado/${taxpayerId}`,
    // Historial de corridas (quién, cuándo, cómo terminó) — backoffice.
    HISTORIAL_VENDEDOR: (taxpayerId: number) => `/vendedor/historial/${taxpayerId}`,
  },
  DECLARATION: {
    FISCAL_SCORE: (rfc: string) => `/fiscal-score?rfc=${encodeURIComponent(rfc)}`,
    REGULARIZATIONS: (rfc: string) => `/regularizations?rfc=${encodeURIComponent(rfc)}`,
    FUTURE_PLAN: (rfc: string) => `/future-plan?rfc=${encodeURIComponent(rfc)}`,
    ANNUALS: (rfc: string) => `/annuals?rfc=${encodeURIComponent(rfc)}`,
    ALL: (rfc: string) => `/all?rfc=${encodeURIComponent(rfc)}`,
    COMMENTS: (declarationId: number) => `/${declarationId}/comments`,
    RECALCULATE: "/recalculate",
    ISSUED_INVOICES_DECLARATION: (p: DeclarationPeriodInvoicesParams) =>
      `/issued-invoices-declaration${periodInvoicesQuery(p)}`,
    RECEIVED_INVOICES_DECLARATION: (p: DeclarationPeriodInvoicesParams) =>
      `/received-invoices-declaration${periodInvoicesQuery(p)}`,
    CLIENT_INVOICES: (declarationId: number) =>
      `/client-invoices?declarationId=${declarationId}`,
    DECLARATION_TAXPAYERS: (p: TaxpayerGroupsQuery = {}) =>
      `/declaration-taxpayers${taxpayerGroupsQuery(p)}`,
    REGULARIZATION_TAXPAYERS: (p: TaxpayerGroupsQuery = {}) =>
      `/regularization-taxpayers${taxpayerGroupsQuery({ ...p, onlyUpcoming: undefined })}`,
    DECLARATIONS_BY_TAXPAYER: (p: TaxpayerPurchasesQuery = {}) =>
      `/declarations-by-taxpayer${taxpayerPurchasesQuery(p)}`,
    REGULARIZATIONS_BY_TAXPAYER: (p: TaxpayerPurchasesQuery = {}) =>
      `/regularizations-by-taxpayer${taxpayerPurchasesQuery({ ...p, onlyUpcoming: undefined })}`,
  },
  DECLARATION_REPORT: {
    REPORT: (token: string) => `/report?t=${encodeURIComponent(token)}`,
    AUTHORIZE: "/authorize",
    COMMENT: "/comment",
  },
  VAULT: {
    ISSUED_COUNT: (rfc: string, email: string) =>
      `/issued-count?rfc=${encodeURIComponent(rfc)}&email=${encodeURIComponent(email)}`,
    RECEIVED_COUNT: (rfc: string, email: string) =>
      `/received-count?rfc=${encodeURIComponent(rfc)}&email=${encodeURIComponent(email)}`,
    TOTAL_INCOME: (rfc: string, email: string, year: number) =>
      `/total-income?rfc=${encodeURIComponent(rfc)}&email=${encodeURIComponent(email)}&year=${year}`,
    TOTAL_EXPENSES: (rfc: string, email: string, year: number) =>
      `/total-expenses?rfc=${encodeURIComponent(rfc)}&email=${encodeURIComponent(email)}&year=${year}`,
    ISSUED_INVOICES: (rfc: string, email: string) =>
      `/issued-invoices?rfc=${encodeURIComponent(rfc)}&email=${encodeURIComponent(email)}`,
    RECEIVED_INVOICES: (rfc: string, email: string) =>
      `/received-invoices?rfc=${encodeURIComponent(rfc)}&email=${encodeURIComponent(email)}`,
  },
  CFDI: {
    INVOICE_PDF: (id: string) => `/invoice-pdf?IdInvoice=${encodeURIComponent(id)}`,
    INVOICE_XML: (id: string) => `/invoice-xml?IdInvoice=${encodeURIComponent(id)}`,
    EXPENSE_PDF: (id: string) => `/expense-pdf?IdExpense=${encodeURIComponent(id)}`,
    EXPENSE_XML: (id: string) => `/expense-xml?IdExpense=${encodeURIComponent(id)}`,
  },
  CATALOGS: {
    PLANS: (rfc: string) => `/plans?rfc=${encodeURIComponent(rfc)}`,
    ADDITIONAL_PROCEDURES: "/additional-procedures",
    TAX_REGIMES: "/taxregimes",
    CLASSIFICATIONS: (isExpense?: boolean) =>
      `/classifications${isExpense == null ? "" : `?isExpense=${isExpense}`}`,
  },
  FINANCES: {
    REGISTER_SALE_NEW: "/register-sale/new",
    DISCOUNT_CODE_PREVIEW: (code: string, rfc: string) =>
      `/discount-code?code=${encodeURIComponent(code)}&rfc=${encodeURIComponent(rfc)}`,
  },
  PARTNERSHIP: {
    CORS: {
      LIST: "/cors",
      ADD: "/cors",
      DELETE: (id: number) => `/cors/${id}`,
    },
    KEYS: {
      ACTIVE: "/keys",
      GENERATE: "/keys",
    },
    LOGINS: "/logins",
  },
  STRIPE: {
    PAYMENT_SHEET: "/payment-sheet",
    PROMOTION_CODE_VALIDATE: "/promotion-code/validate",
    SUBSCRIPTION_CURRENT: (rfc: string) =>
      `/subscription/current?rfc=${encodeURIComponent(rfc)}`,
    SUBSCRIPTION_CANCEL: "/subscription/cancel",
    ACTIVE_PLAN: (rfc: string) =>
      `/active-plan?rfc=${encodeURIComponent(rfc)}`,
  },
  TIMBRAME: {
    PORTAL_ACCESS: "/portal-access",
  },
  MARKETING: {
    BROADCAST_PUSH: "/broadcast-push",
  },
  PUSH_TOKENS: {
    REGISTER: "/register",
  },
  GEORGE: {
    REGISTER_COMPANY: "/george/register-company",
    COMPANY: "/george/company",
    QUOTA: "/george/quota",
    UPLOAD_TICKET: "/george/upload-ticket",
    TICKETS: "/george/tickets",
    PURCHASE_TICKETS: "/george/purchase-tickets",
  },
  USER_NOTIFICATIONS: {
    ROOT: "",
    UNREAD_COUNT: "/unread-count",
    READ: (id: string) => `/${id}/read`,
    MARK_ALL_READ: "/mark-all-read",
    DELETE: (id: string) => `/${id}`,
    SEED_TEST: "/seed-test",
  },
} as const;
