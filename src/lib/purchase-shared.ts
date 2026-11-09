// Tipos e cálculos de compras online, usados no servidor e no cliente.
// Não importar nada de db.ts aqui.

export const PURCHASE_CATEGORIES = [
  'Casa',
  'Eletrônicos',
  'Roupas',
  'Beleza',
  'Mercado',
  'Bebê',
  'Livros',
  'Presentes',
  'Saúde',
  'Outros',
] as const

export const PAYMENT_METHODS = ['Cartão de crédito', 'Pix', 'Boleto', 'Débito'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const QUICK_STORES = [
  'Amazon',
  'Mercado Livre',
  'Shopee',
  'Shein',
  'AliExpress',
  'Magalu',
  'Americanas',
  'Temu',
]

export interface Purchase {
  id: number
  /** Data da compra, 'YYYY-MM-DD'. */
  date: string
  store: string
  description: string
  totalAmount: number
  installments: number
  category: string
  paymentMethod: PaymentMethod
  notes: string | null
}

/** Mês no formato 'YYYY-MM'. */
export type MonthKey = string

const PT_MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export function monthKeyOf(date: string): MonthKey {
  return date.slice(0, 7)
}

export function addMonths(key: MonthKey, n: number): MonthKey {
  const [y, m] = key.split('-').map(Number)
  const total = y * 12 + (m - 1) + n
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`
}

export function monthLabel(key: MonthKey, short = false): string {
  const [y, m] = key.split('-').map(Number)
  const name = PT_MONTHS[m - 1]
  return short ? `${name.slice(0, 3)}/${String(y).slice(2)}` : `${name} ${y}`
}

export function isMonthKey(v: unknown): v is MonthKey {
  return typeof v === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(v)
}

/**
 * Valor de cada parcela, em reais. Trabalha em centavos para não perder
 * dinheiro no arredondamento: a primeira parcela absorve a sobra
 * (R$ 100 em 3x = 33,34 + 33,33 + 33,33).
 */
export function installmentValues(total: number, installments: number): number[] {
  const cents = Math.round(total * 100)
  const base = Math.floor(cents / installments)
  const rest = cents - base * installments
  return Array.from({ length: installments }, (_, i) => (base + (i === 0 ? rest : 0)) / 100)
}

export interface MonthEntry {
  purchase: Purchase
  /** 1-based. */
  installmentNumber: number
  amount: number
}

/**
 * Parcelas que caem em cada mês. A 1ª parcela cai no mês da compra,
 * a 2ª no mês seguinte, e assim por diante.
 */
export function entriesByMonth(purchases: Purchase[]): Map<MonthKey, MonthEntry[]> {
  const map = new Map<MonthKey, MonthEntry[]>()
  for (const p of purchases) {
    const start = monthKeyOf(p.date)
    installmentValues(p.totalAmount, p.installments).forEach((amount, i) => {
      const key = addMonths(start, i)
      const list = map.get(key) ?? []
      list.push({ purchase: p, installmentNumber: i + 1, amount })
      map.set(key, list)
    })
  }
  return map
}

export function sumEntries(entries: MonthEntry[] | undefined): number {
  return Math.round((entries ?? []).reduce((s, e) => s + e.amount, 0) * 100) / 100
}

/** Agrupa e ordena do maior para o menor. */
export function groupTotals(entries: MonthEntry[], key: (e: MonthEntry) => string): [string, number][] {
  const map = new Map<string, number>()
  for (const e of entries) map.set(key(e), (map.get(key(e)) ?? 0) + e.amount)
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
}
