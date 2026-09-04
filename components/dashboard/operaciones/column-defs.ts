/**
 * Selector de columnas compartido por Comprobantes y Recálculo (E5): las dos
 * pantallas muestran los mismos comprobantes y deben ofrecer el mismo picker.
 * Cada pantalla persiste su selección en la URL con su propio prefijo
 * (`cols` / `rcols`), eso no se unifica aquí.
 */
export type ColumnKey =
  | 'tipo'
  | 'comprobante'
  | 'emisor'
  | 'receptor'
  | 'subtotal'
  | 'iva'
  | 'total'
  | 'metodoPago'
  | 'formaPago'
  | 'conceptos'
  | 'clasificacion'
  | 'regimenReceptor'
  | 'usoCfdi'

export const COLUMN_DEFS: { key: ColumnKey; label: string }[] = [
  { key: 'tipo', label: 'Tipo' },
  { key: 'comprobante', label: 'Comprobante' },
  { key: 'emisor', label: 'Emisor' },
  { key: 'receptor', label: 'Receptor' },
  { key: 'subtotal', label: 'Subtotal' },
  { key: 'iva', label: 'IVA' },
  { key: 'total', label: 'Total' },
  { key: 'metodoPago', label: 'Método de pago' },
  { key: 'formaPago', label: 'Forma de pago' },
  { key: 'conceptos', label: 'Conceptos' },
  { key: 'clasificacion', label: 'Clasificación' },
  { key: 'regimenReceptor', label: 'Régimen del receptor' },
  { key: 'usoCfdi', label: 'Uso de CFDI' },
]
