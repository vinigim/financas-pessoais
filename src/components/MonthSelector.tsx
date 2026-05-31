'use client'

import { useRouter } from 'next/navigation'
import type { MonthSummary } from '@/lib/types'
import { formatBRL } from '@/lib/utils'

export function MonthSelector({
  summaries,
  currentRow,
}: {
  summaries: MonthSummary[]
  currentRow: number
}) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-3 mb-6">
      <label className="text-sm text-zinc-400 whitespace-nowrap">Mês:</label>
      <select
        value={currentRow}
        onChange={(e) => router.push(`/acerto?mes=${e.target.value}`)}
        className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {summaries.map((s) => (
          <option key={s.headerRowIndex} value={s.headerRowIndex}>
            {s.monthLabel} — Saldo: {formatBRL(s.saldo)}
          </option>
        ))}
      </select>
    </div>
  )
}
