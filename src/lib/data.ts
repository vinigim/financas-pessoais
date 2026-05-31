import sql from './db'
import type { MonthBlock, MonthSummary, ExpenseEntry, ExpenseHistoryEntry } from './types'

export async function initSchema(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS months (
      id SERIAL PRIMARY KEY,
      label TEXT NOT NULL,
      position INTEGER NOT NULL,
      initial_valor_a_pagar NUMERIC(12,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS months_position_idx ON months(position)`
  await sql`
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      month_id INTEGER NOT NULL REFERENCES months(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      value NUMERIC(12,2) NOT NULL DEFAULT 0,
      formula_string TEXT,
      position INTEGER NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
}

// Compute all blocks in order — valorAPagar chains from previous month's saldo.
export async function getAllMonthBlocks(): Promise<MonthBlock[]> {
  const months = await sql`SELECT * FROM months ORDER BY position`
  const expenses = await sql`SELECT * FROM expenses ORDER BY month_id, position`

  const expensesByMonth = new Map<number, typeof expenses>()
  for (const e of expenses) {
    const list = expensesByMonth.get(e.month_id) ?? []
    list.push(e)
    expensesByMonth.set(e.month_id, list)
  }

  let prevSaldo = 0
  const blocks: MonthBlock[] = []

  for (let i = 0; i < months.length; i++) {
    const m = months[i]
    const monthExpenses = expensesByMonth.get(m.id) ?? []
    const valorAPagar = i === 0 ? Number(m.initial_valor_a_pagar) : prevSaldo
    const totalDescontos = monthExpenses.reduce((s, e) => s + Number(e.value), 0)
    const saldo = valorAPagar - totalDescontos

    const expenseEntries: ExpenseEntry[] = monthExpenses.map((e) => ({
      id: e.id,
      description: e.description,
      rawFormula: e.formula_string ?? null,
      resolvedValue: Number(e.value),
      isFormula: e.formula_string !== null,
    }))

    blocks.push({ monthId: m.id, monthLabel: m.label, valorAPagar, expenses: expenseEntries, totalDescontos, saldo })
    prevSaldo = saldo
  }

  return blocks
}

export async function getMonthSummaries(): Promise<MonthSummary[]> {
  const blocks = await getAllMonthBlocks()
  return blocks.map((b) => ({ monthId: b.monthId, monthLabel: b.monthLabel, saldo: b.saldo, valorAPagar: b.valorAPagar }))
}

export async function getAllExpenseHistory(): Promise<ExpenseHistoryEntry[]> {
  const blocks = await getAllMonthBlocks()
  return blocks.flatMap((b) =>
    b.expenses.map((e) => ({ monthLabel: b.monthLabel, description: e.description, resolvedValue: e.resolvedValue, rawFormula: e.rawFormula }))
  )
}

export async function getLastMonthBlock(): Promise<MonthBlock | null> {
  const blocks = await getAllMonthBlocks()
  return blocks.length > 0 ? blocks[blocks.length - 1] : null
}

export async function addExpenseToMonth(
  monthId: number,
  description: string,
  value: number,
  formulaString?: string
): Promise<void> {
  const [{ max_pos }] = await sql`SELECT COALESCE(MAX(position), 0) as max_pos FROM expenses WHERE month_id = ${monthId}`
  await sql`
    INSERT INTO expenses (month_id, description, value, formula_string, position)
    VALUES (${monthId}, ${description}, ${value}, ${formulaString ?? null}, ${Number(max_pos) + 1})
  `
}

export async function updateExpense(
  expenseId: number,
  description?: string,
  value?: number,
  formulaString?: string
): Promise<void> {
  if (description !== undefined && value !== undefined) {
    await sql`UPDATE expenses SET description = ${description}, value = ${value}, formula_string = ${formulaString ?? null} WHERE id = ${expenseId}`
  } else if (description !== undefined) {
    await sql`UPDATE expenses SET description = ${description} WHERE id = ${expenseId}`
  } else if (value !== undefined) {
    await sql`UPDATE expenses SET value = ${value}, formula_string = ${formulaString ?? null} WHERE id = ${expenseId}`
  }
}

export async function deleteExpense(expenseId: number): Promise<void> {
  await sql`DELETE FROM expenses WHERE id = ${expenseId}`
}

export async function createMonth(
  label: string,
  initialValorAPagar: number
): Promise<void> {
  const [{ max_pos }] = await sql`SELECT COALESCE(MAX(position), 0) as max_pos FROM months`
  await sql`
    INSERT INTO months (label, position, initial_valor_a_pagar)
    VALUES (${label}, ${Number(max_pos) + 1}, ${initialValorAPagar})
  `
}

export async function createMonthWithClone(
  label: string,
  initialValorAPagar: number,
  sourceMonthId: number
): Promise<void> {
  const [{ max_pos }] = await sql`SELECT COALESCE(MAX(position), 0) as max_pos FROM months`
  const [newMonth] = await sql`
    INSERT INTO months (label, position, initial_valor_a_pagar)
    VALUES (${label}, ${Number(max_pos) + 1}, ${initialValorAPagar})
    RETURNING id
  `
  const sourceExpenses = await sql`SELECT * FROM expenses WHERE month_id = ${sourceMonthId} ORDER BY position`
  for (const e of sourceExpenses) {
    await sql`
      INSERT INTO expenses (month_id, description, value, formula_string, position)
      VALUES (${newMonth.id}, ${e.description}, ${e.value}, ${e.formula_string}, ${e.position})
    `
  }
}

export async function deleteMonth(monthId: number): Promise<void> {
  await sql`DELETE FROM months WHERE id = ${monthId}`
}
