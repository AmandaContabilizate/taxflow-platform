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
  },
} as const;
