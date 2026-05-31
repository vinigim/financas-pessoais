'use client'

import { useState, useTransition } from 'react'
import { CalendarPlus, Copy } from 'lucide-react'
import { createNewMonth, createNewMonthWithClone } from '@/lib/actions'
import { formatBRL } from '@/lib/utils'
import type { MonthBlock, MonthSummary } from '@/lib/types'

const PT_MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function suggestNextMonth(lastLabel: string): string {
  const now = new Date()
  const year = now.getFullYear()
  for (let i = 0; i < PT_MONTHS.length; i++) {
    if (lastLabel.startsWith(PT_MONTHS[i])) {
      const next = (i + 1) % 12
      const nextYear = next === 0 ? year + 1 : year
      return `${PT_MONTHS[next]} ${nextYear}`
    }
  }
  return `${PT_MONTHS[now.getMonth()]} ${year}`
}

interface Props {
  lastSummary: MonthSummary
  lastBlock: MonthBlock
}

export function NewMonthDialog({ lastSummary, lastBlock }: Props) {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState(() => suggestNextMonth(lastSummary.monthLabel))
  const [clone, setClone] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim()) { setError('Informe o nome do mês'); return }
    startTransition(async () => {
      const action = clone ? createNewMonthWithClone : createNewMonth
      const result = await action({ monthLabel: label.trim() })
      if (result.ok) {
        setOpen(false)
        setError('')
      } else {
        setError(result.error ?? 'Erro ao criar mês')
      }
    })
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium transition-colors"
        >
          <CalendarPlus size={16} />
          Abrir novo mês
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl bg-slate-800 border border-slate-600 p-4 space-y-4"
        >
          <p className="text-sm font-semibold text-slate-200">Novo Mês</p>

          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Nome do mês</label>
            <input
              className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              autoFocus
            />
          </div>

          <div className="rounded-lg bg-slate-700/50 border border-slate-600 p-3 text-sm">
            <span className="text-slate-400">Valor a Pagar inicial: </span>
            <span className={`font-bold ${lastSummary.saldo >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
              {formatBRL(lastSummary.saldo)}
            </span>
            <span className="text-slate-500 text-xs ml-2">(saldo de {lastSummary.monthLabel})</span>
          </div>

          {/* Clone toggle */}
          <button
            type="button"
            onClick={() => setClone((v) => !v)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
              clone
                ? 'bg-emerald-900/40 border-emerald-600 text-emerald-300'
                : 'bg-slate-700/40 border-slate-600 text-slate-400 hover:border-slate-500'
            }`}
          >
            <div className={`w-9 h-5 rounded-full flex items-center transition-colors shrink-0 ${clone ? 'bg-emerald-500' : 'bg-slate-600'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform mx-0.5 ${clone ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <Copy size={14} />
            <span className="text-sm font-medium">Clonar despesas de {lastSummary.monthLabel}</span>
          </button>

          {clone && lastBlock.expenses.length > 0 && (
            <div className="rounded-lg border border-slate-600 overflow-hidden">
              <div className="px-3 py-2 bg-slate-700 border-b border-slate-600 text-xs font-medium text-slate-400">
                {lastBlock.expenses.length} despesas serão copiadas
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-700">
                {lastBlock.expenses.map((exp) => (
                  <div key={exp.rowIndex} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="text-slate-300">{exp.description}</span>
                    <div className="flex items-center gap-2">
                      {exp.rawFormula && (
                        <span className="text-xs text-slate-500 font-mono">={exp.rawFormula}</span>
                      )}
                      <span className={`font-medium tabular-nums ${exp.resolvedValue < 0 ? 'text-red-400' : 'text-slate-200'}`}>
                        {formatBRL(exp.resolvedValue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              className="px-4 py-2 text-sm rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-medium disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Criando...' : clone ? `Criar com ${lastBlock.expenses.length} despesas` : 'Criar mês vazio'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
