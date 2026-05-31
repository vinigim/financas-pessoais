'use client'

import { useState, useTransition, useMemo } from 'react'
import { Plus, History } from 'lucide-react'
import { addExpense } from '@/lib/actions'
import { formatBRL } from '@/lib/utils'
import type { ExpenseHistoryEntry } from '@/lib/types'

const QUICK_ADD = [
  { label: 'Daep', formula: '' },
  { label: 'Internet', formula: '180/2' },
  { label: 'Energia', formula: '' },
  { label: 'Plano Saúde', formula: '' },
  { label: 'Pedágio', formula: '' },
  { label: 'Guarda de Rua', formula: '40/2' },
  { label: 'Faxineira', formula: '950/2' },
  { label: 'Piscineiro', formula: '130/2' },
  { label: 'GymPass', formula: '' },
  { label: 'Aluguel', formula: '2500/2' },
  { label: 'Clube Penapolense', formula: '305/2' },
  { label: 'Babá', formula: '' },
]

interface Props {
  headerRowIndex: number
  expenseHistory: ExpenseHistoryEntry[]
}

export function AddExpenseForm({ headerRowIndex, expenseHistory }: Props) {
  const [open, setOpen] = useState(false)
  const [desc, setDesc] = useState('')
  const [value, setValue] = useState('')
  const [formula, setFormula] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const recentHistory = useMemo(() => {
    if (!desc.trim()) return []
    const needle = desc.trim().toLowerCase()
    return expenseHistory
      .filter((e) => e.description.toLowerCase() === needle)
      .slice(-3)
      .reverse()
  }, [desc, expenseHistory])

  function prefill(item: { label: string; formula: string }) {
    setDesc(item.label)
    setFormula(item.formula)
    setValue('')
    setOpen(true)
  }

  function applyHistory(entry: ExpenseHistoryEntry) {
    setValue(entry.resolvedValue.toString())
    setFormula(entry.rawFormula ?? '')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const numValue = parseFloat(value)
    if (!desc.trim()) { setError('Descrição obrigatória'); return }
    if (!formula && isNaN(numValue)) { setError('Informe o valor ou a fórmula'); return }

    startTransition(async () => {
      const result = await addExpense({
        headerRowIndex,
        description: desc.trim(),
        value: isNaN(numValue) ? 0 : numValue,
        formulaString: formula.trim() || undefined,
      })
      if (result.ok) {
        setDesc('')
        setValue('')
        setFormula('')
        setError('')
        setOpen(false)
      } else {
        setError(result.error ?? 'Erro ao adicionar')
      }
    })
  }

  return (
    <div className="space-y-3">
      {/* Quick-add chips */}
      <div className="flex flex-wrap gap-2">
        {QUICK_ADD.map((item) => (
          <button
            key={item.label}
            onClick={() => prefill(item)}
            className="text-xs px-3 py-1.5 rounded-full bg-slate-800 border border-slate-600 text-slate-300 hover:bg-blue-700 hover:border-blue-500 hover:text-white transition-colors"
          >
            {item.label}
          </button>
        ))}
      </div>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Adicionar despesa
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl bg-slate-800 border border-slate-600 p-4 space-y-4"
        >
          <p className="text-sm font-semibold text-slate-200">Nova Despesa</p>

          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Descrição</label>
            <input
              className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ex: Daep"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              autoFocus
            />
          </div>

          {recentHistory.length > 0 && (
            <div className="rounded-lg border border-slate-600 overflow-hidden">
              <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 border-b border-slate-600">
                <History size={12} className="text-slate-400" />
                <span className="text-xs font-medium text-slate-400">Últimos valores — clique para usar</span>
              </div>
              <div className="divide-y divide-slate-700">
                {recentHistory.map((entry, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => applyHistory(entry)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-700 transition-colors text-left"
                  >
                    <span className="text-slate-300">{entry.monthLabel}</span>
                    <div className="flex items-center gap-2">
                      {entry.rawFormula && (
                        <span className="text-xs text-slate-500 font-mono">={entry.rawFormula}</span>
                      )}
                      <span className={`font-semibold tabular-nums ${entry.resolvedValue < 0 ? 'text-red-400' : 'text-slate-100'}`}>
                        {formatBRL(entry.resolvedValue)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">
                Fórmula <span className="text-slate-500 font-normal">(opcional)</span>
              </label>
              <input
                className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ex: 950/2"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">
                Valor (R$) <span className="text-slate-500 font-normal">(se sem fórmula)</span>
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ex: 49.00"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setOpen(false); setError('') }}
              className="px-4 py-2 text-sm rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
