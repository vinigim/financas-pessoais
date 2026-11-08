// Tipos e cálculos usados tanto no servidor quanto nos componentes cliente.
// Não importar nada de db.ts aqui.

export const BILLING_CYCLES = ['mensal', 'trimestral', 'semestral', 'anual'] as const
export type BillingCycle = (typeof BILLING_CYCLES)[number]

export const CYCLE_LABEL: Record<BillingCycle, string> = {
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
}

const CYCLE_MONTHS: Record<BillingCycle, number> = {
  mensal: 1,
  trimestral: 3,
  semestral: 6,
  anual: 12,
}

export const CATEGORIES = [
  'Streaming',
  'Música',
  'Software',
  'Nuvem',
  'Saúde',
  'Educação',
  'Jogos',
  'Notícias',
  'Outros',
] as const

export interface Subscription {
  id: number
  name: string
  amount: number
  cycle: BillingCycle
  category: string
  billingDay: number | null
  active: boolean
  notes: string | null
}

/** Quanto a assinatura pesa por mês (anual / 12, trimestral / 3...). */
export function monthlyCost(s: Pick<Subscription, 'amount' | 'cycle'>): number {
  return s.amount / CYCLE_MONTHS[s.cycle]
}

/** Dias até a próxima cobrança mensal, a partir de hoje (só ciclo mensal). */
export function daysUntilBilling(billingDay: number, today = new Date()): number {
  const y = today.getFullYear()
  const m = today.getMonth()
  const lastDay = (yy: number, mm: number) => new Date(yy, mm + 1, 0).getDate()
  let target = new Date(y, m, Math.min(billingDay, lastDay(y, m)))
  const start = new Date(y, m, today.getDate())
  if (target < start) target = new Date(y, m + 1, Math.min(billingDay, lastDay(y, m + 1)))
  return Math.round((target.getTime() - start.getTime()) / 86_400_000)
}
