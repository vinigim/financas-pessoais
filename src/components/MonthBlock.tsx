import type { MonthBlock as MonthBlockType } from '@/lib/types'
import { ExpenseRow } from './ExpenseRow'
import { formatBRL } from '@/lib/utils'

export function MonthBlock({ block }: { block: MonthBlockType }) {
  return (
    <div className="rounded-xl bg-slate-800 border border-slate-700 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-750 border-b border-slate-700">
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Descrição</th>
            <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wide">Valor</th>
            <th className="px-4 py-2.5 w-20" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/50">
          {block.expenses.map((entry) => (
            <ExpenseRow key={entry.rowIndex} entry={entry} />
          ))}
          {block.expenses.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">
                Nenhuma despesa lançada neste mês.
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-600 bg-slate-700/40">
            <td className="px-4 py-3 text-sm font-semibold text-slate-300">Total Descontos</td>
            <td className="px-4 py-3 text-sm font-bold text-right text-blue-300">
              {formatBRL(block.totalDescontos)}
            </td>
            <td />
          </tr>
          <tr className="bg-slate-700/60">
            <td className="px-4 py-3 text-sm font-semibold text-slate-300">Saldo Restante</td>
            <td className={`px-4 py-3 text-base font-bold text-right ${block.saldo >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
              {formatBRL(block.saldo)}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
