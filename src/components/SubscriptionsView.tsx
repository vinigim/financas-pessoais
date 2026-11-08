'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Pause, Play, CalendarClock } from 'lucide-react'
import { toggleSubscription, deleteSubscription } from '@/lib/subscription-actions'
import {
  CYCLE_LABEL,
  daysUntilBilling,
  monthlyCost,
  type Subscription,
} from '@/lib/subscription-shared'
import { formatBRL, cn } from '@/lib/utils'
import { SubscriptionForm } from './SubscriptionForm'

const CATEGORY_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-fuchsia-500',
  'bg-cyan-500', 'bg-rose-500', 'bg-lime-500', 'bg-violet-500', 'bg-slate-400',
]

function billingText(days: number): string {
  if (days === 0) return 'cobra hoje'
  if (days === 1) return 'cobra amanhã'
  return `cobra em ${days} dias`
}

export function SubscriptionsView({ subscriptions }: { subscriptions: Subscription[] }) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const active = subscriptions.filter((s) => s.active)
  const paused = subscriptions.filter((s) => !s.active)

  const totalMonthly = active.reduce((sum, s) => sum + monthlyCost(s), 0)
  const pausedMonthly = paused.reduce((sum, s) => sum + monthlyCost(s), 0)

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of active) map.set(s.category, (map.get(s.category) ?? 0) + monthlyCost(s))
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [active])

  const sortedActive = [...active].sort((a, b) => monthlyCost(b) - monthlyCost(a))

  const upcoming = active
    .filter((s) => s.billingDay !== null && s.cycle === 'mensal')
    .map((s) => ({ s, days: daysUntilBilling(s.billingDay!) }))
    .filter((u) => u.days <= 7)
    .sort((a, b) => a.days - b.days)

  const categoryNames = Array.from(new Set(subscriptions.map((s) => s.category)))
  const colorOf = (cat: string) =>
    CATEGORY_COLORS[Math.max(0, byCategory.findIndex(([c]) => c === cat)) % CATEGORY_COLORS.length]

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Gasto por mês</p>
          <p className="text-2xl font-bold text-blue-400 tabular-nums">{formatBRL(totalMonthly)}</p>
          <p className="text-xs text-slate-500 mt-1">{active.length} assinaturas ativas</p>
        </div>
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Gasto por ano</p>
          <p className="text-2xl font-bold text-amber-400 tabular-nums">{formatBRL(totalMonthly * 12)}</p>
          <p className="text-xs text-slate-500 mt-1">
            {pausedMonthly > 0 ? `${formatBRL(pausedMonthly)}/mês economizados em pausadas` : 'projeção de 12 meses'}
          </p>
        </div>
      </div>

      {/* Por categoria */}
      {byCategory.length > 0 && totalMonthly > 0 && (
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-4 space-y-3">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Por categoria</p>
          <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
            {byCategory.map(([cat, value], i) => (
              <div
                key={cat}
                className={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                style={{ width: `${(value / totalMonthly) * 100}%` }}
                title={`${cat}: ${formatBRL(value)}`}
              />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
            {byCategory.map(([cat, value], i) => (
              <div key={cat} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className={cn('w-2.5 h-2.5 rounded-sm', CATEGORY_COLORS[i % CATEGORY_COLORS.length])} />
                  {cat}
                </span>
                <span className="tabular-nums text-slate-200">
                  {formatBRL(value)}
                  <span className="text-slate-500 text-xs ml-1.5">{Math.round((value / totalMonthly) * 100)}%</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Próximas cobranças */}
      {upcoming.length > 0 && (
        <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 space-y-2">
          <p className="flex items-center gap-2 text-xs font-medium text-amber-300 uppercase tracking-wide">
            <CalendarClock size={13} /> Próximos 7 dias
          </p>
          {upcoming.map(({ s, days }) => (
            <div key={s.id} className="flex items-center justify-between text-sm">
              <span className="text-slate-200">{s.name} <span className="text-slate-500 text-xs">· {billingText(days)}</span></span>
              <span className="tabular-nums text-slate-100">{formatBRL(s.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Lista */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-2">Ativas</h2>
        <div className="rounded-xl bg-slate-800 border border-slate-700 divide-y divide-slate-700/50 overflow-hidden">
          {sortedActive.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-slate-500">Nenhuma assinatura cadastrada ainda.</p>
          )}
          {sortedActive.map((s) =>
            editingId === s.id ? (
              <div key={s.id} className="p-2">
                <SubscriptionForm initial={s} categories={categoryNames} onDone={() => setEditingId(null)} />
              </div>
            ) : (
              <SubscriptionRow key={s.id} s={s} color={colorOf(s.category)} total={totalMonthly} onEdit={() => setEditingId(s.id)} />
            )
          )}
        </div>
      </div>

      {adding ? (
        <SubscriptionForm categories={categoryNames} onDone={() => setAdding(false)} />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Adicionar assinatura
        </button>
      )}

      {paused.length > 0 && (
        <div className="pt-2">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Pausadas / canceladas</h2>
          <div className="rounded-xl bg-slate-800/50 border border-slate-700/60 divide-y divide-slate-700/50 overflow-hidden">
            {paused.map((s) =>
              editingId === s.id ? (
                <div key={s.id} className="p-2">
                  <SubscriptionForm initial={s} categories={categoryNames} onDone={() => setEditingId(null)} />
                </div>
              ) : (
                <SubscriptionRow key={s.id} s={s} color="bg-slate-600" total={0} onEdit={() => setEditingId(s.id)} />
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SubscriptionRow({ s, color, total, onEdit }: {
  s: Subscription
  color: string
  total: number
  onEdit: () => void
}) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const monthly = monthlyCost(s)

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError('')
    startTransition(async () => {
      const r = await fn()
      if (r.ok) router.refresh()
      else setError(r.error ?? 'Erro')
    })
  }

  function handleDelete() {
    if (!confirm(`Excluir "${s.name}" de vez? (Para só parar de contar, use pausar.)`)) return
    run(() => deleteSubscription(s.id))
  }

  return (
    <div className={cn('group flex items-center gap-3 px-4 py-3', !s.active && 'opacity-60')}>
      <span className={cn('w-1.5 self-stretch rounded-full shrink-0', color)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-100 truncate">{s.name}</p>
        <p className="text-xs text-slate-500 truncate">
          {s.category} · {CYCLE_LABEL[s.cycle]}
          {s.billingDay ? ` · dia ${s.billingDay}` : ''}
          {s.notes ? ` · ${s.notes}` : ''}
        </p>
        {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold tabular-nums text-slate-100">
          {formatBRL(monthly)}<span className="text-xs text-slate-500 font-normal">/mês</span>
        </p>
        <p className="text-xs text-slate-500 tabular-nums">
          {s.cycle !== 'mensal'
            ? `${formatBRL(s.amount)} ${CYCLE_LABEL[s.cycle].toLowerCase()}`
            : total > 0 ? `${Math.round((monthly / total) * 100)}% do total` : ''}
        </p>
      </div>
      <div className="flex gap-1 shrink-0 sm:opacity-40 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-blue-600 transition-colors" title="Editar">
          <Pencil size={13} />
        </button>
        <button
          onClick={() => run(() => toggleSubscription(s.id, !s.active))}
          disabled={isPending}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
          title={s.active ? 'Pausar (não conta no total)' : 'Reativar'}
        >
          {s.active ? <Pause size={13} /> : <Play size={13} />}
        </button>
        <button onClick={handleDelete} disabled={isPending} className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-red-600 disabled:opacity-50 transition-colors" title="Excluir">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}
