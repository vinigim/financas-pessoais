'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AUTH_COOKIE, AUTH_MAX_AGE, authToken, safeEqual } from './auth'

export interface LoginState {
  error?: string
}

function safeNext(next: FormDataEntryValue | null): string {
  const n = typeof next === 'string' ? next : ''
  // Só caminhos internos: evita redirecionar para outro site.
  return n.startsWith('/') && !n.startsWith('//') ? n : '/acerto'
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const expected = process.env.APP_PASSWORD
  if (!expected) return { error: 'APP_PASSWORD não está configurada no servidor.' }

  const typed = String(formData.get('password') ?? '')
  const [a, b] = await Promise.all([authToken(typed), authToken(expected)])
  if (!safeEqual(a, b)) {
    await new Promise((r) => setTimeout(r, 800)) // freia tentativas em sequência
    return { error: 'Senha incorreta' }
  }

  const store = await cookies()
  store.set(AUTH_COOKIE, b, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: AUTH_MAX_AGE,
  })
  redirect(safeNext(formData.get('next')))
}

export async function logout(): Promise<void> {
  const store = await cookies()
  store.delete(AUTH_COOKIE)
  redirect('/login')
}
