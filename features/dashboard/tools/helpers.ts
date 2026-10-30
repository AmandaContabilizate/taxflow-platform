export const formatMoney = (amount: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(amount)

export const formatNumber = (value: number) =>
  new Intl.NumberFormat('es-MX').format(value)
