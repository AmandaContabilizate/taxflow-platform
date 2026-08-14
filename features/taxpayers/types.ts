/**
 * Padrón de contribuyentes / clientes (microservicio Reports).
 * - `/taxpayers`            → todos los contribuyentes.
 * - `/taxpayers/with-paid-sales` → contribuyentes con ventas pagadas (clientes),
 *   con conteos de compras y los planes contratados.
 */

/** Respuesta paginada del backend (skip/take/total). */
export interface Paged<T> {
  items: T[];
  total: number;
  skip: number;
  take: number;
}

export interface TaxpayerRegimen {
  id: number;
  satCode: string;
  name: string;
}

/** Item de `/taxpayers`. */
export interface TaxpayerListItem {
  taxpayerId: number;
  rfc: string;
  legalName: string;
  email: string;
  regimenes: TaxpayerRegimen[];
  /** Ventas pagadas (StatusSaleId=2 con referencia de Stripe). */
  ventasPagadas: number;
}

/**
 * Item de `/taxpayers/with-paid-sales` y `/taxpayers/my-clients` —
 * contribuyente + datos de compra + contador asignado.
 */
export interface ClientListItem extends TaxpayerListItem {
  declaracionesCompradas: number;
  regularizacionesCompradas: number;
  futurasCompradas: number;
  planes: string[];
  /** Contador asignado (null si aún no tiene). */
  accountantUserId: string | null;
  accountantName: string | null;
  accountantEmail: string | null;
}
