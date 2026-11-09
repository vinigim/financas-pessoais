'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react'
import { deletePurchase } from '@/lib/purchase-actions'
import {
  addMonths,
  entriesByMonth,
  groupTotals,
  monthKeyOf,
  monthLabel,
  sumEntries,
  type MonthEntry,
  type MonthKey,
  type Purchase,
} from '@/lib/purchase-shared'
import { formatBRL, cn } from '@/lib/utils'
import { PurchaseForm } from './PurchaseForm'

const BAR_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-fuchsia-500',
  'bg-cyan-500', 'bg-rose-500', 'bg-lime-500', 'bg-violet-500', 'bg-slate-400',
]

function formatDay(date: string): string {
  const [, m, d] = date.split('-')
  return `${d}/${m}`
}

interface Props {
  purchases: Purchase[]
  month: MonthKey
  today: string
}

export function PurchasesView({ purchases, month, today }: Props) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const byMonth = useMemo(() => entriesByMonth(purchases), [purchases])
  const entries = useMemo(
    () => [...(byMonth.get(month) ?? [])].sort((a, b) => b.purchase.date.localeCompare(a.purchase.date) || b.purchase.id - a.purchase.id),
    [byMonth, month]
  )
  const total = sumEntries(entries)
  const currentMonth = today.slice(0, 7)

  const madeThisMonth = purchases.filter((p) => monthKeyOf(p.date) === month)
  const madeTotal = madeThisMonth.reduce((s, p) => s + p.totalAmount, 0)

  // Parcelas que já estão contratadas (compras feitas até este mês) e caem depois dele.
  let committed = 0
  for (const [key, list] of byMonth) {
    if (key <= month) continue
    for (const e of list) if (monthKeyOf(e.purchase.date) <= month) committed += e.amount
  }

  // Média dos 6 meses anteriores ao selecionado.
  const previous = Array.from({ length: 6 }, (_, i) => sumEntries(byMonth.get(addMonths(month, -(i + 1)))))
  const monthsWithData = previous.filter((v) => v > 0).length
  const average = monthsWithData ? previous.reduce((s, v) => s + v, 0) / monthsWithData : 0

  const chartMonths = Array.from({ length: 8 }, (_, i) => addMonths(month, i - 5))
  const chartValues = chartMonths.map((k) => sumEntries(byMonth.get(k)))
  const chartMax = Math.max(...chartValues, 1)

  const byStore = groupTotals(entries, (e) => e.purchase.store)
  const byCategory = groupTotals(entries, (e) => e.purchase.category)

  const stores = Array.from(new Set(purchases.map((p) => p.store)))
  const categories = Array.from(new Set(purchases.map((p) => p.category)))
  const formProps = { today, stores, categories }

  return (
    <div className="space-y-4">
      {/* Navegação de mês */}
      <div className="flex items-center justify-between rounded-xl bg-slate-800 border border-slate-700 px-2 py-1.5">
        <Link href={`/compras?mes=${addMonths(month, -1)}`} className="p-2 rounded-lg text-slate-300 hover:bg-slate-700" aria-label="Mês anterior">
          <ChevronLeft size={18} />
        </Link>
        <div className="text-center">
          <p className="text-sm font-semibold text-white">{monthLabel(month)}</p>
          {month !== currentMonth && (
            <Link href="/compras" className="text-xs text-blue-400 hover:text-blue-300">voltar para o mês atual</Link>
          )}
        </div>
        <Link href={`/compras?mes=${addMonths(month, 1)}`} className="p-2 rounded-lg text-slate-300 hover:bg-slate-700" aria-label="Próximo mês">
          <ChevronRight size={18} />
        </Link>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-4 col-span-2 sm:col-span-1">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Pesa neste mês</p>
          <p className="text-2xl font-bold text-blue-400 tabular-nums">{formatBRL(total)}</p>
          <p className="text-xs text-slate-500 mt-1">
            {average > 0
              ? `média dos 6 meses anteriores: ${formatBRL(average)}`
              : `${entries.length} ${entries.length === 1 ? 'lançamento' : 'lançamentos'}, com parcelas`}
          </p>
        </div>
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Compras do mês</p>
          <p className="text-xl font-bold text-slate-100 tabular-nums">{formatBRL(madeTotal)}</p>
          <p className="text-xs text-slate-500 mt-1">{madeThisMonth.length} {madeThisMonth.length === 1 ? 'compra feita' : 'compras feitas'} (valor cheio)</p>
        </div>
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Parcelas a vencer</p>
          <p className="text-xl font-bold text-amber-400 tabular-nums">{formatBRL(committed)}</p>
          <p className="text-xs text-slate-500 mt-1">nos meses seguintes</p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="rounded-xl bg-slate-800 border border-slate-700 p-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Por mês</p>
        <div className="flex items-end gap-1.5 h-32">
          {chartMonths.map((k, i) => {
            const v = chartValues[i]
            const selected = k === month
            const future = k > currentMonth
            return (
              <Link key={k} href={`/compras?mes=${k}`} className="flex-1 h-full flex flex-col justify-end items-center gap-1 group" title={`${monthLabel(k)}: ${formatBRL(v)}`}>
                <span className={cn('text-[10px] tabular-nums', selected ? 'text-white font-semibold' : 'text-slate-500')}>
                  {v > 0 ? Math.round(v).toLocaleString('pt-BR') : ''}
                </span>
                <div
                  className={cn(
                    'w-full rounded-t-md transition-colors',
                    selected
                      ? 'bg-blue-500'
                      : future
                        ? 'border border-dashed border-slate-500 group-hover:border-slate-300'
                        : 'bg-slate-600 group-hover:bg-slate-500'
                  )}
                  style={{ height: `${Math.max((v / chartMax) * 100, v > 0 ? 4 : 1)}%` }}
                />
              </Link>
            )
          })}
        </div>
        <div className="flex gap-1.5 mt-1.5">
          {chartMonths.map((k) => (
            <span key={k} className={cn('flex-1 text-center text-[10px]', k === month ? 'text-white font-semibold' : 'text-slate-500')}>
              {monthLabel(k, true)}
            </span>
          ))}
        </div>
        <p className="text-[11px] text-slate-500 mt-2">Barras tracejadas: parcelas que ainda vão cair.</p>
      </div>

      {/* Lojas e categorias */}
      {entries.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Breakdown title="Por loja" items={byStore} total={total} />
          <Breakdown title="Por categoria" items={byCategory} total={total} />
        </div>
      )}

      {/* Lista */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-2">Lançamentos de {monthLabel(month)}</h2>
        <div className="rounded-xl bg-slate-800 border border-slate-700 divide-y divide-slate-700/50 overflow-hidden">
          {entries.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-slate-500">Nenhuma compra ou parcela neste mês.</p>
          )}
          {entries.map((e) =>
            editingId === e.purchase.id ? (
              <div key={`${e.purchase.id}-${e.installmentNumber}`} className="p-2">
                <PurchaseForm {...formProps} initial={e.purchase} onDone={() => setEditingId(null)} />
              </div>
            ) : (
              <EntryRow key={`${e.purchase.id}-${e.installmentNumber}`} entry={e} onEdit={() => setEditingId(e.purchase.id)} />
            )
          )}
        </div>
      </div>

      {adding ? (
        <PurchaseForm {...formProps} onDone={() => setAdding(false)} />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Adicionar compra
        </button>
      )}
    </div>
  )
}

