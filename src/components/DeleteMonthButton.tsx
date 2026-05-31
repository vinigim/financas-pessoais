'use client'

import { useState, useTransition } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { deleteMonth } from '@/lib/actions'

interface Props {
  headerRowIndex: number
  monthLabel: string
}

export function DeleteMonthButton({ headerRowIndex, monthLabel }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteMonth(headerRowIndex)
      if (result.ok) {
        setConfirming(false)
        // refresh forces the server component to re-fetch without relying on URL change
        router.refresh()
        router.push('/acerto')
      } else {
        setError(result.error ?? 'Erro ao deletar')
      }
    })
  }

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <AlertTriangle size={14} className="text-amber-400 shrink-0" />
        <span className="text-xs text-zinc-400">
          Deletar <span className="text-zinc-200 font-medium">{monthLabel}</span> e todas as despesas?
        </span>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs px-2.5 py-1 rounded-lg bg-red-700 hover:bg-red-600 text-white font-medium disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Deletando...' : 'Confirmar'}
        </button>
        <button
          onClick={() => { setConfirming(false); setError('') }}
          disabled={isPending}
          className="text-xs px-2.5 py-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
        >
          Cancelar
        </button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-red-400 transition-colors"
        title="Deletar este mês"
      >
        <Trash2 size={13} />
        Deletar mês
      </button>
      {error && <span className="text-xs text-red-400 ml-2">{error}</span>}
    </>
  )
}
