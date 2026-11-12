/**
 * Catálogo de productos (Catalogs.SubscriptionPlans) · backoffice GESTIÓN → "Catálogo de productos".
 * Backend: Procedures api/subscription-plan-admin (claims Backoffice.ReadProductos / ManageProductos).
 */

export interface ProductosError {
  statusCode: number;
  message: string;
}

/** ProductType del backend. */
export const PRODUCT_TYPES = [
  { id: 0, name: "Plan", hint: "Suscripción o pago único con declaraciones" },
  { id: 1, name: "Trámite adicional", hint: "Servicio puntual que hace el equipo" },
  { id: 2, name: "Servicio", hint: "Proveedor externo (Timbrame, Venvers, Doc2Sign) por RFC o usuario" },
] as const;

export type ProductTypeId = (typeof PRODUCT_TYPES)[number]["id"];

export const BILLING_PERIODS = [
  { id: "month", name: "Mensual" },
  { id: "semester", name: "Semestral" },
  { id: "year", name: "Anual" },
  { id: "once", name: "Pago único" },
] as const;

/** ProviderKey de los conectores (spec-servicios-adicionales §3.1). */
export const PROVIDERS = [
  { id: "timbrame", name: "Timbrame" },
  { id: "venvers", name: "Venvers" },
  { id: "doc2sign", name: "Doc2Sign" },
] as const;

/** ServiceBillingUnit. */
export const BILLING_UNITS = [
  { id: 1, name: "Por RFC" },
  { id: 2, name: "Por usuario" },
] as const;

export interface ProductoRegime {
  taxRegimeId: number;
  satCode: string | null;
  name: string | null;
}

export interface Producto {
  id: number;
  key: string;
  name: string;
  price: number;
  currency: string;
  billingPeriod: string;
  shortDescription: string | null;
  features: string[] | null;
  isActive: boolean;
  deletedAt: string | null;
  /** 0 todos los regímenes · 1 solo los ligados. */
  regimeScope: number;
  productType: number;
  futureDeclarations: number;
  regularizationDeclarations: number;
  grantsFreeAddOns: boolean;
  canBeGrantedFree: boolean;
  allowsQuantity: boolean;
  stripeSubscriptionPriceId: string | null;
  stripeOneTimePriceId: string | null;
  providerKey: string | null;
  billingUnit: number | null;
  /** Logo del producto: data URL subido desde el backoffice o URL https. Null = sin logo (los servicios usan el del proveedor). */
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string | null;
  regimes: ProductoRegime[];
}

export interface SaveProductoInput {
  /** Sin id = alta. */
  id?: number;
  key?: string;
  name: string;
  price: number;
  currency?: string;
  billingPeriod: string;
  shortDescription?: string | null;
  features?: string[] | null;
  isActive: boolean;
  regimeScope: number;
  taxRegimeIds: number[];
  productType: number;
  futureDeclarations: number;
  regularizationDeclarations: number;
  grantsFreeAddOns: boolean;
  canBeGrantedFree: boolean;
  allowsQuantity: boolean;
  stripeSubscriptionPriceId?: string | null;
  stripeOneTimePriceId?: string | null;
  providerKey?: string | null;
  billingUnit?: number | null;
  logoUrl?: string | null;
  /** El plan con cupo en "todos los regímenes" cobra uno y cubre todos: hay que confirmarlo a propósito. */
  confirmMultiRegimeCoverage?: boolean;
}

export function productTypeLabel(id: number): string {
  return PRODUCT_TYPES.find((t) => t.id === id)?.name ?? `Tipo ${id}`;
}

export function billingPeriodLabel(id: string): string {
  const known = BILLING_PERIODS.find((p) => p.id === id)?.name;
  if (known) return known;
  if (id === "one-time") return "Pago único";
  return id === "n/a" ? "—" : id;
}

export function providerLabel(key: string | null): string {
  if (!key) return "—";
  return PROVIDERS.find((p) => p.id === key)?.name ?? key;
}

/**
 * Logos de proveedores: archivos en public/logos/providers/{key}.png (o .svg). Si falta el archivo, la interfaz
 * muestra las iniciales con el color del tipo Servicio. Venvers usa el ícono de Detecno que ya existía.
 */
export const PROVIDER_LOGOS: Record<string, string> = {
  timbrame: "/logos/providers/timbrame.png",
  venvers: "/logos/providers/venvers.png",
  doc2sign: "/logos/providers/doc2sign.png",
};
