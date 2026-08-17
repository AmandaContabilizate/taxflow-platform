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

export const API_ROUTES = {
  AUTH: {
    LOGIN: "/login",
    SIGN_OUT: "/signout",
    VALIDATE: "/validate",
  },
  USERS: {
    ROOT: "",
    GET: (id: string) => `/${id}`,
    MY_INFO: "/my-info",
    SEND_CODE: "/SendCode",
    EXIST_EMAIL: (email: string) => `/ExistEmail/${encodeURIComponent(email)}`,
    VALIDATE_CODE: "/ValidateConfirmationCode",
    COMPLETE_PROFILE: "/CompleteUserProfile",
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password",
    UPDATE_PASSWORD: "/UpdatePassword",
    ASSIGN_ROLE: "/assign-role",
    REMOVE_ROLE: "/remove-role",
    ROLES: (userId: string) => `/${encodeURIComponent(userId)}/roles`,
    SWITCH_ROLE: "/switch-role",
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
    // GET declarations_reports — panel de gerencia contable (área + desglose).
    GERENCIA_CONTABLE_DASHBOARD: (year: number, month: number, accountantUserId?: string) =>
      `/gerencia-contable-dashboard?year=${year}&month=${month}${accountantUserId ? `&accountantUserId=${encodeURIComponent(accountantUserId)}` : ""}`,
    PAID_PENDING: (kind: number, skip = 0, take = 500, accountantUserId?: string) =>
      `/paid-pending?kind=${kind}&skip=${skip}&take=${take}${accountantUserId ? `&accountantUserId=${encodeURIComponent(accountantUserId)}` : ""
      }`,
    CALCULATIONS: (declarationId: number) => `/${declarationId}/calculations`,
    // Facturas del periodo + su clasificación. Devuelve PagedResult.
    // Filtros opcionales y combinables; omitirlos = "todos". El backend filtra
    // dentro del IQueryable, así que `total` ya viene filtrado.
    // invoiceTypeId: 1 Ingreso, 2 Egreso, 3 Traslado, 4 Pago, 5 Nómina
    // (fuera de 1-5 el backend responde INVALID_REQUEST).
    INVOICES: (params: {
      declarationId: number
      isIssued?: boolean
      invoiceTypeId?: number
      clasificada?: boolean
      skip?: number
      take?: number
    }) => {
      const qs = new URLSearchParams()
      if (params.isIssued != null) qs.set("isIssued", String(params.isIssued))
      if (params.invoiceTypeId != null) qs.set("invoiceTypeId", String(params.invoiceTypeId))
      if (params.clasificada != null) qs.set("clasificada", String(params.clasificada))
      qs.set("skip", String(params.skip ?? 0))
      qs.set("take", String(params.take ?? 100))
      return `/${params.declarationId}/invoices?${qs.toString()}`
    },
    GENERAL: (declarationId: number) => `/${declarationId}/general`,
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
    ) =>
      `?skip=${skip}&take=${take}${search ? `&search=${encodeURIComponent(search)}` : ""}${role ? `&role=${encodeURIComponent(role)}` : ""
      }${emailConfirmed === undefined ? "" : `&emailConfirmed=${emailConfirmed}`}${estatus ? `&estatus=${encodeURIComponent(estatus)}` : ""}`,
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
  DECLARATION: {
    FISCAL_SCORE: (rfc: string) => `/fiscal-score?rfc=${encodeURIComponent(rfc)}`,
    REGULARIZATIONS: (rfc: string) => `/regularizations?rfc=${encodeURIComponent(rfc)}`,
    FUTURE_PLAN: (rfc: string) => `/future-plan?rfc=${encodeURIComponent(rfc)}`,
    ANNUALS: (rfc: string) => `/annuals?rfc=${encodeURIComponent(rfc)}`,
    ALL: (rfc: string) => `/all?rfc=${encodeURIComponent(rfc)}`,
    // Hilo de comentarios de una declaración — mismo declarationId, visible
    // pa' contador (asignado o no) y contribuyente dueño.
    COMMENTS: (declarationId: number) => `/${declarationId}/comments`,
    // apiType "declaration" · POST RecalculateDeclarationRequestDto. Botón
    // "Recalcular" del contador: el RFC va explícito (el GET
    // recalculate-declaration viejo resuelve al contribuyente por el email del
    // token, así que solo sirve cuando el cliente recalcula lo suyo).
    // `adjustments` vacío/ausente = reclasifica desde cero. El cálculo puede
    // tardar minutos (timeout del clasificador: 180s).
    RECALCULATE: "/recalculate",
    // apiType "declaration" · GET. Todas las facturas del periodo con su
    // clasificación (mismo universo que se le manda al clasificador).
    // idRegime = Id interno de Users.TaxRegimes (p.ej. 18), NO el código SAT.
    ISSUED_INVOICES_DECLARATION: (p: DeclarationPeriodInvoicesParams) =>
      `/issued-invoices-declaration${periodInvoicesQuery(p)}`,
    RECEIVED_INVOICES_DECLARATION: (p: DeclarationPeriodInvoicesParams) =>
      `/received-invoices-declaration${periodInvoicesQuery(p)}`,
  },
  // apiType "declaration_report". Flujo público: el cliente abre /reporte?t={token}
  // desde el correo. El token AES (Base64 url-safe) es la única credencial, los
  // tres endpoints son AllowAnonymous → se consumen con las variantes *Public
  // (sin header Authorization) y el token se reenvía tal cual llegó.
  DECLARATION_REPORT: {
    // GET · DeclarationReportDto con la ficha, totales y el desglose crudo.
    REPORT: (token: string) => `/report?t=${encodeURIComponent(token)}`,
    // POST { token } · "Autorizar y presentar": 9 (EnRevisionCliente) → 11 (PorPresentar).
    AUTHORIZE: "/authorize",
    // POST { token, comment } · "Tengo una duda": 9|10 → 10 (RebotadaCliente).
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
    // apiType "catalogs_procedures" · GET. Categorías de classification.clasificacion:
    // el `name` de aquí es el único valor que acepta `adjustments[].classification`
    // al recalcular. `isExpense` omitido = gastos e ingresos.
    CLASSIFICATIONS: (isExpense?: boolean) =>
      `/classifications${isExpense == null ? "" : `?isExpense=${isExpense}`}`,
  },
  FINANCES: {
    REGISTER_SALE_NEW: "/register-sale/new",
    /** Preview del código de descuento (mismas validaciones que el registro). 404 = inválido/agotado. */
    DISCOUNT_CODE_PREVIEW: (code: string, rfc: string) =>
      `/discount-code?code=${encodeURIComponent(code)}&rfc=${encodeURIComponent(rfc)}`,
  },
  // Administración de partnerships externos (SSO). apiType "partnership"
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
    // apiType "stripe" · GET. Devuelve la cuenta completa del RFC (plan,
    // compras y otrosRfc), no solo el plan.
    ACTIVE_PLAN: (rfc: string) =>
      `/active-plan?rfc=${encodeURIComponent(rfc)}`,
  },
  TIMBRAME: {
    /** apiType "timbrame" · GET. Token SSO para portal de facturación. */
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
} as const;
