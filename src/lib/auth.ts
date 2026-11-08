// Senha única do app, lida de APP_PASSWORD (configurada na Vercel).
// O cookie guarda um hash da senha, nunca a senha: trocar APP_PASSWORD
// desloga todo mundo automaticamente. Usa Web Crypto para rodar no proxy.

export const AUTH_COOKIE = 'fp_auth'
export const AUTH_MAX_AGE = 60 * 60 * 24 * 180 // 180 dias

export async function authToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`financas-pessoais:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Comparação em tempo constante entre duas strings de mesmo formato. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
