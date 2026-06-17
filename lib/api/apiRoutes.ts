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
    VALIDATE_CODE: "/ValidateConfirmationCode", // POST apiType "users"
    COMPLETE_PROFILE: "/CompleteUserProfile",   // POST apiType "users" (auth)
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
  },
} as const;
