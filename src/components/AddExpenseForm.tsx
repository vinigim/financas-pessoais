'use client'

import { useState, useTransition } from 'react'
import { PlusCircle } from 'lucide-react'
import { addExpense } from '@/lib/actions'

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

export function AddExpenseForm({ headerRowIndex }: { headerRowIndex: number }) {
  const [open, setOpen] = useState(false)
  const [desc, setDesc] = useState('')
  const [value, setValue] = useState('')
  const [formula, setFormula] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function prefill(item: { label: string; formula: string }) {
    setDesc(item.label)
    setFormula(item.formula)
    setValue('')
    setOpen(true)
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
    <div className="mt-4">
      {/* Quick-add chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {QUICK_ADD.map((item) => (
          <button
            key={item.label}
            onClick={() => prefill(item)}
            className="text-xs px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-blue-500 hover:text-blue-300 transition-colors"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Toggle form */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-blue-400 transition-colors"
        >
          <PlusCircle size={16} />
          Adicionar despesa
        </button>
      )}

      {open && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl bg-zinc-900 border border-zinc-700 p-4 space-y-3"
        >
          <p className="text-sm font-medium text-zinc-300">Nova Despesa</p>

          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Descrição</label>
            <input
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ex: Daep"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">
                Fórmula <span className="text-zinc-600">(opcional)</span>
              </label>
              <input
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ex: 950/2"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">
                Valor (R$) <span className="text-zinc-600">(se sem fórmula)</span>
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ex: 49.00"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
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
