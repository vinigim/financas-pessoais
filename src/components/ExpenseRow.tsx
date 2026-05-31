'use client'

import { useState, useTransition } from 'react'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { updateExpense, deleteExpense } from '@/lib/actions'
import { formatBRL } from '@/lib/utils'
import type { ExpenseEntry } from '@/lib/types'

export function ExpenseRow({ entry }: { entry: ExpenseEntry }) {
  const [editing, setEditing] = useState(false)
  const [desc, setDesc] = useState(entry.description)
  const [val, setVal] = useState(entry.resolvedValue.toString())
  const [formula, setFormula] = useState(entry.rawFormula ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      const result = await updateExpense({
        rowIndex: entry.rowIndex,
        description: desc,
        value: parseFloat(val) || 0,
        formulaString: formula || undefined,
      })
      if (result.ok) {
        setEditing(false)
        setError('')
      } else {
        setError(result.error ?? 'Erro ao salvar')
      }
    })
  }

  function handleDelete() {
    if (!confirm(`Remover "${entry.description}"?`)) return
    startTransition(async () => {
      const result = await deleteExpense(entry.rowIndex)
      if (!result.ok) setError(result.error ?? 'Erro ao remover')
    })
  }

  if (editing) {
    return (
      <tr className="bg-zinc-800/50">
        <td className="px-3 py-2">
          <input
            className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </td>
        <td className="px-3 py-2">
          <div className="flex flex-col gap-1">
            <input
              className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Fórmula (ex: =950/2)"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
            />
            <input
              type="number"
              className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Valor numérico"
              value={val}
              onChange={(e) => setVal(e.target.value)}
            />
          </div>
        </td>
        <td className="px-3 py-2">
          <div className="flex gap-1 justify-end">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="p-1 rounded text-emerald-400 hover:bg-emerald-400/10 disabled:opacity-50"
            >
              <Check size={15} />
            </button>
            <button
              onClick={() => { setEditing(false); setError('') }}
              className="p-1 rounded text-zinc-400 hover:bg-zinc-700"
            >
              <X size={15} />
            </button>
          </div>
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </td>
      </tr>
    )
  }

  return (
    <tr className="group border-b border-zinc-800/50 hover:bg-zinc-800/30">
      <td className="px-3 py-2 text-sm text-zinc-200">{entry.description}</td>
      <td className="px-3 py-2 text-sm text-right">
        <span className={entry.resolvedValue < 0 ? 'text-red-400' : 'text-zinc-100'}>
          {formatBRL(entry.resolvedValue)}
        </span>
        {entry.isFormula && (
          <span className="ml-2 text-xs text-zinc-600 font-mono">={entry.rawFormula}</span>
        )}
      </td>
      <td className="px-3 py-2">
        <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setEditing(true)}
            className="p-1 rounded text-zinc-400 hover:text-blue-400 hover:bg-zinc-700"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-1 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-700 disabled:opacity-50"
          >
            <Trash2 size={13} />
          </button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </td>
    </tr>
  )
}
