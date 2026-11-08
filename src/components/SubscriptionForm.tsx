'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createSubscription, updateSubscription } from '@/lib/subscription-actions'
import {
  BILLING_CYCLES,
  CATEGORIES,
  CYCLE_LABEL,
  monthlyCost,
  type BillingCycle,
  type Subscription,
} from '@/lib/subscription-shared'
import { formatBRL } from '@/lib/utils'

const QUICK = [
  { name: 'Netflix', category: 'Streaming' },
  { name: 'Spotify', category: 'Música' },
  { name: 'Amazon Prime', category: 'Streaming' },
  { name: 'Disney+', category: 'Streaming' },
  { name: 'Max', category: 'Streaming' },
  { name: 'YouTube Premium', category: 'Streaming' },
  { name: 'iCloud', category: 'Nuvem' },
  { name: 'Google One', category: 'Nuvem' },
  { name: 'ChatGPT', category: 'Software' },
  { name: 'Claude', category: 'Software' },
  { name: 'GymPass', category: 'Saúde' },
]

const input =
  'w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
const label = 'text-xs font-medium text-slate-400 mb-1.5 block'

interface Props {
  initial?: Subscription
  onDone: () => void
  categories: string[]
}

export function SubscriptionForm({ initial, onDone, categories }: Props) {
  const router = useRouter()
  const [name, setName] = useState(initial?.name ?? '')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [cycle, setCycle] = useState<BillingCycle>(initial?.cycle ?? 'mensal')
  const [category, setCategory] = useState(initial?.category ?? 'Streaming')
  const [billingDay, setBillingDay] = useState(initial?.billingDay ? String(initial.billingDay) : '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const numAmount = parseFloat(amount.replace(',', '.'))
  const allCategories = Array.from(new Set([...CATEGORIES, ...categories]))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const day = billingDay ? parseInt(billingDay) : null
    const payload = {
      name,
      amount: numAmount,
      cycle,
      category: category || 'Outros',
      billingDay: day,
      active: initial?.active ?? true,
      notes: notes || null,
    }
    if (isNaN(numAmount)) { setError('Informe o valor'); return }
    if (day !== null && (isNaN(day) || day < 1 || day > 31)) { setError('Dia de cobrança deve ser entre 1 e 31'); return }
    startTransition(async () => {
      const result = initial
        ? await updateSubscription(initial.id, payload)
        : await createSubscription(payload)
      if (result.ok) {
        onDone()
        router.refresh()
      } else {
        setError(result.error ?? 'Erro ao salvar')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-slate-800 border border-slate-600 p-4 space-y-4">
      <p className="text-sm font-semibold text-slate-200">{initial ? 'Editar assinatura' : 'Nova assinatura'}</p>

      {!initial && (
        <div className="flex flex-wrap gap-2">
          {QUICK.map((q) => (
            <button
              key={q.name}
              type="button"
              onClick={() => { setName(q.name); setCategory(q.category) }}
              className="text-xs px-3 py-1.5 rounded-full bg-slate-700 border border-slate-600 text-slate-300 hover:bg-blue-700 hover:border-blue-500 hover:text-white transition-colors"
            >
              {q.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={label}>Nome</label>
          <input className={input} placeholder="ex: Netflix" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div>
          <label className={label}>Categoria</label>
          <input className={input} list="sub-categories" value={category} onChange={(e) => setCategory(e.target.value)} />
          <datalist id="sub-categories">
            {allCategories.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div>
          <label className={label}>Valor cobrado (R$)</label>
          <input className={input} inputMode="decimal" placeholder="ex: 55,90" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <label className={label}>Ciclo de cobrança</label>
          <select className={`${input} cursor-pointer`} value={cycle} onChange={(e) => setCycle(e.target.value as BillingCycle)}>
            {BILLING_CYCLES.map((c) => <option key={c} value={c}>{CYCLE_LABEL[c]}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Dia da cobrança <span className="text-slate-500 font-normal">(opcional)</span></label>
          <input className={input} inputMode="numeric" placeholder="ex: 15" value={billingDay} onChange={(e) => setBillingDay(e.target.value.replace(/\D/g, ''))} />
        </div>
        <div>
          <label className={label}>Observação <span className="text-slate-500 font-normal">(opcional)</span></label>
          <input className={input} placeholder="ex: cartão Nubank" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      {cycle !== 'mensal' && !isNaN(numAmount) && numAmount > 0 && (
        <p className="text-xs text-slate-400">
          Equivale a <span className="font-semibold text-blue-300">{formatBRL(monthlyCost({ amount: numAmount, cycle }))}</span> por mês.
        </p>
      )}

      {error && <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onDone} className="px-4 py-2 text-sm rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={isPending} className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-50 transition-colors">
          {isPending ? 'Salvando...' : initial ? 'Salvar' : 'Adicionar'}
        </button>
      </div>
    </form>
  )
}
