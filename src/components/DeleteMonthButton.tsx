'use client'

import { useState, useTransition } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { deleteMonth } from '@/lib/actions'

interface Props {
  headerRowIndex: number
  monthLabel: string
}

export function DeleteMonthButton({ headerRowIndex, monthLabel }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteMonth(headerRowIndex)
      if (result.ok) {
        // Hard navigate so the server re-fetches fresh data
        window.location.href = '/acerto'
      } else {
        setError(result.error ?? 'Erro ao deletar')
      }
    })
  }

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <AlertTriangle size={14} className="text-amber-400 shrink-0" />
        <span className="text-sm text-slate-300">
          Deletar <span className="font-semibold text-white">{monthLabel}</span> e todas as despesas?
        </span>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="px-3 py-1.5 text-xs rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Deletando...' : 'Confirmar'}
        </button>
        <button
          onClick={() => { setConfirming(false); setError('') }}
          disabled={isPending}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50 transition-colors"
        >
          Cancelar
        </button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 text-sm text-red-400/70 hover:text-red-400 border border-red-400/20 hover:border-red-400/50 px-3 py-1.5 rounded-lg transition-colors"
    >
      <Trash2 size={13} />
      Deletar mês
    </button>
  )
}
