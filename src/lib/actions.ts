'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  addExpenseToMonth,
  updateExpense as dbUpdateExpense,
  deleteExpense as dbDeleteExpense,
  createMonth,
  createMonthWithClone,
  deleteMonth as dbDeleteMonth,
  getAllMonthBlocks,
} from './data'
import type { ActionResult } from './types'

const AddExpenseSchema = z.object({
  monthId: z.number().int().positive(),
  description: z.string().min(1),
  value: z.number(),
  formulaString: z.string().optional(),
})

const UpdateExpenseSchema = z.object({
  expenseId: z.number().int().positive(),
  description: z.string().optional(),
  value: z.number().optional(),
  formulaString: z.string().optional(),
})

const NewMonthSchema = z.object({
  monthLabel: z.string().min(1),
})

function handleError(err: unknown): ActionResult {
  const msg = err instanceof Error ? err.message : String(err)
  return { ok: false, error: msg }
}

export async function addExpense(data: unknown): Promise<ActionResult> {
  const parsed = AddExpenseSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.message }
  try {
    await addExpenseToMonth(parsed.data.monthId, parsed.data.description, parsed.data.value, parsed.data.formulaString)
    revalidatePath('/acerto')
    return { ok: true }
  } catch (err) {
    return handleError(err)
  }
}

export async function updateExpense(data: unknown): Promise<ActionResult> {
  const parsed = UpdateExpenseSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.message }
  try {
    await dbUpdateExpense(parsed.data.expenseId, parsed.data.description, parsed.data.value, parsed.data.formulaString)
    revalidatePath('/acerto')
    return { ok: true }
  } catch (err) {
    return handleError(err)
  }
}

export async function deleteExpense(expenseId: number): Promise<ActionResult> {
  if (!expenseId || expenseId < 1) return { ok: false, error: 'expenseId inválido' }
  try {
    await dbDeleteExpense(expenseId)
    revalidatePath('/acerto')
    return { ok: true }
  } catch (err) {
    return handleError(err)
  }
}

export async function deleteMonth(monthId: number): Promise<ActionResult> {
  if (!monthId || monthId < 1) return { ok: false, error: 'monthId inválido' }
  try {
    await dbDeleteMonth(monthId)
    revalidatePath('/acerto')
    return { ok: true }
  } catch (err) {
    return handleError(err)
  }
}

export async function createNewMonth(data: unknown): Promise<ActionResult> {
  const parsed = NewMonthSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.message }
  try {
    const blocks = await getAllMonthBlocks()
    const lastSaldo = blocks.length > 0 ? blocks[blocks.length - 1].saldo : 0
    await createMonth(parsed.data.monthLabel, lastSaldo)
    revalidatePath('/acerto')
    return { ok: true }
  } catch (err) {
    return handleError(err)
  }
}

export async function createNewMonthWithClone(data: unknown): Promise<ActionResult> {
  const parsed = NewMonthSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.message }
  try {
    const blocks = await getAllMonthBlocks()
    if (blocks.length === 0) return { ok: false, error: 'Nenhum mês existente para clonar' }
    const last = blocks[blocks.length - 1]
    await createMonthWithClone(parsed.data.monthLabel, last.saldo, last.monthId)
    revalidatePath('/acerto')
    return { ok: true }
  } catch (err) {
    return handleError(err)
  }
}
