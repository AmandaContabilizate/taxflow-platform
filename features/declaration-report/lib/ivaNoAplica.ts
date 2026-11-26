const actividad = (a?: string | null) => a?.trim() || null

export function leyendaIvaNoAplicaContador(a?: string | null): string {
  const act = actividad(a)
  return act
    ? `El IVA no aplica en esta declaración. Al tener la actividad «${act}», sus servicios están exentos de IVA (art. 15, fr. XIV LIVA), así que el IVA no se toma en cuenta en el cálculo.`
    : 'El IVA no aplica en esta declaración. Sus servicios están exentos de IVA (art. 15, fr. XIV LIVA), así que el IVA no se toma en cuenta en el cálculo.'
}

export function leyendaIvaNoAplicaCliente(a?: string | null): string {
  const act = actividad(a)
  return act
    ? `Por tu actividad «${act}», tus servicios están exentos de IVA, por eso no se toma en cuenta en tu declaración.`
    : 'Tus servicios están exentos de IVA, por eso no se toma en cuenta en tu declaración.'
}
