/** Servicios adicionales del cliente (GET api/mis-servicios). spec-servicios-adicionales §5.6. */

export interface ServiciosError {
  statusCode: number;
  message: string;
}

export interface MyService {
  subscriptionId: number;
  planId: number;
  name: string;
  providerKey: string;
  logoUrl: string | null;
  /** 1 lo pagas tú · 2 lo paga tu empresa. */
  payerType: number;
  payerName: string | null;
  /** 1 Alta en proceso · 2 Activo · 3 Alta fallida · 4 Baja programada · 5 Terminado · 6 Suspendido. */
  status: number;
  priceMxn: number;
  billingPeriod: string;
  startsAt: string;
  endsAt: string | null;
  cancelRequestedAt: string | null;
  saleId: number;
  stripeSubscriptionId: string | null;
  /** Liga al portal del proveedor cuando el servicio está activo. */
  accessUrl: string | null;
}

export interface AvailableService {
  planId: number;
  key: string;
  name: string;
  providerKey: string;
  billingUnit: number;
  billingPeriod: string;
  listPrice: number;
  price: number;
  shortDescription: string | null;
  features: string[] | null;
  logoUrl: string | null;
}

export interface MyServices {
  contracted: MyService[];
  available: AvailableService[];
}

export const MY_SERVICE_STATUS: Record<number, string> = {
  1: "Alta en proceso",
  2: "Activo",
  3: "Alta fallida",
  4: "Baja programada",
  5: "Terminado",
  6: "Suspendido",
};
