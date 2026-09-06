/**
 * Overrides de deducibilidad forzada por clave producto/servicio
 * (`classification.reglas_625_gastos`, solo lectura — E10).
 */
export interface DeductibilityOverride {
  ruleId: number;
  productKey: string;
  activityId: number;
  activityDescription: string | null;
  /** `null` = regla global: aplica a todos los contribuyentes de esa actividad. */
  rfc: string | null;
  /**
   * `sat_code` del régimen donde se decidió el override.
   * `null` = el override quedó inerte: no aplica en ningún régimen (E9).
   */
  deductibilityRegime: string | null;
  isDeductible: boolean;
  deductibilityReason: string | null;
  classificationId: number;
  classificationName: string | null;
  createdAt: string | null;
  createdBy: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface DeductibilityOverridesPage {
  page: number;
  pageSize: number;
  total: number;
  items: DeductibilityOverride[];
}
