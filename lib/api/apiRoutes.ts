/**
 * Catálogo central de endpoints del backend ContaboxPro core2.
 * Las rutas son relativas a la base que define cada `apiType` en apiUrls.ts.
 */
export const API_ROUTES = {
  AUTH: {
    LOGIN: "/login",                // POST   apiType "auth"  → /api/auth/login
    SIGN_OUT: "/signout",           // POST   apiType "auth"
    VALIDATE: "/validate",          // GET    apiType "auth"
  },
  USERS: {
    ROOT: "",                       // GET    apiType "users" → /api/users
    GET: (id: string) => `/${id}`,
    SEND_CODE: "/SendCode",         // POST   apiType "users" → /api/users/SendCode
    EXIST_EMAIL: (email: string) => `/ExistEmail/${encodeURIComponent(email)}`, // GET apiType "users"
    VALIDATE_CODE: "/ValidateConfirmationCode", // POST apiType "users"
    COMPLETE_PROFILE: "/CompleteUserProfile",   // POST apiType "users" (auth)
    FORGOT_PASSWORD: "/forgot-password",        // POST apiType "users" → body: email (string)
    RESET_PASSWORD: "/reset-password",          // POST apiType "users" → body: { Email, ResetCode, NewPassword }
    // Roles del usuario. apiType "users"
    ASSIGN_ROLE: "/assign-role",    // POST   → /api/users/.../assign-role
    REMOVE_ROLE: "/remove-role",    // POST   → /api/users/.../remove-role
    ROLES: (userId: string) => `/${encodeURIComponent(userId)}/roles`, // GET|PUT
    SWITCH_ROLE: "/switch-role",    // POST   (cambia rol activo, devuelve JWT nuevo)
  },
  // Administración de roles (microservicio Identity). apiType "roles"
  ROLES: {
    LIST: "/roles-list",                                   // GET
    GET: (roleId: string) => `/roles/${encodeURIComponent(roleId)}`, // GET
    CREATE: "/roles",                                      // POST
    UPDATE: "/roles",                                      // PUT
    DELETE: (roleId: string) => `/roles/${encodeURIComponent(roleId)}`, // DELETE
    CLAIMS_CATALOG: "/claims-catalog",                     // GET
  },
  TAXPAYERS: {
    ROOT: "",
    GET: (id: string) => `/${id}`,
    UPDATECIEC: "/updateCiec",
    AVAILABLE_RFCS: "/available-rfcs",
    RFC_STATUS: (rfc: string) => `/rfc-status?rfc=${encodeURIComponent(rfc)}`,
    COMPLIANCE_OPINION: (rfc: string) =>
      `/compliance-opinion?rfc=${encodeURIComponent(rfc)}`,
    TAX_CERTIFICATE: (rfc: string) =>
      `/taxcertificate?rfc=${encodeURIComponent(rfc)}`,
  },
  // Metadata de documentos fiscales (apiType "identity" → base /api)
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
  // Operaciones (microservicio Reports)
  DECLARATIONS_OPS: {
    // kind: 2 = planes a futuro, 1 = regularizaciones. apiType "declarations_reports"
    PAID_PENDING: (kind: number, skip = 0, take = 500) =>
      `/paid-pending?kind=${kind}&skip=${skip}&take=${take}`,
  },
  SALES_OPS: {
    // Trámites adicionales vendidos. apiType "sales_reports"
    PROCEDURES: (skip = 0, take = 500) =>
      `/procedures?skip=${skip}&take=${take}`,
    // Resumen de ventas (cuenta + productos). apiType "sales_reports"
    SUMMARY: (skip = 0, take = 100, rfc?: string) =>
      `/summary?skip=${skip}&take=${take}${rfc ? `&rfc=${encodeURIComponent(rfc)}` : ""}`,
  },
  // Padrón de contribuyentes / clientes (microservicio Reports)
  TAXPAYERS_OPS: {
    // Todos los contribuyentes. apiType "taxpayers_reports"
    LIST: (skip = 0, take = 100, rfc?: string) =>
      `?skip=${skip}&take=${take}${rfc ? `&rfc=${encodeURIComponent(rfc)}` : ""}`,
    // Contribuyentes con ventas pagadas (= clientes). apiType "taxpayers_reports"
    WITH_PAID_SALES: (skip = 0, take = 100, rfc?: string) =>
      `/with-paid-sales?skip=${skip}&take=${take}${rfc ? `&rfc=${encodeURIComponent(rfc)}` : ""}`,
    // Cartera del contador autenticado (o de otro vía accountantUserId). apiType "taxpayers_reports"
    MY_CLIENTS: (skip = 0, take = 100, rfc?: string, accountantUserId?: string) =>
      `/my-clients?skip=${skip}&take=${take}${rfc ? `&rfc=${encodeURIComponent(rfc)}` : ""}${
        accountantUserId ? `&accountantUserId=${encodeURIComponent(accountantUserId)}` : ""
      }`,
  },
  // Asignación de contador a contribuyente (microservicio Procedures). apiType "accountant_assignments"
  ACCOUNTANT_ASSIGNMENTS: {
    // Ver asignación actual + historial + pool de contadores.
    GET: (taxpayerId: number) => `/${taxpayerId}`,
    // Reasignar contribuyente a otro contador.
    REASSIGN: "/reassign",
  },
  // Bóveda de CFDI (microservicio Procedures). apiType "vault".
  // Todas requieren rfc + email (el email sale de la cookie en la server action).
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
  // Documentos CFDI individuales (microservicio Procedures). apiType "cfdi".
  // invoice → emitidas (IdInvoice) · expense → recibidas / gastos (IdExpense).
  CFDI: {
    INVOICE_PDF: (id: string) => `/invoice-pdf?IdInvoice=${encodeURIComponent(id)}`,
    INVOICE_XML: (id: string) => `/invoice-xml?IdInvoice=${encodeURIComponent(id)}`,
    EXPENSE_PDF: (id: string) => `/expense-pdf?IdExpense=${encodeURIComponent(id)}`,
    EXPENSE_XML: (id: string) => `/expense-xml?IdExpense=${encodeURIComponent(id)}`,
  },
  // Ventas / planes (microservicio Procedures)
  CATALOGS: {
    PLANS: (rfc: string) => `/plans?rfc=${encodeURIComponent(rfc)}`, // apiType "catalogs_procedures"
  },
  FINANCES: {
    REGISTER_SALE_NEW: "/register-sale/new", // apiType "finances"
  },
  STRIPE: {
    PAYMENT_SHEET: "/payment-sheet", // apiType "stripe"
    PROMOTION_CODE_VALIDATE: "/promotion-code/validate",
    SUBSCRIPTION_CURRENT: (rfc: string) =>
      `/subscription/current?rfc=${encodeURIComponent(rfc)}`,
    SUBSCRIPTION_CANCEL: "/subscription/cancel",
    ACTIVE_PLAN: (rfc: string) =>
      `/active-plan?rfc=${encodeURIComponent(rfc)}`, // apiType "stripe"
  },
} as const;
