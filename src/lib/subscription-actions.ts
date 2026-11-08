'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  insertSubscription,
  updateSubscriptionRow,
  setSubscriptionActive,
  deleteSubscriptionRow,
} from './subscriptions'
import { BILLING_CYCLES } from './subscription-shared'
import type { ActionResult } from './types'

const SubscriptionSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome da assinatura'),
  amount: z.number().positive('O valor deve ser maior que zero'),
  cycle: z.enum(BILLING_CYCLES),
  category: z.string().trim().min(1).default('Outros'),
  billingDay: z.number().int().min(1).max(31).nullable(),
  active: z.boolean().default(true),
  notes: z.string().trim().nullable().transform((v) => (v ? v : null)),
})

const IdSchema = z.number().int().positive()

function fail(err: unknown): ActionResult {
  return { ok: false, error: err instanceof Error ? err.message : String(err) }
}

export async function createSubscription(data: unknown): Promise<ActionResult> {
  const parsed = SubscriptionSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message }
  try {
    await insertSubscription(parsed.data)
    revalidatePath('/assinaturas')
    return { ok: true }
  } catch (err) {
    return fail(err)
  }
}

export async function updateSubscription(id: unknown, data: unknown): Promise<ActionResult> {
  const pid = IdSchema.safeParse(id)
  const parsed = SubscriptionSchema.safeParse(data)
  if (!pid.success) return { ok: false, error: 'id inválido' }
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message }
  try {
    await updateSubscriptionRow(pid.data, parsed.data)
    revalidatePath('/assinaturas')
    return { ok: true }
  } catch (err) {
    return fail(err)
  }
}

export async function toggleSubscription(id: unknown, active: unknown): Promise<ActionResult> {
  const pid = IdSchema.safeParse(id)
  if (!pid.success || typeof active !== 'boolean') return { ok: false, error: 'dados inválidos' }
  try {
    await setSubscriptionActive(pid.data, active)
    revalidatePath('/assinaturas')
    return { ok: true }
  } catch (err) {
    return fail(err)
  }
}

export async function deleteSubscription(id: unknown): Promise<ActionResult> {
  const pid = IdSchema.safeParse(id)
  if (!pid.success) return { ok: false, error: 'id inválido' }
  try {
    await deleteSubscriptionRow(pid.data)
    revalidatePath('/assinaturas')
    return { ok: true }
  } catch (err) {
    return fail(err)
  }
}
