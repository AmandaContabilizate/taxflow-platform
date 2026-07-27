export const API_ROUTES = {
  AUTH: {
    LOGIN: "/login",
    SIGN_OUT: "/signout",
    VALIDATE: "/validate",
  },
  USERS: {
    ROOT: "",
    GET: (id: string) => `/${id}`,
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
    PAID_PENDING: (kind: number, skip = 0, take = 500, accountantUserId?: string) =>
      `/paid-pending?kind=${kind}&skip=${skip}&take=${take}${accountantUserId ? `&accountantUserId=${encodeURIComponent(accountantUserId)}` : ""
      }`,
    CALCULATIONS: (declarationId: number) => `/${declarationId}/calculations`,
    GENERAL: (declarationId: number) => `/${declarationId}/general`,
  },
  SALES_OPS: {
    PROCEDURES: (skip = 0, take = 500) =>
      `/procedures?skip=${skip}&take=${take}`,
    SUMMARY: (skip = 0, take = 100, rfc?: string) =>
      `/summary?skip=${skip}&take=${take}${rfc ? `&rfc=${encodeURIComponent(rfc)}` : ""}`,
  },
  TAXPAYERS_OPS: {
    LIST: (skip = 0, take = 100, rfc?: string) =>
      `?skip=${skip}&take=${take}${rfc ? `&rfc=${encodeURIComponent(rfc)}` : ""}`,
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
    ACTIVE_PLAN: (rfc: string) =>
      `/active-plan?rfc=${encodeURIComponent(rfc)}`,
  },
} as const;
