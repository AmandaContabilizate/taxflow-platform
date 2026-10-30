export interface Paged<T> {
  items: T[];
  total: number;
  skip: number;
  take: number;
}

/** Contribuyente ligado a una cuenta. */
export interface UserTaxpayer {
  taxpayerId: number;
  rfc: string;
  legalName: string;
}

/** Item de `/users` (UsuarioDto). `userId` es la cuenta, no el contribuyente. */
export interface UserListItem {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  emailConfirmed: boolean;
  phoneNumberConfirmed: boolean;
  /** Avance del alta. */
  registrationStatus: number;
  /** App desde la que se registró. */
  systemOriginId: number;
  /** Fecha de registro; null en cuentas viejas. */
  createdAt: string | null;
  /** Lockout vigente. */
  bloqueado: boolean;
  roles: string[];
  contribuyentes: number;
  taxpayers: UserTaxpayer[];
  /** Vendedor dueño del código con el que se registró (null si no vino por código). */
  sellerUserId: string | null;
  sellerName: string | null;
  sellerEmail: string | null;
  /** Código de vendedor usado; null si ese vendedor aún no tiene perfil comercial. */
  sellerCode: string | null;
  /** Códigos de descuento con los que ha comprado esta cuenta. */
  discountCodes: string[] | null;
  /** Nombre del origen del registro (catálogo Catalogs.SystemsOrigin). */
  origen: string | null;
  /** Etiqueta del avance del alta, ya resuelta por el backend. */
  estatusRegistro: string | null;
}

/** Conteo de un bucket de estatus (chips de filtro de la pantalla de Usuarios). */
export interface EstatusConteo {
  /** legacy | creado | correo-enviado | correo-verificado | completo | rfc */
  key: string;
  label: string;
  total: number;
}

/** Etapa del embudo de onboarding con su avance relativo. */
export interface EmbudoEtapa {
  key: string;
  label: string;
  total: number;
  porcentaje: number;
}

/** Cliente del ejecutivo (cuenta con RFC ya registrado). */
export interface ClienteActivo {
  userId: string;
  fullName: string | null;
  email: string | null;
  rfc: string | null;
  legalName: string | null;
  ultimaCompra: string | null;
  conPlanPagado: boolean;
}

/** Respuesta de `/users/seller-dashboard`. */
export interface SellerDashboard {
  vendorCode: string | null;
  totalUsuarios: number;
  leadsActivos: number;
  nuevosRegistros7d: number;
  clientesConRfc: number;
  embudo: EmbudoEtapa[];
  clientes: ClienteActivo[];
}

/** Respuesta de `/users`: página + conteos por estatus para los filtros. */
export interface UsuariosPage {
  items: UserListItem[];
  total: number;
  skip: number;
  take: number;
  estatus: EstatusConteo[];
}
