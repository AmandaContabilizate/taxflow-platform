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
  ROLES: {
    LIST: "/roles-list",
    GET: (roleId: string) => `/roles/${encodeURIComponent(roleId)}`,
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
    PAID_PENDING: (kind: number, skip = 0, take = 500, accountantUserId?: string) =>
      `/paid-pending?kind=${kind}&skip=${skip}&take=${take}${accountantUserId ? `&accountantUserId=${encodeURIComponent(accountantUserId)}` : ""
      }`,
    CALCULATIONS: (declarationId: number) => `/${declarationId}/calculations`,
    // Facturas del periodo + su clasificación. Devuelve PagedResult.
    INVOICES: (declarationId: number, skip = 0, take = 100) =>
      `/${declarationId}/invoices?skip=${skip}&take=${take}`,
    GENERAL: (declarationId: number) => `/${declarationId}/general`,
  },
  SALES_OPS: {
    PROCEDURES: (skip = 0, take = 500) =>
      `/procedures?skip=${skip}&take=${take}`,
    SUMMARY: (skip = 0, take = 100, rfc?: string) =>
      `/summary?skip=${skip}&take=${take}${rfc ? `&rfc=${encodeURIComponent(rfc)}` : ""}`,
  },
  TAXPAYERS_OPS: {
    // regimeId es el Id interno de Users.TaxRegimes (p.ej. 18), NO el código SAT (625).
    LIST: (skip = 0, take = 100, rfc?: string, regimeId?: number) =>
      `?skip=${skip}&take=${take}${rfc ? `&rfc=${encodeURIComponent(rfc)}` : ""}${regimeId ? `&regimeId=${regimeId}` : ""
      }`,
    WITH_PAID_SALES: (skip = 0, take = 100, rfc?: string) =>
      `/with-paid-sales?skip=${skip}&take=${take}${rfc ? `&rfc=${encodeURIComponent(rfc)}` : ""}`,
    MY_CLIENTS: (skip = 0, take = 100, rfc?: string, accountantUserId?: string) =>
      `/my-clients?skip=${skip}&take=${take}${rfc ? `&rfc=${encodeURIComponent(rfc)}` : ""}${accountantUserId ? `&accountantUserId=${encodeURIComponent(accountantUserId)}` : ""
      }`,
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
  },
  FINANCES: {
    REGISTER_SALE_NEW: "/register-sale/new",
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
  GEORGE: {
    REGISTER_COMPANY: "/george/register-company",
    COMPANY: "/george/company",
    QUOTA: "/george/quota",
    UPLOAD_TICKET: "/george/upload-ticket",
    TICKETS: "/george/tickets",
    PURCHASE_TICKETS: "/george/purchase-tickets",
  },
} as const;
