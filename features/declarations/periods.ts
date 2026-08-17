/**
 * Catalogs.Period → rango de meses. Los endpoints de facturas del periodo piden
 * `beginMonth`/`endMonth` (rango cerrado), no el `periodValueId`.
 */

/** 101-112 mensual · 201-206 bimestral · 501 anual. */
export function periodMonthRange(
  periodValueId: number | null | undefined,
): { beginMonth: number; endMonth: number } | null {
  if (periodValueId == null) return null
  if (periodValueId >= 101 && periodValueId <= 112) {
    const month = periodValueId - 100
    return { beginMonth: month, endMonth: month }
  }
  if (periodValueId >= 201 && periodValueId <= 206) {
    const bimester = periodValueId - 200
    return { beginMonth: bimester * 2 - 1, endMonth: bimester * 2 }
  }
  if (periodValueId === 501) return { beginMonth: 1, endMonth: 12 }
  return null
}
