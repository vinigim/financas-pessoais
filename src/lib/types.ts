export interface ExpenseEntry {
  rowIndex: number
  description: string
  rawFormula: string | null
  resolvedValue: number
  isFormula: boolean
}

export interface MonthBlock {
  monthLabel: string
  headerRowIndex: number
  valorAPagar: number
  valorAPagarRowIndex: number
  expenses: ExpenseEntry[]
  totalDescontosRowIndex: number
  totalDescontos: number
  saldoRowIndex: number
  saldo: number
}

export interface MonthSummary {
  monthLabel: string
  headerRowIndex: number
  saldo: number
  valorAPagar: number
}

export interface AddExpensePayload {
  headerRowIndex: number
  description: string
  value: number
  formulaString?: string
}

export interface UpdateExpensePayload {
  rowIndex: number
  description?: string
  value?: number
  formulaString?: string
}

export interface NewMonthPayload {
  monthLabel: string
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
