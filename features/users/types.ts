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
}
