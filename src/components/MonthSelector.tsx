'use client'

import { useRouter } from 'next/navigation'
import type { MonthSummary } from '@/lib/types'
import { formatBRL } from '@/lib/utils'

export function MonthSelector({ summaries, currentMonthId }: {
  summaries: MonthSummary[]
  currentMonthId: number
}) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-slate-300 whitespace-nowrap">Mês</label>
      <select
        value={currentMonthId}
        onChange={(e) => router.push(`/acerto?mes=${e.target.value}`)}
        className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
      >
        {summaries.map((s) => (
          <option key={s.monthId} value={s.monthId}>
            {s.monthLabel} — Saldo: {formatBRL(s.saldo)}
          </option>
        ))}
      </select>
    </div>
  )
}
