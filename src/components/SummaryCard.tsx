import { formatBRL } from '@/lib/utils'
import type { MonthBlock } from '@/lib/types'

export function SummaryCard({ block }: { block: MonthBlock }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-xl bg-slate-800 border border-slate-700 p-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Gastos do Mês</p>
        <p className="text-2xl font-bold text-blue-400">{formatBRL(block.totalDescontos)}</p>
        <p className="text-xs text-slate-500 mt-1">{block.expenses.length} lançamentos</p>
      </div>
      <div className="rounded-xl bg-slate-800 border border-slate-700 p-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
          {block.saldo < 0 ? 'Valor a Pagar pro Vi' : 'Valor a Receber do Vi'}
        </p>
        <p className={`text-2xl font-bold ${block.saldo < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
          {formatBRL(Math.abs(block.saldo))}
        </p>
      </div>
    </div>
  )
}
