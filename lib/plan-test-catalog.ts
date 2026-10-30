export type PlanTestId = 'platinum-mensual' | 'platinum-semestral' | 'platinum-anual'

export interface PlanTestDef {
  id: PlanTestId
  name: string
  description: string
  priceInCents: number
}

export const PLAN_TEST_CATALOG: PlanTestDef[] = [
  {
    id: 'platinum-mensual',
    name: 'Platinum · Mensual',
    description: '6 declaraciones/mes, 300 CFDI semestrales, chat con contador, listas negras y diagnóstico IA',
    priceInCents: 47025,
  },
  {
    id: 'platinum-semestral',
    name: 'Platinum · Semestral',
    description: 'Mismo plan Platinum cobrado cada 6 meses · ahorras 47%',
    priceInCents: 149500,
  },
  {
    id: 'platinum-anual',
    name: 'Platinum · Anual',
    description: 'Mismo plan Platinum cobrado una sola vez al año · ahorras 52%',
    priceInCents: 270600,
  },
]
