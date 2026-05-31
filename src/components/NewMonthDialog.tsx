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
    <div className="mt-6">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-emerald-400 transition-colors"
        >
          <CalendarPlus size={16} />
          Abrir novo mês
        </button>
      )}

      {open && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl bg-zinc-900 border border-zinc-700 p-4 space-y-3"
        >
          <p className="text-sm font-medium text-zinc-300">Novo Mês</p>

          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Nome do mês</label>
            <input
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              autoFocus
            />
          </div>

          {/* Saldo carry-forward info */}
          <div className="rounded-lg bg-zinc-800/50 p-3 text-sm">
            <span className="text-zinc-500">Valor a Pagar inicial: </span>
            <span className={`font-semibold ${lastSummary.saldo >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
              {formatBRL(lastSummary.saldo)}
            </span>
            <span className="text-zinc-600 text-xs ml-2">(saldo de {lastSummary.monthLabel})</span>
          </div>

          {/* Clone toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setClone((v) => !v)}
              className={`w-9 h-5 rounded-full flex items-center transition-colors ${clone ? 'bg-emerald-600' : 'bg-zinc-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform mx-0.5 ${clone ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <div className="flex items-center gap-1.5">
              <Copy size={13} className={clone ? 'text-emerald-400' : 'text-zinc-500'} />
              <span className="text-sm text-zinc-300">Clonar despesas de {lastSummary.monthLabel}</span>
            </div>
          </label>

          {/* Preview of expenses to clone */}
          {clone && lastBlock.expenses.length > 0 && (
            <div className="rounded-lg border border-zinc-700/60 overflow-hidden">
              <div className="px-3 py-1.5 bg-zinc-800/60 border-b border-zinc-700/60 text-xs text-zinc-500">
                {lastBlock.expenses.length} despesas serão copiadas
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-zinc-800">
                {lastBlock.expenses.map((exp) => (
                  <div key={exp.rowIndex} className="flex items-center justify-between px-3 py-1.5 text-sm">
                    <span className="text-zinc-300">{exp.description}</span>
                    <div className="flex items-center gap-2">
                      {exp.rawFormula && (
                        <span className="text-xs text-zinc-600 font-mono">={exp.rawFormula}</span>
                      )}
                      <span className={`tabular-nums ${exp.resolvedValue < 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                        {formatBRL(exp.resolvedValue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={() => { setOpen(false); setError('') }}
              className="px-4 py-2 text-sm rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
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
