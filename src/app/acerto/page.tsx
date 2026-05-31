import { getAllMonthBlocks } from '@/lib/acerto'
import type { ExpenseHistoryEntry } from '@/lib/types'
import { MonthSelector } from '@/components/MonthSelector'
import { SummaryCard } from '@/components/SummaryCard'
import { MonthBlock } from '@/components/MonthBlock'
import { AddExpenseForm } from '@/components/AddExpenseForm'
import { NewMonthDialog } from '@/components/NewMonthDialog'

interface PageProps {
  searchParams: Promise<{ mes?: string }>
}

export default async function AcertoPage({ searchParams }: PageProps) {
  const params = await searchParams
  const blocks = await getAllMonthBlocks()

  if (blocks.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-zinc-500">Nenhum bloco encontrado na planilha.</p>
      </main>
    )
  }

  const summaries = blocks.map((b) => ({
    monthLabel: b.monthLabel,
    headerRowIndex: b.headerRowIndex,
    saldo: b.saldo,
    valorAPagar: b.valorAPagar,
  }))

  const selectedRow = params.mes
    ? parseInt(params.mes)
    : summaries[summaries.length - 1].headerRowIndex

  const block = blocks.find((b) => b.headerRowIndex === selectedRow) ?? blocks[blocks.length - 1]
  const lastBlock = blocks[blocks.length - 1]
  const lastSummary = summaries[summaries.length - 1]

  // Flat list of all historical expense entries (oldest → newest)
  const expenseHistory: ExpenseHistoryEntry[] = blocks.flatMap((b) =>
    b.expenses.map((e) => ({
      monthLabel: b.monthLabel,
      description: e.description,
      resolvedValue: e.resolvedValue,
      rawFormula: e.rawFormula,
    }))
  )

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-zinc-100">Acerto Gabi</h1>
        <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-1 rounded-full">
          {summaries.length} meses
        </span>
      </div>

      <MonthSelector summaries={summaries} currentRow={selectedRow} />
      <SummaryCard block={block} />
      <MonthBlock block={block} />
      <AddExpenseForm headerRowIndex={block.headerRowIndex} expenseHistory={expenseHistory} />
      <NewMonthDialog lastSummary={lastSummary} lastBlock={lastBlock} />
    </main>
  )
}
