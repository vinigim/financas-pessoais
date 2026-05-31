import { formatBRL } from '@/lib/utils'
import type { MonthBlock } from '@/lib/types'

export function SummaryCard({ block }: { block: MonthBlock }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-xl bg-slate-800 border border-slate-700 p-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Valor a Pagar</p>
        <p className="text-2xl font-bold text-amber-400">{formatBRL(block.valorAPagar)}</p>
        <p className="text-xs text-slate-500 mt-1">saldo anterior</p>
      </div>
      <div className="rounded-xl bg-slate-800 border border-slate-700 p-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Descontos</p>
        <p className="text-2xl font-bold text-blue-400">{formatBRL(block.totalDescontos)}</p>
        <p className="text-xs text-slate-500 mt-1">{block.expenses.length} lançamentos</p>
      </div>
      <div className="rounded-xl bg-slate-800 border border-slate-700 p-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Saldo Restante</p>
        <p className={`text-2xl font-bold ${block.saldo >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {formatBRL(block.saldo)}
        </p>
        <p className="text-xs text-slate-500 mt-1">carry-forward</p>
      </div>
    </div>
  )
}
