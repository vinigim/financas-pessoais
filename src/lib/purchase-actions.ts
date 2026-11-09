'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { insertPurchase, updatePurchaseRow, deletePurchaseRow } from './purchases'
import { PAYMENT_METHODS } from './purchase-shared'
import type { ActionResult } from './types'

const PurchaseSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  store: z.string().trim().min(1, 'Informe a loja'),
  description: z.string().trim().default(''),
  totalAmount: z.number().positive('O valor deve ser maior que zero'),
  installments: z.number().int().min(1).max(48, 'Máximo de 48 parcelas'),
  firstInstallmentOffset: z.union([z.literal(0), z.literal(1)]).default(0),
  category: z.string().trim().min(1).default('Outros'),
  paymentMethod: z.enum(PAYMENT_METHODS),
  notes: z.string().trim().nullable().transform((v) => (v ? v : null)),
})

const IdSchema = z.number().int().positive()

function fail(err: unknown): ActionResult {
  return { ok: false, error: err instanceof Error ? err.message : String(err) }
}

export async function createPurchase(data: unknown): Promise<ActionResult> {
  const parsed = PurchaseSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message }
  try {
    await insertPurchase(parsed.data)
    revalidatePath('/compras')
    return { ok: true }
  } catch (err) {
    return fail(err)
  }
}

export async function updatePurchase(id: unknown, data: unknown): Promise<ActionResult> {
  const pid = IdSchema.safeParse(id)
  const parsed = PurchaseSchema.safeParse(data)
  if (!pid.success) return { ok: false, error: 'id inválido' }
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message }
  try {
    await updatePurchaseRow(pid.data, parsed.data)
    revalidatePath('/compras')
    return { ok: true }
  } catch (err) {
    return fail(err)
  }
}

export async function deletePurchase(id: unknown): Promise<ActionResult> {
  const pid = IdSchema.safeParse(id)
  if (!pid.success) return { ok: false, error: 'id inválido' }
  try {
    await deletePurchaseRow(pid.data)
    revalidatePath('/compras')
    return { ok: true }
  } catch (err) {
    return fail(err)
  }
}
