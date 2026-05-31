import { getAllMonthBlocks } from '@/lib/data'
import type { ExpenseHistoryEntry } from '@/lib/types'
import { MonthSelector } from '@/components/MonthSelector'
import { SummaryCard } from '@/components/SummaryCard'
import { MonthBlock } from '@/components/MonthBlock'
import { AddExpenseForm } from '@/components/AddExpenseForm'
import { NewMonthDialog } from '@/components/NewMonthDialog'
import { DeleteMonthButton } from '@/components/DeleteMonthButton'

interface PageProps {
  searchParams: Promise<{ mes?: string }>
}

export default async function AcertoPage({ searchParams }: PageProps) {
  const params = await searchParams
  const blocks = await getAllMonthBlocks()

  if (blocks.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-slate-400">Nenhum bloco encontrado na planilha.</p>
      </main>
    )
  }

  const summaries = blocks.map((b) => ({
    monthId: b.monthId,
    monthLabel: b.monthLabel,
    saldo: b.saldo,
    valorAPagar: b.valorAPagar,
  }))

  const selectedId = params.mes ? parseInt(params.mes) : summaries[summaries.length - 1].monthId
  const block = blocks.find((b) => b.monthId === selectedId) ?? blocks[blocks.length - 1]
  const lastBlock = blocks[blocks.length - 1]
  const lastSummary = summaries[summaries.length - 1]

  const expenseHistory: ExpenseHistoryEntry[] = blocks.flatMap((b) =>
    b.expenses.map((e) => ({
      monthLabel: b.monthLabel,
      description: e.description,
      resolvedValue: e.resolvedValue,
      rawFormula: e.rawFormula,
    }))
  )

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Acerto Gabi</h1>
        <span className="text-xs font-medium text-slate-400 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full">
          {summaries.length} meses
        </span>
      </div>

      <MonthSelector summaries={summaries} currentMonthId={block.monthId} />
      <SummaryCard block={block} />

      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
            Despesas
          </h2>
          <DeleteMonthButton monthId={block.monthId} monthLabel={block.monthLabel} />
        </div>
        <MonthBlock block={block} />
      </div>

      <AddExpenseForm monthId={block.monthId} expenseHistory={expenseHistory} />

      <div className="pt-2 border-t border-slate-700/50">
        <NewMonthDialog lastSummary={lastSummary} lastBlock={lastBlock} />
      </div>
    </main>
  )
}
