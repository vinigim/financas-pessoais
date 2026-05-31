import { formatBRL } from '@/lib/utils'
import type { MonthBlock } from '@/lib/types'

export function SummaryCard({ block }: { block: MonthBlock }) {
  const saldoPositive = block.saldo >= 0

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Valor a Pagar</p>
        <p className="text-xl font-semibold text-amber-400">{formatBRL(block.valorAPagar)}</p>
        <p className="text-xs text-zinc-600 mt-1">saldo anterior</p>
      </div>
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Descontos</p>
        <p className="text-xl font-semibold text-blue-400">{formatBRL(block.totalDescontos)}</p>
        <p className="text-xs text-zinc-600 mt-1">{block.expenses.length} lançamentos</p>
      </div>
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Saldo Restante</p>
        <p className={`text-xl font-semibold ${saldoPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {formatBRL(block.saldo)}
        </p>
        <p className="text-xs text-zinc-600 mt-1">carry-forward</p>
      </div>
    </div>
  )
}
