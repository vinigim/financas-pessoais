export interface ExpenseEntry {
  id: number
  description: string
  rawFormula: string | null
  resolvedValue: number
  isFormula: boolean
}

export interface MonthBlock {
  monthId: number
  monthLabel: string
  valorAPagar: number
  expenses: ExpenseEntry[]
  totalDescontos: number
  saldo: number
}

export interface MonthSummary {
  monthId: number
  monthLabel: string
  saldo: number
  valorAPagar: number
}

export interface ActionResult {
  ok: boolean
  error?: string
}

export interface ExpenseHistoryEntry {
  monthLabel: string
  description: string
  resolvedValue: number
  rawFormula: string | null
}
