import type { MonthBlock as MonthBlockType } from '@/lib/types'
import { ExpenseRow } from './ExpenseRow'
import { formatBRL } from '@/lib/utils'

export function MonthBlock({ block }: { block: MonthBlockType }) {
  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden mb-4">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wide">
            <th className="px-3 py-2 text-left font-medium">Descrição</th>
            <th className="px-3 py-2 text-right font-medium">Valor</th>
            <th className="px-3 py-2 w-16" />
          </tr>
        </thead>
        <tbody>
          {block.expenses.map((entry) => (
            <ExpenseRow key={entry.rowIndex} entry={entry} />
          ))}
          {block.expenses.length === 0 && (
            <tr>
              <td colSpan={3} className="px-3 py-6 text-center text-sm text-zinc-600">
                Nenhuma despesa lançada neste mês.
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="border-t border-zinc-700 bg-zinc-800/50">
            <td className="px-3 py-2 text-sm font-medium text-zinc-400">TOTAL DESCONTOS</td>
            <td className="px-3 py-2 text-sm font-semibold text-right text-blue-400">
              {formatBRL(block.totalDescontos)}
            </td>
            <td />
          </tr>
          <tr className="bg-zinc-800/30">
            <td className="px-3 py-2 text-sm font-medium text-zinc-400">TOTAL RESTANTE</td>
            <td className={`px-3 py-2 text-sm font-bold text-right ${block.saldo >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatBRL(block.saldo)}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
