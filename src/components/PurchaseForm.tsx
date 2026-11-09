'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createPurchase, updatePurchase } from '@/lib/purchase-actions'
import {
  PAYMENT_METHODS,
  PURCHASE_CATEGORIES,
  QUICK_STORES,
  installmentValues,
  type PaymentMethod,
  type Purchase,
} from '@/lib/purchase-shared'
import { formatBRL } from '@/lib/utils'

const input =
  'w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
const label = 'text-xs font-medium text-slate-400 mb-1.5 block'

interface Props {
  initial?: Purchase
  today: string
  stores: string[]
  categories: string[]
  onDone: () => void
}

export function PurchaseForm({ initial, today, stores, categories, onDone }: Props) {
  const router = useRouter()
  const [date, setDate] = useState(initial?.date ?? today)
  const [store, setStore] = useState(initial?.store ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [amount, setAmount] = useState(initial ? String(initial.totalAmount) : '')
  const [installments, setInstallments] = useState(String(initial?.installments ?? 1))
  const [category, setCategory] = useState(initial?.category ?? 'Casa')
  const [payment, setPayment] = useState<PaymentMethod>(initial?.paymentMethod ?? 'Cartão de crédito')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  // "1.234,56" (digitado) e "1234.56" (vindo do banco ao editar) valem o mesmo.
  const numAmount = parseFloat(amount.includes(',') ? amount.replace(/\./g, '').replace(',', '.') : amount)
  const numInstallments = parseInt(installments) || 1
  const allStores = Array.from(new Set([...QUICK_STORES, ...stores]))
  const allCategories = Array.from(new Set([...PURCHASE_CATEGORIES, ...categories]))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (isNaN(numAmount)) { setError('Informe o valor total'); return }
    const payload = {
      date,
      store,
      description,
      totalAmount: numAmount,
      installments: payment === 'Cartão de crédito' ? numInstallments : 1,
      category: category || 'Outros',
      paymentMethod: payment,
      notes: notes || null,
    }
    startTransition(async () => {
      const result = initial ? await updatePurchase(initial.id, payload) : await createPurchase(payload)
      if (result.ok) {
        onDone()
        router.refresh()
      } else {
        setError(result.error ?? 'Erro ao salvar')
      }
    })
  }

  const showInstallments = payment === 'Cartão de crédito'
  const parcels = showInstallments && numInstallments > 1 && numAmount > 0
    ? installmentValues(numAmount, numInstallments)
    : null

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-slate-800 border border-slate-600 p-4 space-y-4">
      <p className="text-sm font-semibold text-slate-200">{initial ? 'Editar compra' : 'Nova compra'}</p>

      {!initial && (
        <div className="flex flex-wrap gap-2">
          {QUICK_STORES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStore(s)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                store === s
                  ? 'bg-blue-700 border-blue-500 text-white'
                  : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-blue-700 hover:border-blue-500 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={label}>Loja</label>
          <input className={input} list="purchase-stores" placeholder="ex: Amazon" value={store} onChange={(e) => setStore(e.target.value)} />
          <datalist id="purchase-stores">
            {allStores.map((s) => <option key={s} value={s} />)}
          </datalist>
        </div>
        <div>
          <label className={label}>O que comprou <span className="text-slate-500 font-normal">(opcional)</span></label>
          <input className={input} placeholder="ex: Air fryer" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className={label}>Data da compra</label>
          <input type="date" className={input} value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div>
          <label className={label}>Valor total (R$)</label>
          <input className={input} inputMode="decimal" placeholder="ex: 349,90" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <label className={label}>Pagamento</label>
          <select className={`${input} cursor-pointer`} value={payment} onChange={(e) => setPayment(e.target.value as PaymentMethod)}>
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        {showInstallments && (
          <div>
            <label className={label}>Parcelas</label>
            <select className={`${input} cursor-pointer`} value={installments} onChange={(e) => setInstallments(e.target.value)}>
              {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n === 1 ? 'À vista' : `${n}x`}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className={label}>Categoria</label>
          <input className={input} list="purchase-categories" value={category} onChange={(e) => setCategory(e.target.value)} />
          <datalist id="purchase-categories">
            {allCategories.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div>
          <label className={label}>Observação <span className="text-slate-500 font-normal">(opcional)</span></label>
          <input className={input} placeholder="ex: presente da Gabi" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      {parcels && (
        <p className="text-xs text-slate-400">
          {numInstallments}x de <span className="font-semibold text-blue-300">{formatBRL(parcels[parcels.length - 1])}</span>
          {parcels[0] !== parcels[parcels.length - 1] && <> (1ª de {formatBRL(parcels[0])})</>}
          , a partir do mês da compra.
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
