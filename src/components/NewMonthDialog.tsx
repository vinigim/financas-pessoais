'use client'

import { useState, useTransition } from 'react'
import { CalendarPlus } from 'lucide-react'
import { createNewMonth } from '@/lib/actions'
import { formatBRL } from '@/lib/utils'
import type { MonthSummary } from '@/lib/types'

const PT_MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function suggestNextMonth(lastLabel: string): string {
  const now = new Date()
  const month = PT_MONTHS[now.getMonth()]
  const year = now.getFullYear()
  // If last label already contains a year, suggest next month
  for (let i = 0; i < PT_MONTHS.length; i++) {
    if (lastLabel.startsWith(PT_MONTHS[i])) {
      const next = (i + 1) % 12
      const nextYear = next === 0 ? year + 1 : year
      return `${PT_MONTHS[next]} ${nextYear}`
    }
  }
  return `${month} ${year}`
}

export function NewMonthDialog({ lastSummary }: { lastSummary: MonthSummary }) {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState(() => suggestNextMonth(lastSummary.monthLabel))
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim()) { setError('Informe o nome do mês'); return }
    startTransition(async () => {
      const result = await createNewMonth({ monthLabel: label.trim() })
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

          <div className="rounded-lg bg-zinc-800/50 p-3 text-sm">
            <span className="text-zinc-500">Valor a Pagar inicial: </span>
            <span className={`font-semibold ${lastSummary.saldo >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
              {formatBRL(lastSummary.saldo)}
            </span>
            <span className="text-zinc-600 text-xs ml-2">(saldo de {lastSummary.monthLabel})</span>
          </div>

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
              {isPending ? 'Criando...' : 'Criar mês'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
