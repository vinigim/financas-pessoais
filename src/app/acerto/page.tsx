import { getMonthSummaries, getMonthBlock } from '@/lib/acerto'
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
  const summaries = await getMonthSummaries()

  if (summaries.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-zinc-500">Nenhum bloco encontrado na planilha.</p>
      </main>
    )
  }

  const selectedRow = params.mes
    ? parseInt(params.mes)
    : summaries[summaries.length - 1].headerRowIndex

  const block = await getMonthBlock(selectedRow)
  const lastSummary = summaries[summaries.length - 1]

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
      <AddExpenseForm headerRowIndex={block.headerRowIndex} />
      <NewMonthDialog lastSummary={lastSummary} />
    </main>
  )
}
