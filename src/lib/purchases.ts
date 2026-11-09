import sql from './db'
import type { Purchase, PaymentMethod } from './purchase-shared'

// Criada sob demanda, como a tabela de assinaturas.
let schemaReady: Promise<void> | null = null

export function ensurePurchasesSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS online_purchases (
          id SERIAL PRIMARY KEY,
          purchase_date DATE NOT NULL,
          store TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount > 0),
          installments INTEGER NOT NULL DEFAULT 1 CHECK (installments BETWEEN 1 AND 48),
          category TEXT NOT NULL DEFAULT 'Outros',
          payment_method TEXT NOT NULL DEFAULT 'Cartão de crédito',
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

function toPurchase(r: Record<string, unknown>): Purchase {
  // DATE vem como Date (meia-noite UTC) ou string, conforme o driver.
  const d = r.purchase_date
  const date = d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10)
  return {
    id: Number(r.id),
    date,
    store: String(r.store),
    description: String(r.description ?? ''),
    totalAmount: Number(r.total_amount),
    installments: Number(r.installments),
    category: String(r.category),
    paymentMethod: r.payment_method as PaymentMethod,
    notes: r.notes === null ? null : String(r.notes),
  }
}

export async function listPurchases(): Promise<Purchase[]> {
  await ensurePurchasesSchema()
  const rows = await sql`SELECT * FROM online_purchases ORDER BY purchase_date DESC, id DESC`
  return rows.map(toPurchase)
}

export type PurchaseInput = Omit<Purchase, 'id'>

export async function insertPurchase(p: PurchaseInput): Promise<void> {
  await ensurePurchasesSchema()
  await sql`
    INSERT INTO online_purchases (purchase_date, store, description, total_amount, installments, category, payment_method, notes)
    VALUES (${p.date}, ${p.store}, ${p.description}, ${p.totalAmount}, ${p.installments}, ${p.category}, ${p.paymentMethod}, ${p.notes})
  `
}

export async function updatePurchaseRow(id: number, p: PurchaseInput): Promise<void> {
  await ensurePurchasesSchema()
  await sql`
    UPDATE online_purchases
    SET purchase_date = ${p.date}, store = ${p.store}, description = ${p.description},
        total_amount = ${p.totalAmount}, installments = ${p.installments}, category = ${p.category},
        payment_method = ${p.paymentMethod}, notes = ${p.notes}
    WHERE id = ${id}
  `
}

export async function deletePurchaseRow(id: number): Promise<void> {
  await ensurePurchasesSchema()
  await sql`DELETE FROM online_purchases WHERE id = ${id}`
}
