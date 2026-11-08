'use client'

import { useActionState } from 'react'
import { Lock } from 'lucide-react'
import { login, type LoginState } from '@/lib/auth-actions'

export function LoginForm({ next }: { next?: string }) {
  const [state, action, isPending] = useActionState<LoginState, FormData>(login, {})

  return (
    <form action={action} className="rounded-xl bg-slate-800 border border-slate-700 p-6 space-y-4">
      <div className="flex items-center gap-2 text-slate-200">
        <Lock size={16} />
        <h1 className="text-lg font-semibold">Controle Mensal Vi e Gabi</h1>
      </div>
      <input type="hidden" name="next" value={next ?? ''} />
      <div>
        <label htmlFor="password" className="text-xs font-medium text-slate-400 mb-1.5 block">Senha</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {state.error && (
        <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="w-full px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  )
}
