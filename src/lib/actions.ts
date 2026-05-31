'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  addExpenseToSheet,
  updateExpenseInSheet,
  deleteExpenseFromSheet,
  createNewMonthInSheet,
} from './acerto'
import type { ActionResult } from './types'

const AddExpenseSchema = z.object({
  headerRowIndex: z.number().int().positive(),
  description: z.string().min(1),
  value: z.number(),
  formulaString: z.string().optional(),
})

const UpdateExpenseSchema = z.object({
  rowIndex: z.number().int().positive(),
  description: z.string().optional(),
  value: z.number().optional(),
  formulaString: z.string().optional(),
})

const NewMonthSchema = z.object({
  monthLabel: z.string().min(1),
})

function handleError(err: unknown): ActionResult {
  const msg = err instanceof Error ? err.message : String(err)
  if (msg.includes('EBUSY') || msg.includes('EPERM') || msg.includes('locked')) {
    return { ok: false, error: 'O arquivo está aberto no Excel. Feche-o e tente novamente.' }
  }
  return { ok: false, error: msg }
}

export async function addExpense(data: unknown): Promise<ActionResult> {
  const parsed = AddExpenseSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.message }
  try {
    await addExpenseToSheet(
      parsed.data.headerRowIndex,
      parsed.data.description,
      parsed.data.value,
      parsed.data.formulaString
    )
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
    await updateExpenseInSheet(
      parsed.data.rowIndex,
      parsed.data.description,
      parsed.data.value,
      parsed.data.formulaString
    )
    revalidatePath('/acerto')
    return { ok: true }
  } catch (err) {
    return handleError(err)
  }
}

export async function deleteExpense(rowIndex: number): Promise<ActionResult> {
  if (!rowIndex || rowIndex < 1) return { ok: false, error: 'rowIndex inválido' }
  try {
    await deleteExpenseFromSheet(rowIndex)
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
    await createNewMonthInSheet(parsed.data.monthLabel)
    revalidatePath('/acerto')
    return { ok: true }
  } catch (err) {
    return handleError(err)
  }
}