function Breakdown({ title, items, total }: { title: string; items: [string, number][]; total: number }) {
  return (
    <div className="rounded-xl bg-slate-800 border border-slate-700 p-4 space-y-2.5">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{title}</p>
      {items.map(([name, value], i) => (
        <div key={name} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300 truncate">{name}</span>
            <span className="tabular-nums text-slate-200 shrink-0 ml-2">
              {formatBRL(value)}
              <span className="text-slate-500 text-xs ml-1.5">{Math.round((value / total) * 100)}%</span>
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
            <div className={cn('h-full rounded-full', BAR_COLORS[i % BAR_COLORS.length])} style={{ width: `${(value / total) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function EntryRow({ entry, onEdit }: { entry: MonthEntry; onEdit: () => void }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const p = entry.purchase
  const parcelado = p.installments > 1

  function handleDelete() {
    const extra = parcelado ? ` Isso apaga as ${p.installments} parcelas.` : ''
    if (!confirm(`Excluir a compra "${p.description || p.store}"?${extra}`)) return
    setError('')
    startTransition(async () => {
      const r = await deletePurchase(p.id)
      if (r.ok) router.refresh()
      else setError(r.error ?? 'Erro')
    })
  }

  return (
    <div className="group flex items-center gap-3 px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-100 truncate">
          {p.store}
          {p.description && <span className="text-slate-400 font-normal"> · {p.description}</span>}
        </p>
        <p className="text-xs text-slate-500 truncate">
          {formatDay(p.date)} · {p.category} · {p.paymentMethod}
          {p.notes ? ` · ${p.notes}` : ''}
        </p>
        {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold tabular-nums text-slate-100">{formatBRL(entry.amount)}</p>
        {parcelado && (
          <p className="text-xs text-slate-500 tabular-nums">
            <span className="hidden sm:inline">parcela </span>
            {entry.installmentNumber}/{p.installments}
            <span className="hidden sm:inline"> de {formatBRL(p.totalAmount)}</span>
          </p>
        )}
      </div>
      <div className="flex gap-1 shrink-0 sm:opacity-40 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-blue-600 transition-colors" title="Editar">
          <Pencil size={13} />
        </button>
        <button onClick={handleDelete} disabled={isPending} className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-red-600 disabled:opacity-50 transition-colors" title="Excluir">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}
