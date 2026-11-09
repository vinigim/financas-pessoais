import { listPurchases } from '@/lib/purchases'
import { isMonthKey } from '@/lib/purchase-shared'
import { PurchasesView } from '@/components/PurchasesView'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ mes?: string }>
}

/** Hoje no fuso de São Paulo, 'YYYY-MM-DD' (o servidor da Vercel roda em UTC). */
function todaySaoPaulo(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
}

export default async function ComprasPage({ searchParams }: PageProps) {
  const { mes } = await searchParams
  const today = todaySaoPaulo()
  const month = isMonthKey(mes) ? mes : today.slice(0, 7)
  const purchases = await listPurchases()

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Compras online</h1>
        <p className="text-sm text-slate-400 mt-1">
          Quanto as compras na internet pesam em cada mês, contando as parcelas.
        </p>
      </div>
      <PurchasesView purchases={purchases} month={month} today={today} />
    </main>
  )
}
