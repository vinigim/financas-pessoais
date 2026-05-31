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
      <tr className="bg-slate-700/60">
        <td className="px-4 py-2">
          <input
            className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-1.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            autoFocus
          />
        </td>
        <td className="px-4 py-2">
          <div className="flex flex-col gap-1.5">
            <input
              className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-1.5 text-sm text-slate-100 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Fórmula (ex: 950/2)"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
            />
            <input
              type="number"
              className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-1.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Valor numérico"
              value={val}
              onChange={(e) => setVal(e.target.value)}
            />
          </div>
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </td>
        <td className="px-4 py-2">
          <div className="flex gap-1 justify-end">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition-colors"
              title="Salvar"
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => { setEditing(false); setError('') }}
              className="p-1.5 rounded-lg bg-slate-600 hover:bg-slate-500 text-slate-200 transition-colors"
              title="Cancelar"
            >
              <X size={14} />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="group hover:bg-slate-700/30 transition-colors">
      <td className="px-4 py-2.5 text-sm text-slate-200">{entry.description}</td>
      <td className="px-4 py-2.5 text-sm text-right">
        <span className={`font-medium tabular-nums ${entry.resolvedValue < 0 ? 'text-red-400' : 'text-slate-100'}`}>
          {formatBRL(entry.resolvedValue)}
        </span>
        {entry.isFormula && (
          <span className="ml-2 text-xs text-slate-500 font-mono hidden group-hover:inline">
            ={entry.rawFormula}
          </span>
        )}
      </td>
      <td className="px-4 py-2.5">
        <div className="flex gap-1 justify-end opacity-40 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-blue-600 transition-colors"
            title="Editar"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
            title="Remover"
          >
            <Trash2 size={13} />
          </button>
        </div>
        {error && <p className="text-xs text-red-400 text-right">{error}</p>}
      </td>
    </tr>
  )
}
