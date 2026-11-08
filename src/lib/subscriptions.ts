import sql from './db'
import type { Subscription, BillingCycle } from './subscription-shared'

// A tabela é criada sob demanda: o app não tem migrations e o initSchema
// nunca é chamado. Uma promessa por instância evita repetir o DDL.
let schemaReady: Promise<void> | null = null

export function ensureSubscriptionsSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS subscriptions (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          amount NUMERIC(12,2) NOT NULL,
          cycle TEXT NOT NULL DEFAULT 'mensal'
            CHECK (cycle IN ('mensal','trimestral','semestral','anual')),
          category TEXT NOT NULL DEFAULT 'Outros',
          billing_day INTEGER CHECK (billing_day BETWEEN 1 AND 31),
          active BOOLEAN NOT NULL DEFAULT TRUE,
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `
    })().catch((err) => {
      schemaReady = null
      throw err
    })
  }
  return schemaReady
}

function toSubscription(r: Record<string, unknown>): Subscription {
  return {
    id: Number(r.id),
    name: String(r.name),
    amount: Number(r.amount),
    cycle: r.cycle as BillingCycle,
    category: String(r.category),
    billingDay: r.billing_day === null ? null : Number(r.billing_day),
    active: Boolean(r.active),
    notes: r.notes === null ? null : String(r.notes),
  }
}

export async function listSubscriptions(): Promise<Subscription[]> {
  await ensureSubscriptionsSchema()
  const rows = await sql`SELECT * FROM subscriptions ORDER BY active DESC, name`
  return rows.map(toSubscription)
}

export interface SubscriptionInput {
  name: string
  amount: number
  cycle: BillingCycle
  category: string
  billingDay: number | null
  active: boolean
  notes: string | null
}

export async function insertSubscription(s: SubscriptionInput): Promise<void> {
  await ensureSubscriptionsSchema()
  await sql`
    INSERT INTO subscriptions (name, amount, cycle, category, billing_day, active, notes)
    VALUES (${s.name}, ${s.amount}, ${s.cycle}, ${s.category}, ${s.billingDay}, ${s.active}, ${s.notes})
  `
}

export async function updateSubscriptionRow(id: number, s: SubscriptionInput): Promise<void> {
  await ensureSubscriptionsSchema()
  await sql`
    UPDATE subscriptions
    SET name = ${s.name}, amount = ${s.amount}, cycle = ${s.cycle}, category = ${s.category},
        billing_day = ${s.billingDay}, active = ${s.active}, notes = ${s.notes}
    WHERE id = ${id}
  `
}

export async function setSubscriptionActive(id: number, active: boolean): Promise<void> {
  await ensureSubscriptionsSchema()
  await sql`UPDATE subscriptions SET active = ${active} WHERE id = ${id}`
}

export async function deleteSubscriptionRow(id: number): Promise<void> {
  await ensureSubscriptionsSchema()
  await sql`DELETE FROM subscriptions WHERE id = ${id}`
}
